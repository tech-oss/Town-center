import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import useAdminAuth from "../hooks/useAdminAuth";
import { NAVY, BLUE, MUTED, CARD, FIELD_STYLE } from "../theme";

function FormField({ label, type = "text", value, onChange, help, placeholder }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all"
        style={FIELD_STYLE}
      />
      {help && <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{help}</span>}
    </label>
  );
}

// A small section chrome (icon chip + title + description) used by every card
// on this page, so the sections read as one consistent list rather than three
// differently-composed forms stacked on top of each other.
function SectionCard({ icon, title, description, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 flex flex-col gap-5" style={CARD}>
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: BLUE }}>
          {icon}
        </div>
        <div>
          <h2 className="font-bold text-base" style={{ color: NAVY }}>{title}</h2>
          {description && <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{description}</p>}
        </div>
      </div>
      {children}
    </div>
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
    <SectionCard
      title="Reset Password"
      description="Choose a strong password you don't use elsewhere."
      icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="New Password" type="password" value={form.next} onChange={(v) => set("next", v)} placeholder="At least 8 characters" help="Minimum 8 characters." />
          <FormField label="Confirm New Password" type="password" value={form.confirm} onChange={(v) => set("confirm", v)} placeholder="Re-enter your new password" />
        </div>

        {error && (
          <div className="px-3.5 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "#991B1B" }}>{error}</div>
        )}

        <div className="flex items-center gap-4 pt-1">
          <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: BLUE }}>
            {busy ? "Updating…" : "Reset Password"}
          </button>
          {saved && <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#16A34A" }}>✓ Password updated</span>}
        </div>
      </form>
    </SectionCard>
  );
}

function AccountSection() {
  const { admin } = useAdminAuth();
  const initial = (admin?.name || admin?.email || "?")[0]?.toUpperCase();

  return (
    <SectionCard
      title="Your Account"
      icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0" style={{ backgroundColor: NAVY }}>
          {initial}
        </div>
        <div className="grid sm:grid-cols-3 gap-x-6 gap-y-2 text-sm flex-1">
          <div><span className="block text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Name</span><span style={{ color: NAVY }}>{admin?.name ?? "—"}</span></div>
          <div><span className="block text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Email</span><span style={{ color: NAVY }}>{admin?.email ?? "—"}</span></div>
          <div><span className="block text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Role</span><span style={{ color: NAVY }}>{admin?.role ?? "—"}</span></div>
        </div>
      </div>
    </SectionCard>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Manage your admin account and login.</p>
      </div>

      <AccountSection />
      <PasswordSection />
    </div>
  );
}
