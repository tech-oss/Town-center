import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import {
  Field, Inp, TextArea, EditorSection, SingleImageUpload, SocialFields, Toast, useToast,
  CARD, MUTED, FOREST, SAGE,
} from "../components/FormKit";
import { getCompanyProfile, getRegistrationDetails, submitCompanyProfile, readableError } from "../api/accommodation";

// The company's MANAGED BY details — name, logo, address and public contact
// details — shown on every one of its property pages. They're reviewed by
// Maidenhead admin before going live, and nothing typed in at registration
// becomes public until the company submits it here.

const EMPTY = { name: "", logo: "", address: "", postal_code: "", phone: "", email: "", website: "", social: {} };

export default function CompanyProfilePage() {
  const { user } = useBusinessAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getCompanyProfile(user.id);
        let start = p.pending ?? (p.exists ? p.live : null);
        // First time: offer what was entered at registration, to edit and
        // submit — it isn't public until approved.
        if (!start) {
          const reg = await getRegistrationDetails(user.id);
          start = { ...EMPTY, name: reg.name ?? "", address: reg.address ?? "", phone: reg.phone ?? "", email: reg.email ?? "", website: reg.website ?? "" };
        }
        if (!cancelled) { setProfile(p); setForm({ ...EMPTY, ...start, social: start.social ?? {} }); }
      } catch (e) {
        if (!cancelled) setError(readableError(e).message);
      }
    })();
    return () => { cancelled = true; };
  }, [user.id]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit() {
    setSaving(true);
    try {
      await submitCompanyProfile(user.id, form);
      setProfile(await getCompanyProfile(user.id));
      setToast("Sent to Maidenhead admin for approval.");
    } catch (e) {
      setToast(readableError(e).message);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <BusinessLayout><p className="text-sm" style={{ color: "#991B1B" }}>{error}</p></BusinessLayout>;
  if (!form) return <BusinessLayout><p className="text-sm" style={{ color: MUTED }}>Loading company profile…</p></BusinessLayout>;

  const status = profile?.status;
  return (
    <BusinessLayout>
      <Toast message={toast} />
      <div className="flex flex-col gap-6 max-w-3xl">
        <Link to="/business/properties" className="text-sm font-semibold w-fit" style={{ color: SAGE }}>← My Properties</Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Company profile</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Shown as <strong>Managed by</strong> on every one of your property pages. Changes are approved by Maidenhead admin before they appear.
          </p>
        </div>

        {status === "Pending Approval" && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "rgba(217,119,6,0.08)", border: "1.5px solid rgba(217,119,6,0.3)", color: "#92400E" }}>
            Waiting for approval. Your property pages show your previously approved details until then. You can still change and resubmit.
          </div>
        )}
        {status === "Changes Rejected" && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "rgba(220,38,38,0.07)", border: "1.5px solid rgba(220,38,38,0.25)", color: "#991B1B" }}>
            <strong>Not approved:</strong> {profile.rejectionReason} Correct the details below and submit them again.
          </div>
        )}
        {!profile?.exists && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "rgba(37,99,235,0.07)", border: "1.5px solid rgba(37,99,235,0.2)", color: "#2563EB" }}>
            We've filled in what you gave us at registration. Nothing here is public until you submit it and it's approved, so check the contact details are the ones you want guests to use.
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
          <EditorSection title="Company">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <Field label="Company name" required span2 hint={`${(form.name ?? "").length}/120`}>
                <Inp value={form.name} maxLength={120} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Address" span2>
                <TextArea rows={2} value={form.address} maxLength={300} onChange={(e) => set("address", e.target.value)} />
              </Field>
              <Field label="Postal Code"><Inp value={form.postal_code} maxLength={20} onChange={(e) => set("postal_code", e.target.value)} /></Field>
            </div>
            <SingleImageUpload label="Company logo" src={form.logo} logo pathPrefix={user.id} ratio={1} ratioLabel="1:1 (Square)" onChange={(v) => set("logo", v)} />
            <p className="text-[11px] mt-2" style={{ color: "#9CA3AF" }}>Shown on your property pages and used as your properties' map marker.</p>
          </EditorSection>

          <EditorSection title="Public contact details" hint="Guests use these to enquire about properties that use the company's details.">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <Field label="Telephone"><Inp value={form.phone} maxLength={40} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="Email"><Inp type="email" value={form.email} maxLength={200} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="Website URL" span2><Inp value={form.website} maxLength={500} onChange={(e) => set("website", e.target.value)} placeholder="https://…" /></Field>
            </div>
            <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>Social links</p>
            <SocialFields links={form.social} onChange={(v) => set("social", v)} />
          </EditorSection>

          <div className="flex justify-end">
            <button type="button" onClick={handleSubmit} disabled={saving || !form.name.trim()}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: SAGE }}>
              {saving ? "Submitting…" : "Submit for approval"}
            </button>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
