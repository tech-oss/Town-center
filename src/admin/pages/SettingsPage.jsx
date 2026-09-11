import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import useAdminAuth from "../hooks/useAdminAuth";
import { NAVY, BLUE, MUTED, BORDER, CARD } from "../theme";

// Admin account settings: who you're signed in as, your password, and your
// session. Laid out as a profile column beside the settings panels on wide
// screens, stacking on narrow ones.

const INPUT = { border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" };

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const Icon = {
  user: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  monitor: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" /></>,
  check: <path d="M20 6L9 17l-5-5" />,
};
function Svg({ children, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  );
}

function Panel({ icon, title, description, children }) {
  return (
    <section className="bg-white rounded-2xl" style={CARD}>
      <header className="flex items-start gap-3.5 px-6 sm:px-7 pt-6 pb-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE }}>
          <Svg>{icon}</Svg>
        </div>
        <div>
          <h2 className="font-bold text-base" style={{ color: NAVY }}>{title}</h2>
          {description && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{description}</p>}
        </div>
      </header>
      <div className="px-6 sm:px-7 py-6">{children}</div>
    </section>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      <span className="text-sm text-right min-w-0 truncate" style={{ color: NAVY }}>{children}</span>
    </div>
  );
}

// ─── Profile column ──────────────────────────────────────────────────────────
function ProfileCard({ admin, lastSignIn, onSignOut, signingOut }) {
  const name = admin?.name || admin?.email?.split("@")[0] || "Admin";
  const initials = name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <aside className="bg-white rounded-2xl overflow-hidden self-start" style={CARD}>
      <div className="h-20" style={{ background: `linear-gradient(135deg, ${NAVY}, ${BLUE})` }} />
      <div className="px-6 pb-6 -mt-9 flex flex-col items-center text-center">
        <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-2xl font-bold text-white ring-4 ring-white" style={{ backgroundColor: NAVY }}>
          {initials}
        </div>
        <p className="mt-3 font-bold text-base" style={{ color: NAVY }}>{name}</p>
        <p className="text-xs mt-0.5 break-all" style={{ color: MUTED }}>{admin?.email ?? "—"}</p>
        {admin?.role && (
          <span className="mt-3 text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: BLUE }}>
            {admin.role}
          </span>
        )}
      </div>
      <div className="px-6 pb-2">
        <InfoRow label="Last sign-in">{formatDateTime(lastSignIn)}</InfoRow>
        <InfoRow label="Access">Super admin panel</InfoRow>
      </div>
      <div className="px-6 py-5">
        <button onClick={onSignOut} disabled={signingOut}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}

// ─── Password ────────────────────────────────────────────────────────────────
const RULES = [
  { id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "case", label: "Upper and lower case letters", test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: "num", label: "At least one number", test: (p) => /\d/.test(p) },
  { id: "sym", label: "At least one symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];
const STRENGTH = [
  { label: "Too weak", color: "#DC2626" },
  { label: "Weak", color: "#EA580C" },
  { label: "Fair", color: "#D97706" },
  { label: "Good", color: "#16A34A" },
  { label: "Strong", color: "#15803D" },
];

function PasswordInput({ label, value, onChange, placeholder, autoComplete, invalid }) {
  const [show, setShow] = useState(false);
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          className="w-full rounded-xl pl-3.5 pr-11 py-2.5 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
          style={invalid ? { ...INPUT, borderColor: "#DC2626" } : INPUT} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-90" style={{ color: NAVY }}>
          <Svg size={16}>{show ? Icon.eyeOff : Icon.eye}</Svg>
        </button>
      </div>
    </label>
  );
}

function PasswordPanel() {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const passed = RULES.filter((r) => r.test(next)).length;
  const strength = next ? STRENGTH[passed] : null;
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit = RULES[0].test(next) && passed >= 3 && next === confirm && !busy;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    // An already signed-in Supabase session can set a new password directly.
    const { error: authError } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (authError) {
      setError(/different from the old/i.test(authError.message)
        ? "Your new password must be different from your current one."
        : authError.message);
      return;
    }
    setNext("");
    setConfirm("");
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  }

  return (
    <Panel icon={Icon.lock} title="Password" description="Change the password you use to sign in to the admin panel.">
      <form onSubmit={handleSubmit} className="grid md:grid-cols-[1fr_220px] gap-6">
        <div className="flex flex-col gap-4">
          <PasswordInput label="New password" value={next} onChange={(v) => { setNext(v); setError(""); }} placeholder="Enter a new password" autoComplete="new-password" />
          {strength && (
            <div className="flex items-center gap-3 -mt-1">
              <div className="flex gap-1 flex-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-1.5 flex-1 rounded-full transition-colors" style={{ backgroundColor: i < passed ? strength.color : "#E5E7EB" }} />
                ))}
              </div>
              <span className="text-[11px] font-semibold w-16 text-right" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}
          <PasswordInput label="Confirm new password" value={confirm} onChange={(v) => { setConfirm(v); setError(""); }} placeholder="Re-enter the new password" autoComplete="new-password" invalid={mismatch} />
          {mismatch && <p className="text-[11px] -mt-2" style={{ color: "#DC2626" }}>Passwords don't match.</p>}

          {error && (
            <div className="px-3.5 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "#991B1B" }}>{error}</div>
          )}
          {saved && (
            <div className="px-3.5 py-2.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: "rgba(22,163,74,0.1)", color: "#15803D" }}>✓ Password updated. Use it the next time you sign in.</div>
          )}

          <div>
            <button type="submit" disabled={!canSubmit}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: BLUE }}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </div>
        </div>

        <div className="rounded-xl p-4 self-start" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
          <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "#9CA3AF" }}>Requirements</p>
          <ul className="flex flex-col gap-2">
            {RULES.map((r, i) => {
              const ok = r.test(next);
              return (
                <li key={r.id} className="flex items-start gap-2 text-xs" style={{ color: ok ? "#15803D" : MUTED }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-px"
                    style={{ backgroundColor: ok ? "rgba(22,163,74,0.14)" : "#E5E7EB", color: ok ? "#15803D" : "transparent" }}>
                    <Svg size={10}>{Icon.check}</Svg>
                  </span>
                  <span>{r.label}{i === 0 ? "" : ""}</span>
                </li>
              );
            })}
          </ul>
          <p className="text-[10px] mt-3" style={{ color: "#9CA3AF" }}>The first rule plus any two others are needed.</p>
        </div>
      </form>
    </Panel>
  );
}

// ─── Session ─────────────────────────────────────────────────────────────────
function SessionPanel({ session, onSignOutEverywhere, busy }) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "";

  return (
    <Panel icon={Icon.monitor} title="Sessions" description="Where your admin account is signed in.">
      <div className="flex items-center gap-4 rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F1F5F9", color: NAVY }}>
          <Svg>{Icon.monitor}</Svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: NAVY }}>{browser}{os ? ` on ${os}` : ""}</p>
          <p className="text-xs" style={{ color: MUTED }}>
            This device{session?.expires_at ? ` · session renews automatically, current token valid until ${formatDateTime(session.expires_at * 1000)}` : ""}
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(22,163,74,0.12)", color: "#15803D" }}>Active</span>
      </div>
      <div className="flex items-center justify-between gap-4 flex-wrap mt-5">
        <p className="text-xs max-w-md" style={{ color: MUTED }}>Lost a device or signed in somewhere you shouldn't have? Sign out of every session, including this one.</p>
        <button onClick={onSignOutEverywhere} disabled={busy}
          className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>
          Sign out everywhere
        </button>
      </div>
    </Panel>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const [session, setSession] = useState(null);
  const [lastSignIn, setLastSignIn] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data?.session ?? null);
      setLastSignIn(data?.session?.user?.last_sign_in_at ?? null);
    });
    return () => { cancelled = true; };
  }, []);

  async function signOut(scope) {
    setSigningOut(true);
    try {
      if (scope === "global") await supabase.auth.signOut({ scope: "global" });
      await logout();
    } finally {
      setSigningOut(false);
      navigate("/admin/login", { replace: true });
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Your admin account, password and sign-in sessions.</p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
        <ProfileCard admin={admin} lastSignIn={lastSignIn} onSignOut={() => signOut("local")} signingOut={signingOut} />
        <div className="flex flex-col gap-6 min-w-0">
          <PasswordPanel />
          <SessionPanel session={session} onSignOutEverywhere={() => signOut("global")} busy={signingOut} />
        </div>
      </div>
    </div>
  );
}
