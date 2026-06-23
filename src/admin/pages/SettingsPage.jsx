import { useState } from "react";

function FormField({ label, type = "password", value, onChange, help, placeholder }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
        style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332", backgroundColor: "#fff" }}
      />
      {help && <span className="text-[11px]" style={{ color: "#9CA3AF" }}>{help}</span>}
    </label>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.current || !form.next || !form.confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (form.next !== form.confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    // UI-only: real reset will call the backend here.
    setSaved(true);
    setForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manage your admin account.</p>
      </div>

      <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
        <div>
          <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Reset Password</h2>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Choose a strong password you don't use elsewhere.</p>
        </div>

        <FormField label="Current Password" value={form.current} onChange={(v) => set("current", v)} placeholder="Enter your current password" />
        <FormField label="New Password" value={form.next} onChange={(v) => set("next", v)} placeholder="At least 8 characters" help="Minimum 8 characters." />
        <FormField label="Confirm New Password" value={form.confirm} onChange={(v) => set("confirm", v)} placeholder="Re-enter your new password" />

        {error && (
          <div className="px-3 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "#991B1B" }}>{error}</div>
        )}

        <div className="flex items-center gap-4 pt-1">
          <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>Reset Password</button>
          {saved && <span className="text-sm font-medium" style={{ color: "#2D6A4F" }}>✓ Password updated</span>}
        </div>
      </div>
    </form>
  );
}
