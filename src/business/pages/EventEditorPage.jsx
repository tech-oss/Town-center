import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import {
  Field, Inp, TextArea, Select, SocialFields, LocationFields, GalleryGrid,
  EditorSection, Toast, useToast, FOREST, SAGE, MUTED, BORDER, CARD,
} from "../components/FormKit";
import { getEvent, createEvent, updateEvent } from "../api/businessEvents";

const EMPTY = {
  title: "", subtitle: "", description: "",
  eventDate: "", eventTime: "", entryType: "Free",
  location: "", lat: "", lng: "",
  social: {}, website: "", bookingUrl: "",
  gallery: [], status: "Draft",
};

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
          <EditorSection title="Event Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Event Title" required span2><Inp value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Event title…" /></Field>
              <Field label="Event Sub Title" span2><Inp value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Short tagline…" /></Field>
              <Field label="Event Description" span2><TextArea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the event…" /></Field>
              <Field label="Event Date"><Inp type="date" value={form.eventDate ?? ""} onChange={(e) => set("eventDate", e.target.value)} /></Field>
              <Field label="Event Time" hint="e.g. 7:00 PM or 10am - 4pm"><Inp value={form.eventTime ?? ""} onChange={(e) => set("eventTime", e.target.value)} /></Field>
              <Field label="Entry">
                <Select value={form.entryType} onChange={(e) => set("entryType", e.target.value)}>
                  <option>Free</option><option>Paid</option>
                </Select>
              </Field>
              <Field label="Location"><Inp value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Maidenhead Town Hall" /></Field>
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
            <GalleryGrid images={form.gallery ?? []} onChange={(v) => set("gallery", v)} max={6} pathPrefix={user.id} />
          </EditorSection>

          <div className="flex gap-3 flex-wrap pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
            <button onClick={() => handleSave(false)} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50" style={{ backgroundColor: "rgba(28,46,56,0.06)", color: FOREST }}>Save as Draft</button>
            <button onClick={() => handleSave(true)} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: SAGE }}>Submit for Approval</button>
            <button onClick={() => navigate("/business/events")} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
