import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Field, Inp, Toggle, Toast, useToast, ConfirmModal, FOREST, SAGE, MUTED, BORDER, CARD, INPUT } from "../components/FormKit";
import { usePendingRequests, useApprovedTeam, approveRequest, declineRequest } from "../hooks/useUserRegistry";

// Account settings: who you're signed in as, your details, your password,
// your team and your account. Same layout as the admin panel's Settings —
// a profile column beside icon-headed panels — so the two back-office
// products read as one.

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const Icon = {
  user: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  team: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  monitor: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  warning: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" /></>,
  check: <path d="M20 6L9 17l-5-5" />,
};

function Svg({ children, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

function Panel({ icon, title, description, children, danger }) {
  const accent = danger ? "#B91C1C" : SAGE;
  return (
    <section className="bg-white rounded-2xl" style={danger ? { ...CARD, border: "2px solid rgba(220,38,38,0.3)" } : CARD}>
      <header className="flex items-start gap-3.5 px-6 sm:px-7 pt-6 pb-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: danger ? "rgba(220,38,38,0.08)" : "rgba(37,99,235,0.08)", color: accent }}>
          <Svg>{icon}</Svg>
        </div>
        <div>
          <h2 className="font-bold text-base" style={{ color: danger ? "#991B1B" : FOREST }}>{title}</h2>
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
      <span className="text-sm text-right min-w-0 truncate" style={{ color: FOREST }}>{children}</span>
    </div>
  );
}

// ─── Profile column ──────────────────────────────────────────────────────────
function ProfileCard({ user, lastSignIn, onSignOut, signingOut }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Your account";
  const initials = name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <aside className="bg-white rounded-2xl overflow-hidden self-start" style={CARD}>
      <div className="h-20" style={{ background: `linear-gradient(135deg, ${FOREST}, ${SAGE})` }} />
      <div className="px-6 pb-6 -mt-9 flex flex-col items-center text-center">
        <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-2xl font-bold text-white ring-4 ring-white" style={{ backgroundColor: FOREST }}>
          {initials}
        </div>
        <p className="mt-3 font-bold text-base" style={{ color: FOREST }}>{name}</p>
        <p className="text-xs mt-0.5 break-all" style={{ color: MUTED }}>{user.email ?? "—"}</p>
        {user.role && (
          <span className="mt-3 text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: SAGE }}>
            {user.role}
          </span>
        )}
      </div>
      <div className="px-6 pb-2">
        <InfoRow label="Business">{user.businessName ?? "—"}</InfoRow>
        <InfoRow label="Plan">{user.plan ? `${user.plan}${user.planStatus ? ` · ${user.planStatus}` : ""}` : "—"}</InfoRow>
        <InfoRow label="Listing">
          <span style={{ color: user.visible ? "#15803D" : "#B45309" }}>{user.visible ? "Live" : "Hidden"}</span>
        </InfoRow>
        <InfoRow label="Last sign-in">{formatDateTime(lastSignIn)}</InfoRow>
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
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-90" style={{ color: FOREST }}>
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
    // The signed-in Supabase session is enough to set a new password — this
    // used to only show a toast without changing anything.
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
    <Panel icon={Icon.lock} title="Password" description="Change the password you use to sign in to your dashboard.">
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
              style={{ backgroundColor: SAGE }}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </div>
        </div>

        <div className="rounded-xl p-4 self-start" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
          <p className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "#9CA3AF" }}>Requirements</p>
          <ul className="flex flex-col gap-2">
            {RULES.map((r) => {
              const ok = r.test(next);
              return (
                <li key={r.id} className="flex items-start gap-2 text-xs" style={{ color: ok ? "#15803D" : MUTED }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-px"
                    style={{ backgroundColor: ok ? "rgba(22,163,74,0.14)" : "#E5E7EB", color: ok ? "#15803D" : "transparent" }}>
                    <Svg size={10}>{Icon.check}</Svg>
                  </span>
                  <span>{r.label}</span>
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

// ─── Sessions ────────────────────────────────────────────────────────────────
function SessionPanel({ session, onSignOutEverywhere, busy }) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "";

  return (
    <Panel icon={Icon.monitor} title="Sessions" description="Where your account is signed in.">
      <div className="flex items-center gap-4 rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F1F5F9", color: FOREST }}>
          <Svg>{Icon.monitor}</Svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: FOREST }}>{browser}{os ? ` on ${os}` : ""}</p>
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
          style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>
          Sign out everywhere
        </button>
      </div>
    </Panel>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, toggleVisibility, updatePersonalDetails } = useBusinessAuth();
  const [toast, setToast] = useToast();

  const [personal, setPersonal] = useState({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone });
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [session, setSession] = useState(null);
  const [lastSignIn, setLastSignIn] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  const fetchedTeam = useApprovedTeam(user.id);
  const [teamOverride, setTeamOverride] = useState(null);
  const team = teamOverride ?? fetchedTeam;
  const [addingMember, setAddingMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: "", email: "" });
  const [transferTarget, setTransferTarget] = useState(null);
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [profileDeleted, setProfileDeleted] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const isOwner = user.role !== "Content Manager";
  const pendingRequests = usePendingRequests(user.id);

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
      navigate("/business/login", { replace: true });
    }
  }

  async function handleApproveRequest(req) {
    await approveRequest(user.id, req.id);
    setToast(`${req.firstName} ${req.lastName} approved as Content Manager.`);
  }
  async function handleDeclineRequest(req) {
    await declineRequest(user.id, req.id);
    setToast(`Request from ${req.firstName} ${req.lastName} declined.`);
  }

  async function savePersonal() {
    setSavingPersonal(true);
    const res = await updatePersonalDetails(personal);
    setSavingPersonal(false);
    setToast(res.ok ? "Personal details saved." : "Something went wrong saving your details.");
  }
  function inviteMember() {
    if (!memberForm.name.trim() || !memberForm.email.trim()) return;
    // TODO: not wired to Supabase — needs a password field/UX decision to call
    // supabase.auth.signUp + an auto-approved business_users insert. Deferred.
    setTeamOverride((prev) => [...(prev ?? team), { id: `u${Date.now()}`, ...memberForm, role: "Content Manager" }]);
    setMemberForm({ name: "", email: "" });
    setAddingMember(false);
    setToast("Invite sent.");
  }
  function removeMember(id) {
    setTeamOverride((prev) => (prev ?? team).filter((m) => m.id !== id));
    setToast("Team member removed.");
  }
  function confirmTransfer() {
    // TODO: update business_users table
    setTeamOverride((prev) => (prev ?? team).map((m) => {
      if (m.id === transferTarget.id) return { ...m, role: "Owner" };
      if (m.role === "Owner") return { ...m, role: "Manager" };
      return m;
    }));
    setToast(`Ownership transferred to ${transferTarget.name}.`);
    setTransferTarget(null);
  }

  function handleHideProfile() {
    toggleVisibility();
    setToast(user.visible ? "Your profile is now hidden." : "Your profile is now live.");
  }

  function confirmDeleteProfileAction() {
    // TODO: flag for admin review in Supabase, log to audit trail
    setConfirmDeleteProfile(false);
    setProfileDeleted(true);
    setDeleteText("");
  }
  function confirmDeleteAccountAction() {
    // TODO: schedule auth user deletion, log to audit trail
    setConfirmDeleteAccount(false);
    setAccountDeleted(true);
    setDeleteText("");
  }

  if (profileDeleted || accountDeleted) {
    return (
      <BusinessLayout>
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 text-center flex flex-col items-center gap-4 mt-10" style={CARD}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "#991B1B" }}>⚠</div>
          <h1 className="text-lg font-bold" style={{ color: FOREST }}>Deletion requested.</h1>
          <p className="text-sm" style={{ color: MUTED }}>This will be processed within 24 hours.</p>
        </div>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout>
      <Toast message={toast} />
      {transferTarget && (
        <ConfirmModal title="Transfer ownership?" danger={false} confirmLabel="Transfer"
          body={`Select a new owner from your team members. You will become a Manager after transferring.`}
          onConfirm={confirmTransfer} onCancel={() => setTransferTarget(null)} />
      )}
      {confirmDeleteProfile && (
        <ConfirmModal title="Delete my business profile?" confirmLabel="Delete Profile"
          body="This permanently removes your business page and all associated content. This cannot be undone."
          onConfirm={() => deleteText === "DELETE" && confirmDeleteProfileAction()} onCancel={() => { setConfirmDeleteProfile(false); setDeleteText(""); }}>
          <Field label='Type "DELETE" to confirm'><Inp value={deleteText} onChange={(e) => setDeleteText(e.target.value)} /></Field>
        </ConfirmModal>
      )}
      {confirmDeleteAccount && (
        <ConfirmModal title="Delete my account?" confirmLabel="Delete Account"
          body="This permanently removes your user account. This cannot be undone."
          onConfirm={() => deleteText === "DELETE" && confirmDeleteAccountAction()} onCancel={() => { setConfirmDeleteAccount(false); setDeleteText(""); }}>
          <Field label='Type "DELETE" to confirm'><Inp value={deleteText} onChange={(e) => setDeleteText(e.target.value)} /></Field>
        </ConfirmModal>
      )}

      <div className="flex flex-col gap-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Account Settings</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Your account, password, team and sign-in sessions.</p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
          <ProfileCard user={user} lastSignIn={lastSignIn} onSignOut={() => signOut("local")} signingOut={signingOut} />

          <div className="flex flex-col gap-6 min-w-0">
            <Panel icon={Icon.user} title="Personal Details" description="The name and contact details on your account.">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <Field label="First Name"><Inp value={personal.firstName ?? ""} onChange={(e) => setPersonal((p) => ({ ...p, firstName: e.target.value }))} /></Field>
                <Field label="Last Name"><Inp value={personal.lastName ?? ""} onChange={(e) => setPersonal((p) => ({ ...p, lastName: e.target.value }))} /></Field>
                <Field label="Email" hint="Your sign-in email — contact support to change it">
                  <Inp value={personal.email ?? ""} readOnly style={{ backgroundColor: "#F8FAFC", color: MUTED }} />
                </Field>
                <Field label="Phone"><Inp value={personal.phone ?? ""} onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))} /></Field>
              </div>
              <button onClick={savePersonal} disabled={savingPersonal}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: SAGE }}>
                {savingPersonal ? "Saving…" : "Save changes"}
              </button>
            </Panel>

            <PasswordPanel />

            <Panel icon={Icon.team} title="Business Users" description="The people who can sign in and manage this business.">
              {isOwner && (
                <div className="flex flex-col gap-3 mb-5 rounded-xl p-3" style={{ backgroundColor: "rgba(217,119,6,0.08)", border: "1.5px solid rgba(217,119,6,0.3)" }}>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#92400E" }}>Pending User Approvals</p>
                  {pendingRequests.length === 0 ? (
                    <p className="text-xs" style={{ color: "#92400E" }}>No pending requests right now.</p>
                  ) : pendingRequests.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 flex-wrap rounded-xl p-3 bg-white" style={{ border: `1px solid ${BORDER}` }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: "#D97706" }}>{r.firstName[0]}</div>
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-sm font-semibold" style={{ color: FOREST }}>{r.firstName} {r.lastName}</p>
                        <p className="text-xs" style={{ color: MUTED }}>{r.email} · requested {r.requestedAt}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(217,119,6,0.14)", color: "#92400E" }}>Content Manager</span>
                      <button onClick={() => handleApproveRequest(r)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: SAGE }}>Accept</button>
                      <button onClick={() => handleDeclineRequest(r)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ color: "#991B1B", border: "1.5px solid rgba(220,38,38,0.3)" }}>Decline</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3 mb-4">
                {team.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 flex-wrap rounded-xl p-3" style={{ border: `1px solid ${BORDER}` }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: SAGE }}>{m.name[0]}</div>
                    <div className="flex-1 min-w-[140px]">
                      <p className="text-sm font-semibold" style={{ color: FOREST }}>{m.name}</p>
                      <p className="text-xs" style={{ color: MUTED }}>{m.email}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#1D4ED8" }}>{m.role}</span>
                    {isOwner && (m.role === "Owner" ? (
                      <button onClick={() => setTransferTarget(team.find((t) => t.role !== "Owner") ?? m)} className="text-xs font-semibold" style={{ color: "#2563EB" }}>Transfer ownership</button>
                    ) : (
                      <button onClick={() => removeMember(m.id)} className="text-xs font-semibold" style={{ color: "#991B1B" }}>Remove</button>
                    ))}
                  </div>
                ))}
              </div>

              {(() => {
                const hasContentManager = team.some((m) => m.role === "Content Manager") || (isOwner && pendingRequests.length > 0);
                if (!isOwner) {
                  return <p className="text-xs" style={{ color: "#9CA3AF" }}>Only the business owner can manage team members.</p>;
                }
                if (hasContentManager) {
                  return <p className="text-xs" style={{ color: "#9CA3AF" }}>This business already has a Content Manager. Remove them to add a different one.</p>;
                }
                if (addingMember) {
                  return (
                    <div className="grid sm:grid-cols-3 gap-2 mb-3 items-end">
                      <Inp value={memberForm.name} onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" />
                      <Inp value={memberForm.email} onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" />
                      <div className="rounded-xl px-3 py-2.5 text-sm" style={{ border: `1.5px solid ${BORDER}`, color: MUTED, backgroundColor: "#f8fafc" }}>Content Manager</div>
                      <div className="flex gap-2 sm:col-span-3">
                        <button onClick={inviteMember} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: SAGE }}>Send Invite</button>
                        <button onClick={() => setAddingMember(false)} className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
                      </div>
                    </div>
                  );
                }
                return (
                  <button onClick={() => setAddingMember(true)} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#2563EB", border: "1.5px solid rgba(37,99,235,0.3)" }}>+ Add a user</button>
                );
              })()}
              {isOwner && <p className="text-[11px] mt-3" style={{ color: "#9CA3AF" }}>If you are leaving this business, use "Transfer ownership" before removing yourself.</p>}
            </Panel>

            <SessionPanel session={session} onSignOutEverywhere={() => signOut("global")} busy={signingOut} />

            <Panel icon={Icon.warning} title="Danger Zone" description="Changes here affect your public listing and your account." danger>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold" style={{ color: FOREST }}>Make your business live or hidden</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>{user.visible ? "Your business is live." : "Your business is not live."}</p>
                </div>
                <Toggle checked={user.visible} onChange={handleHideProfile} />
              </div>

              <div className="flex items-center justify-between gap-4 flex-wrap pt-4 mt-4" style={{ borderTop: "1px solid rgba(220,38,38,0.15)" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: FOREST }}>Delete my business profile</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>This permanently removes your business page and all associated content. This cannot be undone.</p>
                </div>
                <button onClick={() => setConfirmDeleteProfile(true)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white shrink-0" style={{ backgroundColor: "#DC2626" }}>Delete Profile</button>
              </div>

              <div className="flex items-center justify-between gap-4 flex-wrap pt-4 mt-4" style={{ borderTop: "1px solid rgba(220,38,38,0.15)" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: FOREST }}>Delete my account</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>This permanently removes your user account.</p>
                </div>
                <button onClick={() => setConfirmDeleteAccount(true)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white shrink-0" style={{ backgroundColor: "#DC2626" }}>Delete Account</button>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
