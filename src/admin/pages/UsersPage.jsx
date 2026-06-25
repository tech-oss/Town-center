import { useState, useCallback, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { getUsers, approveUser, rejectUser, suspendUser } from "../../api/admin";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";

const NAVY  = "#1E293B";
const BLUE  = "#2563EB";
const MUTED = "#64748B";
const BORDER = "rgba(16,24,40,0.08)";
const CARD = { backgroundColor: "#ffffff", border: "1px solid #eef1f6", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

const TABS = [
  { key: "Pending",   label: "Pending Approvals" },
  { key: "Approved",  label: "Approved Users" },
  { key: "Rejected",  label: "Rejected Users" },
  { key: "Suspended", label: "Suspended Users" },
];

function exportCsv(rows) {
  const headers = ["Name", "Email", "Business", "Role", "Tier", "Status", "Joined"];
  const esc = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [headers.join(","), ...rows.map((u) => [u.name, u.email, u.business, u.role, u.tier ?? "", u.status, u.joined].map(esc).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: `users-${new Date().toISOString().slice(0, 10)}.csv` });
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

export default function UsersPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Pending");
  const [busy, setBusy] = useState(null);
  const [tick, setTick] = useState(0);
  // rejectingId = id of user whose reject reason box is open; rejectNote = typed text
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  const fetch = useCallback(() => getUsers({ status: tab }), [tab, tick]);
  const { data: users, loading } = useFetch(fetch, [tab, tick]);

  async function action(fn, id, e, ...args) {
    e.stopPropagation();
    setBusy(id);
    await fn(id, ...args);
    setBusy(null);
    setTick((t) => t + 1);
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
    await rejectUser(id, rejectNote.trim());
    setBusy(null);
    setRejectingId(null);
    setRejectNote("");
    setTick((t) => t + 1);
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Users</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Manage business and agent accounts — approve, reject or suspend access.</p>
        </div>
        <button
          onClick={() => exportCsv(users ?? [])}
          disabled={!users?.length}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
          style={{ backgroundColor: BLUE }}
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: BORDER }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setRejectingId(null); }}
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

      {/* Table */}
      {loading ? <LoadingState /> : (
        <div className="bg-white rounded-xl overflow-hidden" style={CARD}>
          {!users?.length ? (
            <p className="text-sm text-center py-12" style={{ color: MUTED }}>No {tab.toLowerCase()} users.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Name", "Email", "Business", "Role", "Tier", "Joined", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: MUTED }}>{h}</th>
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
                      <td className="px-4 py-3" style={{ color: NAVY }}>{u.business ?? "—"}</td>
                      <td className="px-4 py-3" style={{ color: MUTED }}>{u.role}</td>
                      <td className="px-4 py-3" style={{ color: MUTED }}>{u.tier ?? "—"}</td>
                      <td className="px-4 py-3" style={{ color: MUTED }}>{u.joined}</td>
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
