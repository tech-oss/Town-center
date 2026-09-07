import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import useAdminAuth from "../hooks/useAdminAuth";
import { getSettings, saveSettings } from "../../api/admin";
import { NAVY, BLUE, MUTED, BORDER, CARD, FIELD_STYLE } from "../theme";

function FormField({ label, type = "text", value, onChange, help, placeholder }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
        style={FIELD_STYLE}
      />
      {help && <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{help}</span>}
    </label>
  );
}

function PasswordSection() {
  const [form, setForm] = useState({ next: "", confirm: "" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Supabase Auth's password update needs only the new value on an already
  // signed-in session — there is no "current password" check to make against
  // the client, so re-authenticating isn't required here.
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.next || !form.confirm) { setError("Please fill in both fields."); return; }
    if (form.next.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (form.next !== form.confirm) { setError("New password and confirmation do not match."); return; }

    setBusy(true);
    const { error: authError } = await supabase.auth.updateUser({ password: form.next });
    setBusy(false);
    if (authError) { setError(authError.message); return; }

    setSaved(true);
    setForm({ next: "", confirm: "" });
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
      <div>
        <h2 className="font-bold text-base" style={{ color: NAVY }}>Reset Password</h2>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Choose a strong password you don't use elsewhere.</p>
      </div>

      <FormField label="New Password" type="password" value={form.next} onChange={(v) => set("next", v)} placeholder="At least 8 characters" help="Minimum 8 characters." />
      <FormField label="Confirm New Password" type="password" value={form.confirm} onChange={(v) => set("confirm", v)} placeholder="Re-enter your new password" />

      {error && (
        <div className="px-3 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "#991B1B" }}>{error}</div>
      )}

      <div className="flex items-center gap-4 pt-1">
        <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: BLUE }}>
          {busy ? "Updating…" : "Reset Password"}
        </button>
        {saved && <span className="text-sm font-medium" style={{ color: NAVY }}>✓ Password updated</span>}
      </div>
    </form>
  );
}

function PlatformSection() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSettings().then((s) => { if (!cancelled) setForm(s.platform); });
    return () => { cancelled = true; };
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await saveSettings({ platform: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  if (!form) {
    return <div className="bg-white rounded-2xl p-6" style={CARD}><p className="text-sm" style={{ color: MUTED }}>Loading…</p></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
      <div>
        <h2 className="font-bold text-base" style={{ color: NAVY }}>Platform Settings</h2>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Site-wide configuration used across the admin panel and public site.</p>
      </div>

      <FormField label="Site Name" value={form.siteName} onChange={(v) => set("siteName", v)} />
      <FormField label="Support Email" type="email" value={form.supportEmail} onChange={(v) => set("supportEmail", v)} />

      <label className="flex items-center gap-3 py-1">
        <input type="checkbox" checked={!!form.approvalRequired} onChange={(e) => set("approvalRequired", e.target.checked)} className="w-4 h-4" />
        <span className="text-sm" style={{ color: NAVY }}>Require admin approval before new listing edits go live</span>
      </label>

      <div className="grid sm:grid-cols-3 gap-4">
        <FormField label="XML Sync Hour" type="number" value={form.xmlSyncHour} onChange={(v) => set("xmlSyncHour", Number(v))} help="0–23, server time" />
        <FormField label="Max Gallery Images" type="number" value={form.maxGalleryImages} onChange={(v) => set("maxGalleryImages", Number(v))} />
        <FormField label="Max Featured Listings" type="number" value={form.featuredListingsMax} onChange={(v) => set("featuredListingsMax", Number(v))} />
      </div>

      {error && (
        <div className="px-3 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "#991B1B" }}>{error}</div>
      )}

      <div className="flex items-center gap-4 pt-1">
        <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: BLUE }}>
          {busy ? "Saving…" : "Save Settings"}
        </button>
        {saved && <span className="text-sm font-medium" style={{ color: NAVY }}>✓ Saved</span>}
      </div>
    </form>
  );
}

function AccountSection() {
  const { admin } = useAdminAuth();
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-3" style={CARD}>
      <h2 className="font-bold text-base" style={{ color: NAVY }}>Your Account</h2>
      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        <div><span className="block text-xs font-semibold" style={{ color: MUTED }}>Name</span>{admin?.name}</div>
        <div><span className="block text-xs font-semibold" style={{ color: MUTED }}>Email</span>{admin?.email}</div>
        <div><span className="block text-xs font-semibold" style={{ color: MUTED }}>Role</span>{admin?.role}</div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Manage your admin account and platform configuration.</p>
      </div>

      <AccountSection />
      <PasswordSection />
      <PlatformSection />
    </div>
  );
}
