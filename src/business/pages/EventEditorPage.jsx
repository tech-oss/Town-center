import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import {
  Field, Inp, TextArea, Select, CheckGroup, SocialFields, LocationFields, GalleryGrid,
  EditorSection, Toast, useToast, Toggle, FOREST, SAGE, MUTED, BORDER, CARD,
} from "../components/FormKit";
import { getEvent, createEvent, updateEvent } from "../api/businessEvents";
import { SEE_DO_CATEGORIES } from "../../Data/businessPortalMock";
import { WEEKDAYS, ORDINAL_OPTIONS, describeRecurrence } from "../api/eventRecurrence";

const EMPTY = {
  title: "", subtitle: "", description: "",
  category: [], // event sub-category, max 2 — from SEE_DO_CATEGORIES
  eventDate: "", eventTime: "", entryType: "Free",
  location: "", lat: "", lng: "",
  social: {}, website: "", bookingUrl: "",
  gallery: [], status: "Draft",
  isRecurring: false, recurrenceType: "weekly", recurrenceDays: [], recurrenceOrdinals: [1], recurrenceEndDate: "",
};

function RecurrenceFields({ form, set }) {
  function toggleDay(day) {
    const days = form.recurrenceDays ?? [];
    set("recurrenceDays", days.includes(day) ? days.filter((d) => d !== day) : [...days, day]);
  }
  function toggleOrdinal(v) {
    const ords = form.recurrenceOrdinals ?? [];
    set("recurrenceOrdinals", ords.includes(v) ? ords.filter((o) => o !== v) : [...ords, v]);
  }
  const isMonthly = form.recurrenceType === "monthly_by_weekday";
  const preview = describeRecurrence({
    type: form.recurrenceType,
    days: form.recurrenceDays,
    ordinals: form.recurrenceOrdinals,
  });

  return (
    <div className="flex flex-col gap-4 mt-4 p-4 rounded-xl" style={{ backgroundColor: "#f8fafc", border: `1.5px solid ${BORDER}` }}>
      <Field label="Repeats">
        <Select value={form.recurrenceType} onChange={(e) => set("recurrenceType", e.target.value)}>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Every 2 weeks</option>
          <option value="monthly_by_weekday">Monthly, on a specific weekday</option>
        </Select>
      </Field>

      {isMonthly && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>Which occurrence(s) of the month</p>
          <div className="flex flex-wrap gap-2">
            {ORDINAL_OPTIONS.map((o) => {
              const checked = (form.recurrenceOrdinals ?? []).includes(o.value);
              return (
                <label key={o.value} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer"
                  style={checked ? { border: `1.5px solid ${SAGE}`, backgroundColor: "rgba(37,99,235,0.07)" } : { border: `1.5px solid ${BORDER}`, backgroundColor: "#fff" }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleOrdinal(o.value)} className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium" style={{ color: FOREST }}>{o.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>{isMonthly ? "Weekday" : "Day(s) of the week"}</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => {
            const checked = (form.recurrenceDays ?? []).includes(day);
            const disabled = isMonthly && checked === false && (form.recurrenceDays ?? []).length >= 1;
            return (
              <label key={day} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.4 : 1,
                  ...(checked ? { border: `1.5px solid ${SAGE}`, backgroundColor: "rgba(37,99,235,0.07)" } : { border: `1.5px solid ${BORDER}`, backgroundColor: "#fff" }),
                }}>
                <input type="checkbox" checked={checked} disabled={disabled}
                  onChange={() => { if (isMonthly) { set("recurrenceDays", [day]); } else { toggleDay(day); } }}
                  className="w-3.5 h-3.5" />
                <span className="text-xs font-medium" style={{ color: FOREST }}>{day}</span>
              </label>
            );
          })}
        </div>
      </div>

      <Field label="Ends" hint="Leave blank for no end date">
        <Inp type="date" value={form.recurrenceEndDate ?? ""} onChange={(e) => set("recurrenceEndDate", e.target.value)} />
      </Field>

      {preview && (form.recurrenceDays ?? []).length > 0 && (
        <p className="text-xs font-semibold" style={{ color: SAGE }}>Preview: {preview}</p>
      )}
    </div>
  );
}

export default function EventEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useBusinessAuth();

  const [form, setForm] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useToast();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getEvent(id).then((data) => {
      if (!cancelled && data) { setForm(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [id]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSave(submit) {
    if (!form.category?.length) { setToast("Please select at least one event category."); return; }
    if (form.isRecurring && !(form.recurrenceDays ?? []).length) { setToast("Please select at least one day for the recurring event."); return; }
    setSaving(true);
    const status = submit ? "Pending Approval" : "Draft";
    const next = { ...form, status };
    try {
      if (id) {
        await updateEvent(id, next);
      } else {
        await createEvent(user.id, next);
      }
      setToast(submit ? "Event submitted — it will go live once approved by admin." : "Event saved as draft.");
      setTimeout(() => navigate("/business/events"), 900);
    } catch {
      setToast("Something went wrong saving your event.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <BusinessLayout>
        <p className="text-sm" style={{ color: MUTED }}>Loading event…</p>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout>
      <Toast message={toast} />
      <div className="flex flex-col gap-6 max-w-3xl pb-10">
        <button onClick={() => navigate("/business/events")} className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: FOREST }}>← Request Event</button>
        <h1 className="text-2xl font-bold" style={{ color: FOREST }}>{id ? "Edit Event" : "New Event"}</h1>

        <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
          <EditorSection title="Event Category" hint="Select up to 2">
            <CheckGroup options={SEE_DO_CATEGORIES} selected={form.category ?? []} onChange={(v) => set("category", v)} max={2} />
          </EditorSection>

          <EditorSection title="Event Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Event Title" required span2><Inp value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Event title…" /></Field>
              <Field label="Event Sub Title" span2><Inp value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Short tagline…" /></Field>
              <Field label="Event Description" span2><TextArea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the event…" /></Field>
              <Field label={form.isRecurring ? "First Occurrence Date" : "Event Date"}><Inp type="date" value={form.eventDate ?? ""} onChange={(e) => set("eventDate", e.target.value)} /></Field>
              <Field label="Event Time" hint="e.g. 7:00 PM or 10am - 4pm"><Inp value={form.eventTime ?? ""} onChange={(e) => set("eventTime", e.target.value)} /></Field>
              <Field label="Entry">
                <Select value={form.entryType} onChange={(e) => set("entryType", e.target.value)}>
                  <option>Free</option><option>Paid</option>
                </Select>
              </Field>
              <Field label="Location"><Inp value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Maidenhead Town Hall" /></Field>
            </div>

            <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <Toggle checked={!!form.isRecurring} onChange={(v) => set("isRecurring", v)}
                label="This event repeats" sublabel="e.g. a weekly Sunday market — set the pattern below" />
              {form.isRecurring && <RecurrenceFields form={form} set={set} />}
              {form.isRecurring && id && (
                <button type="button" onClick={() => navigate(`/business/events/${id}/dates`)}
                  className="mt-3 text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: SAGE }}>
                  Manage individual dates →
                </button>
              )}
            </div>
          </EditorSection>

          <EditorSection title="Location Coordinates" hint="Optional — used to show the event on the map">
            <LocationFields lat={form.lat} lng={form.lng} onChange={({ lat, lng }) => { set("lat", lat); set("lng", lng); }} />
          </EditorSection>

          <EditorSection title="Links">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <Field label="Website URL"><Inp value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" /></Field>
              <Field label="Booking URL"><Inp value={form.bookingUrl} onChange={(e) => set("bookingUrl", e.target.value)} placeholder="https://…" /></Field>
            </div>
            <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>Social Links (optional)</p>
            <SocialFields links={form.social} onChange={(v) => set("social", v)} />
          </EditorSection>

          <EditorSection title="Image Gallery" hint="Up to 6 photos">
            <GalleryGrid images={form.gallery ?? []} onChange={(v) => set("gallery", v)} max={6} pathPrefix={user.id} ratio={1} ratioLabel="1:1 (Square)" />
          </EditorSection>

          <div className="flex gap-3 flex-wrap pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
            <button onClick={() => handleSave(false)} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50" style={{ backgroundColor: "rgba(16,24,40,0.06)", color: FOREST }}>Save as Draft</button>
            <button onClick={() => handleSave(true)} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: SAGE }}>Submit for Approval</button>
            <button onClick={() => navigate("/business/events")} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
