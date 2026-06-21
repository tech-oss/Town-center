import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import { getSettings, saveSettings } from "../../api/admin";
import LoadingState from "../components/LoadingState";

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
      <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>{title}</h2>
      {children}
    </div>
  );
}

function FormField({ label, type = "text", value, onChange, help }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
        style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332", backgroundColor: "#fff" }}
      />
      {help && <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{help}</span>}
    </label>
  );
}

function Toggle({ label, checked, onChange, help }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5 shrink-0" onClick={() => onChange(!checked)}>
        <div className="w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: checked ? "#2D6A4F" : "#D1D5DB" }} />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: checked ? "translateX(20px)" : "none" }} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium" style={{ color: "#1B4332" }}>{label}</span>
        {help && <span className="text-xs" style={{ color: "#9CA3AF" }}>{help}</span>}
      </div>
    </label>
  );
}

export default function SettingsPage() {
  const { data: settings, loading } = useFetch(getSettings, []);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  const current = form ?? settings;
  const set = (section, key, value) => setForm((f) => ({ ...(f ?? settings), [section]: { ...(f ?? settings)[section], [key]: value } }));

  if (loading || !current) return <LoadingState />;

  function handleSave(e) {
    e.preventDefault();
    saveSettings(current).then(() => { setSaved(true); setTimeout(() => setSaved(false), 3000); });
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Admin account details and platform configuration.</p>
      </div>

      <SectionCard title="Admin Account">
        <FormField label="Display Name" value={current.admin.name} onChange={(v) => set("admin", "name", v)} />
        <FormField label="Email" type="email" value={current.admin.email} onChange={(v) => set("admin", "email", v)} />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Role</span>
          <span className="text-sm font-medium px-3 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(27,67,50,0.05)", color: "#1B4332" }}>{current.admin.role}</span>
        </div>
      </SectionCard>

      <SectionCard title="Platform Configuration">
        <FormField label="Site Name" value={current.platform.siteName} onChange={(v) => set("platform", "siteName", v)} />
        <FormField label="Support Email" type="email" value={current.platform.supportEmail} onChange={(v) => set("platform", "supportEmail", v)} />
        <FormField label="XML Feed Sync Hour (UTC)" type="number" value={current.platform.xmlSyncHour} onChange={(v) => set("platform", "xmlSyncHour", Number(v))} help="Properties XML feeds are synced once daily at this hour." />
        <FormField label="Max Gallery Images per Listing" type="number" value={current.platform.maxGalleryImages} onChange={(v) => set("platform", "maxGalleryImages", Number(v))} />
        <FormField label="Max Featured Listings on Homepage" type="number" value={current.platform.featuredListingsMax} onChange={(v) => set("platform", "featuredListingsMax", Number(v))} />
        <Toggle
          label="Require approval before publishing listings"
          checked={current.platform.approvalRequired}
          onChange={(v) => set("platform", "approvalRequired", v)}
          help="When enabled, new and edited listings go through the Approval Queue before going live."
        />
      </SectionCard>

      <div className="flex items-center gap-4">
        <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>Save Settings</button>
        {saved && <span className="text-sm font-medium" style={{ color: "#2D6A4F" }}>✓ Saved successfully</span>}
      </div>
    </form>
  );
}
