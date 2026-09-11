import { useState, useCallback, Fragment, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { getUsers, approveUser, rejectUser, suspendUser, registerUser, deleteUser, getBusinesses } from "../../api/admin";
import BusinessTypeahead from "../components/BusinessTypeahead";
import StatusTag from "../components/StatusTag";
import { formatUK } from "../../lib/ukDate";
import LoadingState from "../components/LoadingState";
import { BLUE, BORDER, CARD, MUTED, NAVY } from "../theme";

const TABS = [
  { key: "Pending",   label: "Pending Approvals" },
  { key: "Approved",  label: "Approved Users" },
  { key: "Rejected",  label: "Rejected Users" },
  { key: "Suspended", label: "Suspended Users" },
];

// Columns with their sort key (null = unsortable)
const COLUMNS = [
  { label: "Name",     key: "name" },
  { label: "Email",    key: "email" },
  { label: "Phone",    key: "phone" },
  { label: "Business", key: "business" },
  { label: "Role",     key: "role" },
  { label: "Tier",     key: "tier" },
  { label: "Joined",   key: "joined" },
  { label: "Status",   key: "status" },
  { label: "Actions",  key: null },
];

function exportCsv(rows) {
  const headers = ["Name", "Email", "Phone", "Business", "Role", "Tier", "Status", "Joined"];
  const esc = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [headers.join(","), ...rows.map((u) => [u.name, u.email, u.phone ?? "", u.business, u.role, u.tier ?? "", u.status, u.joined].map(esc).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: `users-${new Date().toISOString().slice(0, 10)}.csv` });
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// Sort indicator SVG
function SortIcon({ dir }) {
  return (
    <span className="inline-flex flex-col ml-1 gap-px" style={{ verticalAlign: "middle" }}>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
        <path d="M4 0L8 5H0L4 0Z" fill={dir === "asc" ? BLUE : "rgba(100,116,139,0.35)"} />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
        <path d="M4 5L0 0H8L4 5Z" fill={dir === "desc" ? BLUE : "rgba(100,116,139,0.35)"} />
      </svg>
    </span>
  );
}

const ROLES = ["Business Owner", "Content Manager"];

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg" style={{ backgroundColor: "#15803D", color: "#fff" }}>
      ✓ {message}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      {children}
    </label>
  );
}
const FIELD_STYLE = { border: "1.5px solid rgba(16,24,40,0.2)", color: NAVY, backgroundColor: "#fff" };

const EMPTY_REGISTER = {
  firstName: "", lastName: "", email: "", phone: "", role: "Business Owner",
  businessId: "", autoPassword: true, password: "", sendInvite: true,
};

// ─── Register User modal ──────────────────────────────────────────────────────
function RegisterUserModal({ onClose, onRegistered }) {
  const [form, setForm] = useState(EMPTY_REGISTER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const { data: businesses } = useFetch(getBusinesses, []);
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); setError(""); }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const passwordOk = form.autoPassword || form.password.length >= 8;
  const isValid = form.firstName.trim() && form.lastName.trim() && emailOk && form.businessId && passwordOk;

  // Every failure is caught and shown. Before, a rejected save left the
  // button on "Registering…" for good with nothing to say why.
  async function handleSubmit() {
    if (!isValid || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await registerUser(form);
      setDone({ name: `${form.firstName} ${form.lastName}`, email: form.email.trim(), password: res.password });
    } catch (e) {
      const msg = e?.message ?? "Could not register this user.";
      setError(/already been registered|already exists/i.test(msg)
        ? "A login with this email already exists. Use a different email, or find the user in the list."
        : msg);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(16,24,40,0.5)" }}>
        <div className="bg-white rounded-2xl p-6 max-w-md w-full flex flex-col gap-4 text-center" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl" style={{ backgroundColor: "rgba(22,163,74,0.12)", color: "#15803D" }}>✓</div>
          <div>
            <p className="text-base font-bold" style={{ color: NAVY }}>{done.name} is registered</p>
            <p className="text-xs mt-1" style={{ color: MUTED }}>Their login is active and they can sign in to the business portal now.</p>
          </div>
          {done.password && (
            <div className="rounded-xl p-3 text-left text-sm" style={{ backgroundColor: "#f8fafc", border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#9CA3AF" }}>Login details to share</p>
              <p style={{ color: NAVY }}>Email: <strong>{done.email}</strong></p>
              <p style={{ color: NAVY }}>Temporary password: <strong className="font-mono">{done.password}</strong></p>
              <button type="button" onClick={() => navigator.clipboard?.writeText(`Email: ${done.email}\nPassword: ${done.password}`)}
                className="mt-2 text-xs font-semibold" style={{ color: BLUE }}>Copy details</button>
            </div>
          )}
          <button onClick={onRegistered} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: BLUE }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(16,24,40,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full flex flex-col gap-4 max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div className="flex items-center justify-between">
          <p className="text-base font-bold" style={{ color: NAVY }}>Register User</p>
          <button onClick={onClose} className="opacity-40 hover:opacity-70 text-xl leading-none" style={{ color: NAVY }}>✕</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="First Name"><input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} /></Field>
          <Field label="Last Name"><input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} /></Field>
          <Field label="Email"><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="rounded-xl px-3 py-2.5 text-sm outline-none" style={form.email && !emailOk ? { ...FIELD_STYLE, borderColor: "#DC2626" } : FIELD_STYLE} /></Field>
          <Field label="Phone"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} /></Field>
          <Field label="Role">
            <select value={form.role} onChange={(e) => set("role", e.target.value)} className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
        </div>

        {/* Subscription tier isn't chosen here — it belongs to the business
            and follows whichever one is picked below, not the person. */}
        <Field label="Business">
          <BusinessTypeahead value={form.businessId} onChange={(id) => set("businessId", id)} businesses={businesses ?? []} placeholder="Search for a business…" />
        </Field>

        <div className="rounded-xl p-3 flex flex-col gap-2" style={{ backgroundColor: "#f8fafc", border: "1px solid rgba(16,24,40,0.1)" }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.autoPassword} onChange={(e) => set("autoPassword", e.target.checked)} className="w-4 h-4" />
            <span className="text-sm font-medium" style={{ color: NAVY }}>Auto-generate password</span>
          </label>
          {form.autoPassword ? (
            <p className="text-xs" style={{ color: MUTED }}>A temporary password is generated and shown to you once the user is registered, so you can share it with them.</p>
          ) : (
            <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Set a password (at least 8 characters)"
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.sendInvite} onChange={(e) => set("sendInvite", e.target.checked)} className="w-4 h-4" />
          <span className="text-sm" style={{ color: NAVY }}>Send invitation email</span>
        </label>

        {error && (
          <div className="px-3.5 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "#991B1B" }}>{error}</div>
        )}

        <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "rgba(16,24,40,0.1)" }}>
          <button onClick={handleSubmit} disabled={!isValid || saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ backgroundColor: BLUE }}>
            {saving ? "Registering…" : "Register User"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirmation modal ────────────────────────────────────────────────
function DeleteUserModal({ user, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(16,24,40,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <p className="text-base font-bold" style={{ color: NAVY }}>Delete user?</p>
        <p className="text-sm" style={{ color: MUTED }}>
          Are you sure you want to permanently delete <strong>{user.name}</strong>? This cannot be undone. Their business profile will be unlinked.
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting} className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#DC2626" }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const navigate = useNavigate();
  const [tab, setTab]           = useState("Pending");
  const [busy, setBusy]         = useState(null);
  const [tick, setTick]         = useState(0);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNote, setRejectNote]   = useState("");
  const [search, setSearch]     = useState("");
  const [sortCol, setSortCol]   = useState(null);   // column key
  const [sortDir, setSortDir]   = useState("asc");  // "asc" | "desc"
  const [showRegister, setShowRegister] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [toast, setToast] = useState(null);

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 3500); }

  function handleRegistered() {
    setShowRegister(false);
    setTick((t) => t + 1);
    notify("User registered successfully.");
  }

  async function handleDeleteConfirm() {
    setBusy(deletingUser.id);
    await deleteUser(deletingUser.id);
    setBusy(null);
    notify(`"${deletingUser.name}" deleted.`);
    setDeletingUser(null);
    setTick((t) => t + 1);
  }

  // Content Manager approvals belong to the business owner who invited them,
  // not the super admin — this screen only manages Business Owner accounts,
  // one per business registration.
  const fetch = useCallback(() => getUsers({ status: tab, role: "Business Owner" }), [tab, tick]);
  const { data: rawUsers, loading } = useFetch(fetch, [tab, tick]);

  // Search + sort applied client-side after fetch
  const users = useMemo(() => {
    let list = rawUsers ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((u) =>
        u.name?.toLowerCase().includes(q) ||
        u.business?.toLowerCase().includes(q)
      );
    }
    if (sortCol) {
      list = [...list].sort((a, b) => {
        const av = (a[sortCol] ?? "").toString().toLowerCase();
        const bv = (b[sortCol] ?? "").toString().toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return list;
  }, [rawUsers, search, sortCol, sortDir]);

  function toggleSort(key) {
    if (!key) return;
    if (sortCol === key) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(key);
      setSortDir("asc");
    }
  }

  async function action(fn, id, e, ...args) {
    e.stopPropagation();
    setBusy(id);
    try {
      await fn(id, ...args);
      setTick((t) => t + 1);
    } catch (err) {
      // A failed write here used to be an unhandled promise rejection —
      // nothing told the admin it hadn't worked, and busy stayed stuck on
      // that row forever. Surfacing it is what makes the failure visible
      // instead of it just quietly not happening.
      notify(err.message ?? "Something went wrong. Please try again.");
    }
    setBusy(null);
  }

  function openReject(id, e) {
    e.stopPropagation();
    setRejectingId(id);
    setRejectNote("");
  }

  async function submitReject(id, e) {
    e.stopPropagation();
    if (!rejectNote.trim()) return;
    setBusy(id);
    try {
      await rejectUser(id, rejectNote.trim());
      setRejectingId(null);
      setRejectNote("");
      setTick((t) => t + 1);
    } catch (err) {
      notify(err.message ?? "Something went wrong. Please try again.");
    }
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Users</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Manage business owner accounts — approve, reject or suspend access. Content Managers are approved by their own business owner.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: BLUE }}
          >
            + Register User
          </button>
          <button
            onClick={() => exportCsv(users)}
            disabled={!users.length}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      <Toast message={toast} />
      {showRegister && <RegisterUserModal onClose={() => setShowRegister(false)} onRegistered={handleRegistered} />}
      {deletingUser && (
        <DeleteUserModal user={deletingUser} deleting={busy === deletingUser.id}
          onClose={() => setDeletingUser(null)} onConfirm={handleDeleteConfirm} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: BORDER }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setRejectingId(null); setSearch(""); setSortCol(null); }}
            className="px-4 py-2.5 text-sm font-medium transition-all"
            style={{
              color: tab === t.key ? BLUE : MUTED,
              borderBottom: tab === t.key ? `2px solid ${BLUE}` : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search by name or business…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none"
          style={{ border: "1.5px solid rgba(16,24,40,0.15)", color: NAVY, backgroundColor: "#fff" }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: MUTED }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? <LoadingState /> : (
        <div className="bg-white rounded-xl" style={CARD}>
          {!users.length ? (
            <p className="text-sm text-center py-12" style={{ color: MUTED }}>
              {search ? `No results for "${search}"` : `No ${tab.toLowerCase()} users.`}
            </p>
          ) : (
            // Nine columns (including a multi-button Actions column) don't fit
            // this table's own width on anything but a very wide screen — it
            // was clipped with no way to reach the columns past the edge.
            // overflow-x-auto on this wrapper (not on the table itself) lets
            // the table render at its natural full width and scroll within the
            // card, instead of being crushed to fit.
            <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" style={{ minWidth: 920 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {COLUMNS.map(({ label, key }) => (
                    <th
                      key={label}
                      onClick={() => toggleSort(key)}
                      className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider select-none"
                      style={{ color: sortCol === key ? BLUE : MUTED, cursor: key ? "pointer" : "default", whiteSpace: "nowrap" }}
                    >
                      {label}
                      {key && <SortIcon dir={sortCol === key ? sortDir : null} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <Fragment key={u.id}>
                    <tr
                      className="cursor-pointer transition-colors hover:bg-blue-50/40"
                      style={{ borderBottom: rejectingId === u.id ? "none" : `1px solid ${BORDER}` }}
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: NAVY }}>{u.name}</td>
                      <td className="px-4 py-3" style={{ color: MUTED }}>{u.email}</td>
                      <td className="px-4 py-3" style={{ color: MUTED }}>{u.phone || "—"}</td>
                      <td className="px-4 py-3" style={{ color: NAVY }}>{u.business ?? "—"}</td>
                      <td className="px-4 py-3" style={{ color: MUTED }}>{u.role}</td>
                      <td className="px-4 py-3" style={{ color: MUTED }}>{u.tier ?? "—"}</td>
                      <td className="px-4 py-3" style={{ color: MUTED }}>{formatUK(u.joined)}</td>
                      <td className="px-4 py-3"><StatusTag status={u.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {tab === "Pending" && (
                            <>
                              <ActionBtn color="#16A34A" disabled={busy === u.id} onClick={(e) => action(approveUser, u.id, e)}>Approve</ActionBtn>
                              <ActionBtn color="#DC2626" disabled={busy === u.id} onClick={(e) => openReject(u.id, e)}>Reject</ActionBtn>
                            </>
                          )}
                          {tab === "Approved" && (
                            <ActionBtn color="#D97706" disabled={busy === u.id} onClick={(e) => action(suspendUser, u.id, e)}>Suspend</ActionBtn>
                          )}
                          {tab === "Suspended" && (
                            <ActionBtn color="#16A34A" disabled={busy === u.id} onClick={(e) => action(approveUser, u.id, e)}>Reinstate</ActionBtn>
                          )}
                          {tab === "Rejected" && (
                            <ActionBtn color="#16A34A" disabled={busy === u.id} onClick={(e) => action(approveUser, u.id, e)}>Approve</ActionBtn>
                          )}
                          <ActionBtn color={BLUE} onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${u.id}`); }}>View</ActionBtn>
                          <ActionBtn color="#991B1B" onClick={(e) => { e.stopPropagation(); setDeletingUser(u); }}>Delete</ActionBtn>
                        </div>
                      </td>
                    </tr>

                    {/* Inline rejection reason row */}
                    {rejectingId === u.id && (
                      <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td colSpan={8} className="px-4 pb-4 pt-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-2 rounded-xl p-4" style={{ backgroundColor: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.2)" }}>
                            <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>Rejection reason for <span className="font-bold">{u.name}</span> (required)</p>
                            <textarea
                              autoFocus
                              rows={2}
                              placeholder="e.g. Incomplete business information, duplicate account, unable to verify…"
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value)}
                              className="w-full text-sm rounded-lg px-3 py-2 resize-none outline-none"
                              style={{ border: "1px solid rgba(220,38,38,0.35)", color: NAVY, backgroundColor: "#fff" }}
                            />
                            <div className="flex gap-2">
                              <button
                                disabled={busy === u.id || !rejectNote.trim()}
                                onClick={(e) => submitReject(u.id, e)}
                                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-80"
                                style={{ backgroundColor: "#DC2626" }}
                              >
                                Confirm Rejection
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setRejectingId(null); setRejectNote(""); }}
                                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70"
                                style={{ backgroundColor: "rgba(16,24,40,0.07)", color: NAVY }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ color, children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="px-3 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 whitespace-nowrap"
      style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}40` }}
    >
      {children}
    </button>
  );
}
