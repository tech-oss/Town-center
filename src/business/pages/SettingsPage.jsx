import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Field, Inp, Select, Toggle, Toast, useToast, ConfirmModal, FOREST, SAGE, MUTED, BORDER, CARD } from "../components/FormKit";
import { BUSINESS_TEAM, TEAM_ROLES } from "../../Data/businessPortalMock";

function AccordionSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={CARD}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-sm font-bold" style={{ color: FOREST }}>{title}</span>
        <span style={{ color: MUTED, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, toggleVisibility } = useBusinessAuth();
  const [toast, setToast] = useToast();

  const [personal, setPersonal] = useState({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [team, setTeam] = useState(() => [...(BUSINESS_TEAM[user.id] ?? [])]);
  const [addingMember, setAddingMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: "", email: "", role: "Staff" });
  const [transferTarget, setTransferTarget] = useState(null);
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [profileDeleted, setProfileDeleted] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);

  function savePersonal() {
    // TODO: update Supabase auth user
    setToast("Personal details saved.");
  }
  function savePassword() {
    if (!pw.next || pw.next !== pw.confirm) { setToast("Passwords do not match."); return; }
    // TODO: update Supabase auth user
    setToast("Password updated.");
    setPw({ current: "", next: "", confirm: "" });
  }
  function inviteMember() {
    if (!memberForm.name.trim() || !memberForm.email.trim()) return;
    // TODO: update business_users table
    setTeam((prev) => [...prev, { id: `u${Date.now()}`, ...memberForm }]);
    setMemberForm({ name: "", email: "", role: "Staff" });
    setAddingMember(false);
    setToast("Invite sent.");
  }
  function removeMember(id) {
    setTeam((prev) => prev.filter((m) => m.id !== id));
    setToast("Team member removed.");
  }
  function confirmTransfer() {
    // TODO: update business_users table
    setTeam((prev) => prev.map((m) => {
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

  const owner = team.find((m) => m.role === "Owner");

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

      <div className="flex flex-col gap-4 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Account Settings</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Manage your personal details, team and account.</p>
        </div>

        <AccordionSection title="Personal Details" defaultOpen>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="First Name"><Inp value={personal.firstName} onChange={(e) => setPersonal((p) => ({ ...p, firstName: e.target.value }))} /></Field>
            <Field label="Last Name"><Inp value={personal.lastName} onChange={(e) => setPersonal((p) => ({ ...p, lastName: e.target.value }))} /></Field>
            <Field label="Email"><Inp value={personal.email} onChange={(e) => setPersonal((p) => ({ ...p, email: e.target.value }))} /></Field>
            <Field label="Phone"><Inp value={personal.phone} onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))} /></Field>
          </div>
          <button onClick={savePersonal} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>Save</button>
        </AccordionSection>

        <AccordionSection title="Change Password">
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <Field label="Current Password"><Inp type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} /></Field>
            <Field label="New Password"><Inp type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} /></Field>
            <Field label="Confirm New Password"><Inp type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} /></Field>
          </div>
          <button onClick={savePassword} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>Save</button>
        </AccordionSection>

        <AccordionSection title="Business User Management">
          <div className="flex flex-col gap-3 mb-4">
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-3 flex-wrap rounded-xl p-3" style={{ border: `1px solid ${BORDER}` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: SAGE }}>{m.name[0]}</div>
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-semibold" style={{ color: FOREST }}>{m.name}</p>
                  <p className="text-xs" style={{ color: MUTED }}>{m.email}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#1D4ED8" }}>{m.role}</span>
                {m.role === "Owner" ? (
                  <button onClick={() => setTransferTarget(team.find((t) => t.role !== "Owner") ?? m)} className="text-xs font-semibold" style={{ color: "#0F766E" }}>Transfer ownership</button>
                ) : (
                  <button onClick={() => removeMember(m.id)} className="text-xs font-semibold" style={{ color: "#991B1B" }}>Remove</button>
                )}
              </div>
            ))}
          </div>

          {addingMember ? (
            <div className="grid sm:grid-cols-3 gap-2 mb-3">
              <Inp value={memberForm.name} onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" />
              <Inp value={memberForm.email} onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" />
              <Select value={memberForm.role} onChange={(e) => setMemberForm((f) => ({ ...f, role: e.target.value }))}>
                {TEAM_ROLES.map((r) => <option key={r}>{r}</option>)}
              </Select>
              <div className="flex gap-2 sm:col-span-3">
                <button onClick={inviteMember} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: SAGE }}>Send Invite</button>
                <button onClick={() => setAddingMember(false)} className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingMember(true)} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: "rgba(82,199,182,0.12)", color: "#0F766E", border: "1.5px solid rgba(82,199,182,0.35)" }}>+ Add a user</button>
          )}
          <p className="text-[11px] mt-3" style={{ color: "#9CA3AF" }}>If you are leaving this business, use "Transfer ownership" before removing yourself.</p>
        </AccordionSection>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-5" style={{ border: "2px solid rgba(220,38,38,0.3)" }}>
          <p className="text-sm font-bold" style={{ color: "#991B1B" }}>Danger Zone</p>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold" style={{ color: FOREST }}>Hide my business profile</p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>Your business page will be invisible to the public. You can make it live again at any time.</p>
            </div>
            <Toggle checked={user.visible} onChange={handleHideProfile} />
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap pt-3" style={{ borderTop: "1px solid rgba(220,38,38,0.15)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: FOREST }}>Delete my business profile</p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>This permanently removes your business page and all associated content. This cannot be undone.</p>
            </div>
            <button onClick={() => setConfirmDeleteProfile(true)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white shrink-0" style={{ backgroundColor: "#DC2626" }}>Delete Profile</button>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap pt-3" style={{ borderTop: "1px solid rgba(220,38,38,0.15)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: FOREST }}>Delete my account</p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>This permanently removes your user account.</p>
            </div>
            <button onClick={() => setConfirmDeleteAccount(true)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white shrink-0" style={{ backgroundColor: "#DC2626" }}>Delete Account</button>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
