import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import { saveBusinessEvent, getSpotlightBusinesses } from "../../api/admin";
import { EVENT_CATEGORY_OPTIONS, toSeeDoSlugs } from "../../lib/eventCategories";
import {
  Field, Inp, TextArea, EditorSection, SaveBar, Toggle,
  SingleImageUpload, GalleryGrid, SocialFields, LocationFields, CARD,
} from "./businessContent/shared";
import { NAVY, MUTED, BORDER, BLUE } from "../theme";
import { WEEKDAYS, ORDINAL_OPTIONS, describeRecurrence } from "../../lib/eventRecurrence";
import UKDateInput from "../components/UKDateInput";

// Admin-authored event pages. Deliberately the same shape as the See & Do
// business content editor (TypeAEditor) — profile, find us, gallery, location
// pin — since an event page renders the same way a See & Do place does. The
// opening-hours block is the one thing left out: an event has a date and a
// time, not a weekly schedule.
//
// A business is optional. With none attached the event is a town event, which
// still gets its own page and still shows in See & Do.

const BLANK = {
  businessId: "",
  title: "",
  excerpt: "",
  description: "",
  heroImage: "",
  category: [],
  eventDate: "",
  dateLabel: "",
  eventTime: "",
  entryType: "Free",
  tickets: "",
  location: "",
  phone: "",
  email: "",
  website: "",
  bookingUrl: "",
  social: {},
  gallery: [],
  lat: null,
  lng: null,
  status: "Live",
  isRecurring: false,
  recurrenceType: "weekly",
  recurrenceDays: [],
  recurrenceOrdinals: [1],
  recurrenceEndDate: "",
};

const chip = (on) => (on
  ? { border: `1.5px solid ${BLUE}`, backgroundColor: "rgba(37,99,235,0.07)" }
  : { border: `1.5px solid ${BORDER}`, backgroundColor: "#fff" });

// Repeat settings — the same choices a business has when it adds an event
// (business-dashboard's EventEditorPage): weekly, every two weeks, or a
// weekday each month (1st, 2nd, 3rd, 4th or last), with an optional end date.
function RecurrenceFields({ form, set }) {
  const days = form.recurrenceDays ?? [];
  const ordinals = form.recurrenceOrdinals ?? [];
  const isMonthly = form.recurrenceType === "monthly_by_weekday";
  const preview = describeRecurrence({ type: form.recurrenceType || "weekly", days, ordinals });
  function toggleDay(day) {
    if (isMonthly) { set("recurrenceDays", [day]); return; }
    set("recurrenceDays", days.includes(day) ? days.filter((d) => d !== day) : [...days, day]);
  }
  function toggleOrdinal(v) {
    set("recurrenceOrdinals", ordinals.includes(v) ? ordinals.filter((o) => o !== v) : [...ordinals, v]);
  }
  return (
    <div className="flex flex-col gap-4 mt-4 p-4 rounded-xl" style={{ backgroundColor: "#f8fafc", border: `1.5px solid ${BORDER}` }}>
      <Field label="Repeats">
        <select value={form.recurrenceType || "weekly"}
          onChange={(e) => {
            set("recurrenceType", e.target.value);
            // Monthly repeats on one weekday.
            if (e.target.value === "monthly_by_weekday" && days.length > 1) set("recurrenceDays", days.slice(0, 1));
          }}
          className="rounded-xl px-3 py-2.5 text-sm outline-none w-full"
          style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }}>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Every 2 weeks</option>
          <option value="monthly_by_weekday">Monthly, on a specific weekday</option>
        </select>
      </Field>

      {isMonthly && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>Which week(s) of the month</p>
          <div className="flex flex-wrap gap-2">
            {ORDINAL_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer" style={chip(ordinals.includes(o.value))}>
                <input type="checkbox" checked={ordinals.includes(o.value)} onChange={() => toggleOrdinal(o.value)} className="w-3.5 h-3.5" />
                <span className="text-xs font-medium" style={{ color: NAVY }}>{o.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>{isMonthly ? "Weekday" : "Day(s) of the week"}</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <label key={day} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer" style={chip(days.includes(day))}>
              <input type={isMonthly ? "radio" : "checkbox"} name="recurrence-day" checked={days.includes(day)} onChange={() => toggleDay(day)} className="w-3.5 h-3.5" />
              <span className="text-xs font-medium" style={{ color: NAVY }}>{day}</span>
            </label>
          ))}
        </div>
      </div>

      <Field label="Ends" hint="Leave blank for no end date">
        <UKDateInput value={form.recurrenceEndDate ?? ""} min={form.eventDate || undefined} onChange={(e) => set("recurrenceEndDate", e.target.value)} />
      </Field>

      {preview && days.length > 0 && (
        <p className="text-xs font-semibold" style={{ color: BLUE }}>Repeats: {preview}{form.recurrenceEndDate ? `, until ${form.recurrenceEndDate.split("-").reverse().join("/")}` : ""}</p>
      )}
    </div>
  );
}

export default function EventEditor({ initial, onSaved, onCancel }) {
  // Older events carry the original What's On labels (Music, Market…);
  // they open already mapped onto the See & Do categories, and save that way.
  const [form, setForm] = useState(initial
    ? { ...BLANK, ...initial, category: toSeeDoSlugs(initial.category ?? []) }
    : BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { data: businesses } = useFetch(getSpotlightBusinesses, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function toggleCategory(c) {
    setForm((f) => {
      const has = (f.category ?? []).includes(c);
      return { ...f, category: has ? f.category.filter((x) => x !== c) : [...(f.category ?? []), c] };
    });
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("A title is required."); return; }
    if (form.isRecurring) {
      if (!form.eventDate) { setError("Choose the first date of the repeating event."); return; }
      if (!(form.recurrenceDays ?? []).length) { setError("Choose the day(s) the event repeats on."); return; }
      if (form.recurrenceType === "monthly_by_weekday" && !(form.recurrenceOrdinals ?? []).length) { setError("Choose which week(s) of the month it repeats."); return; }
      if (form.recurrenceEndDate && form.recurrenceEndDate < form.eventDate) { setError("The end date is before the first date."); return; }
    }
    setSaving(true);
    setError("");
    try {
      const saved = await saveBusinessEvent(form);
      onSaved(saved, !initial?.id);
    } catch (e) {
      // A duplicate slug is the one failure an admin can actually act on.
      setError(e?.message?.includes("duplicate key")
        ? "Another event already uses that web address (slug). Change the title slightly."
        : e?.message ?? "Could not save the event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <button onClick={onCancel} className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: NAVY }}>
        ← Back to events
      </button>

      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
        <div>
          <h2 className="text-lg font-bold" style={{ color: NAVY }}>
            {initial?.id ? "Edit Event" : "Create Event"}
          </h2>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            Events appear in See &amp; Do, and can be put on the homepage from Home Page Featured → See &amp; Do.
          </p>
        </div>

        <EditorSection title="Event Details">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Event Title" required hint={`${(form.title ?? "").length}/60`}>
              <Inp value={form.title ?? ""} maxLength={60} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Subtitle" hint={`Shown under the title on the event page, calendar and homepage cards · ${(form.subtitle ?? form.excerpt ?? "").length}/160`}>
              <Inp value={form.subtitle ?? form.excerpt ?? ""} maxLength={160} onChange={(e) => set("subtitle", e.target.value)} />
            </Field>
          </div>

          <Field label="Description" hint={`The intro on the event page · ${(form.description ?? "").length}/600`}>
            <TextArea rows={5} value={form.description ?? ""} maxLength={600} onChange={(e) => set("description", e.target.value)} />
          </Field>

          <div className="mt-4">
            <p className="text-xs font-semibold mb-1" style={{ color: MUTED }}>Category</p>
            <p className="text-[11px] mb-2" style={{ color: "#9CA3AF" }}>The same categories as the See &amp; Do page — the event is listed under each one picked. The first is its main category.</p>
            <div className="flex gap-2 flex-wrap">
              {EVENT_CATEGORY_OPTIONS.map((c) => {
                const on = (form.category ?? []).includes(c.value);
                return (
                  <button key={c.value} type="button" onClick={() => toggleCategory(c.value)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={on
                      ? { backgroundColor: "#2F8C8C", color: "#fff", border: "1.5px solid #2F8C8C" }
                      : { backgroundColor: "#fff", color: NAVY, border: `1.5px solid ${BORDER}` }}>
                    {on && "✓ "}{c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label={form.isRecurring ? "First date" : "Date"}>
              <UKDateInput value={form.eventDate ?? ""} onChange={(e) => set("eventDate", e.target.value)} />
            </Field>
            <Field label="Date label" hint="Optional wording shown instead of the date, e.g. “Every Sunday morning”">
              <Inp value={form.dateLabel ?? ""} onChange={(e) => set("dateLabel", e.target.value)} />
            </Field>
            <Field label="Time" hint="Free text, e.g. “12pm – 5pm”">
              <Inp value={form.eventTime ?? ""} onChange={(e) => set("eventTime", e.target.value)} />
            </Field>
            <Field label="Entry type" hint="Shown on the event page when the ticket details below are left blank">
              <select
                value={form.entryType ?? "Free"}
                onChange={(e) => set("entryType", e.target.value)}
                className="rounded-xl px-3 py-2.5 text-sm outline-none w-full"
                style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }}
              >
                <option>Free</option>
                <option>Paid</option>
              </select>
            </Field>
            <Field label="Ticket / entry details" span2 hint="Printed on the event page beside the ticket icon, e.g. “Free entry, no booking needed” or “£12 — book online”. Leave blank to show the entry type instead.">
              <Inp value={form.tickets ?? ""} onChange={(e) => set("tickets", e.target.value)} />
            </Field>
          </div>

          {/* A repeating event shows on every date it runs in the calendar,
              on the website and in the app. */}
          <div className="mt-5">
            <Toggle checked={!!form.isRecurring} onChange={(v) => set("isRecurring", v)} label="This is a repeating event" />
            {form.isRecurring && <RecurrenceFields form={form} set={set} />}
          </div>

          <div className="flex flex-wrap gap-8 mt-4">
            <SingleImageUpload label="Hero Image" src={form.heroImage} aspect="aspect-[16/9]" onChange={(v) => set("heroImage", v)} />
          </div>
        </EditorSection>

        <EditorSection title="Find Us">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Location" span2>
              <Inp value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Venue and address" />
            </Field>
            <Field label="Phone" hint="Renders as a clickable tel: link on the public page">
              <Inp value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email" hint="Renders as a clickable mailto: link">
              <Inp value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Website URL">
              <Inp value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="Booking / Tickets URL">
              <Inp value={form.bookingUrl ?? ""} onChange={(e) => set("bookingUrl", e.target.value)} placeholder="https://…" />
            </Field>
          </div>
          <p className="text-xs font-semibold mb-2 pt-4" style={{ borderTop: "1px solid rgba(16,24,40,0.1)" }}>Social Links</p>
          <SocialFields links={form.social ?? {}} onChange={(v) => set("social", v)} />
        </EditorSection>

        <EditorSection title="Image Gallery" hint="Gallery images (up to 6) — these appear in the photo gallery on the event page.">
          <GalleryGrid images={form.gallery ?? []} onChange={(v) => set("gallery", v)} max={6} />
        </EditorSection>

        <EditorSection title="Location Pin">
          <LocationFields lat={form.lat} lng={form.lng} onChange={({ lat, lng }) => { set("lat", lat); set("lng", lng); }} />
        </EditorSection>

        <EditorSection title="Linked Business" hint="Optional. Leave as a town event when the event isn't run by a registered business — it still appears in See & Do.">
          <Field label="Business">
            <select
              value={form.businessId ?? ""}
              onChange={(e) => set("businessId", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none w-full"
              style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }}
            >
              <option value="">Town event — no business</option>
              {(businesses ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        </EditorSection>

        {error && (
          <p className="text-xs font-semibold" style={{ color: "#991B1B" }}>{error}</p>
        )}

        <SaveBar onSave={handleSave} saving={saving} />
      </div>
    </div>
  );
}
