import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import { getStayContent, saveStayContent } from "../../api/business/content";
import {
  Field, Inp, TextArea, ImageStrip, SocialEditor, ChipListEditor,
  EditorSection, SaveBar, MUTED, CARD,
} from "../components/FormKit";

export default function StayContentEditor({ account }) {
  const { data: saved, loading } = useFetch(() => getStayContent(account.id), [account.id]);

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  if (saved && form === null) setForm(JSON.parse(JSON.stringify(saved)));

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); setDirty(true); }

  async function handleSave() {
    setSaving(true);
    await saveStayContent(account.id, form);
    setSaving(false);
    setDirty(false);
    setSavedAt(Date.now());
  }

  if (loading || !form) return <p className="text-sm" style={{ color: MUTED }}>Loading…</p>;

  const isHotel = account.subType === "hotel";

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
      <EditorSection title="Page Content">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Tagline" span2>
            <Inp value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Short line shown under your name…" />
          </Field>
          <Field label="Description" span2>
            <TextArea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={isHotel ? "Full description of your hotel…" : "Full description of your property…"} />
          </Field>
        </div>
      </EditorSection>

      <EditorSection title="Hero Image">
        <ImageStrip images={form.heroImage ? [form.heroImage] : []} max={1}
          onChange={(v) => set("heroImage", v[0] ?? null)} label="Hero Image" />
      </EditorSection>

      <EditorSection title="Photo Gallery">
        <ImageStrip images={form.galleryImages ?? []} onChange={(v) => set("galleryImages", v)} max={8} label="Gallery Images" />
      </EditorSection>

      <EditorSection title="Find Us">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Address" span2>
            <Inp value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, Maidenhead, postcode" />
          </Field>
          <Field label="Latitude">
            <Inp value={form.lat} onChange={(e) => set("lat", e.target.value)} placeholder="e.g. 51.5225" />
          </Field>
          <Field label="Longitude">
            <Inp value={form.lng} onChange={(e) => set("lng", e.target.value)} placeholder="e.g. -0.7234" />
          </Field>
        </div>
      </EditorSection>

      <EditorSection title="Contact">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <Inp value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01628 555 000" />
          </Field>
          <Field label="Website">
            <Inp value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Booking / Contact Email" span2>
            <Inp value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="stay@…" />
          </Field>
        </div>
      </EditorSection>

      <EditorSection title={isHotel ? "Facilities" : "Amenities"}>
        <ChipListEditor items={form.amenities ?? []} onChange={(v) => set("amenities", v)} placeholder={isHotel ? "e.g. Spa & swimming pool" : "e.g. Fully equipped kitchen"} />
      </EditorSection>

      <EditorSection title="Room Facilities">
        <ChipListEditor items={form.roomFacilities ?? []} onChange={(v) => set("roomFacilities", v)} placeholder="e.g. Flat-screen TV" />
      </EditorSection>

      <EditorSection title="Social Links">
        <SocialEditor links={form.socialLinks} onChange={(v) => set("socialLinks", v)} />
      </EditorSection>

      <SaveBar onSave={handleSave} saving={saving} dirty={dirty} savedAt={savedAt} />
    </div>
  );
}
