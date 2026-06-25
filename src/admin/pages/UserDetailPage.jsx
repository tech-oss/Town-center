import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { getUserById, approveUser, rejectUser, suspendUser, deleteUser } from "../../api/admin";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

const NAVY  = "#1E293B";
const BLUE  = "#2563EB";
const MUTED = "#64748B";
const BORDER = "rgba(16,24,40,0.1)";
const CARD = { backgroundColor: "#ffffff", border: "1px solid #eef1f6", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: NAVY }}>{value ?? "—"}</span>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: user, loading } = useFetch(() => getUserById(id), [id, tick]);

  if (loading) return <LoadingState />;
  if (!user) return <EmptyState title="User not found" message="This account may have been removed." />;

  async function act(fn) {
    setBusy(true);
    await fn(id);
    setBusy(false);
    setTick((t) => t + 1);
  }

  async function handleDelete() {
    setBusy(true);
    await deleteUser(id);
    setBusy(false);
    navigate("/admin/users");
  }

  const isApproved  = user.status === "Approved";
  const isPending   = user.status === "Pending";
  const isSuspended = user.status === "Suspended";
  const isRejected  = user.status === "Rejected";

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <Link to="/admin/users" className="text-sm font-medium transition-opacity hover:opacity-70 w-fit" style={{ color: NAVY }}>← Users</Link>

      <div className="bg-white rounded-2xl p-6 flex flex-col gap-6" style={CARD}>
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0" style={{ backgroundColor: BLUE }}>
            {user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" style={{ color: NAVY }}>{user.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: MUTED }}>{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusTag status={user.status} />
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(16,24,40,0.08)", color: NAVY }}>{user.role}</span>
              {user.tier && <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.15)", color: NAVY }}>{user.tier}</span>}
            </div>
          </div>
        </div>

        <hr style={{ borderColor: BORDER }} />

        {/* Fields */}
        <div className="grid grid-cols-2 gap-5">
          <Field label="User ID"      value={user.id} />
          <Field label="Business"     value={user.business} />
          <Field label="Role"         value={user.role} />
          <Field label="Tier"         value={user.tier ?? "N/A"} />
          <Field label="Status"       value={user.status} />
          <Field label="Joined"       value={user.joined} />
          <Field label="Last Login"   value={user.lastLogin} />
        </div>

        <hr style={{ borderColor: BORDER }} />

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: MUTED }}>Account Actions</p>
          <div className="flex gap-3 flex-wrap">
            {(isPending || isRejected) && (
              <ActionBtn color="#16A34A" disabled={busy} onClick={() => act(approveUser)}>Approve</ActionBtn>
            )}
            {isPending && (
              <ActionBtn color="#DC2626" disabled={busy} onClick={() => act(rejectUser)}>Reject</ActionBtn>
            )}
            {isApproved && (
              <ActionBtn color="#D97706" disabled={busy} onClick={() => act(suspendUser)}>Suspend Account</ActionBtn>
            )}
            {isSuspended && (
              <ActionBtn color="#16A34A" disabled={busy} onClick={() => act(approveUser)}>Reinstate Account</ActionBtn>
            )}
          </div>

          {/* Delete — separate danger zone */}
          <div className="rounded-xl p-4 flex items-center justify-between gap-4" style={{ backgroundColor: "rgba(185,28,28,0.04)", border: "1px solid rgba(185,28,28,0.15)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#991B1B" }}>Delete User Account</p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>Permanently removes this user account. The business listing is NOT deleted. This action is recorded in Admin Logs.</p>
            </div>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(185,28,28,0.1)", color: "#991B1B", border: "1px solid rgba(185,28,28,0.3)" }}
              >
                Delete
              </button>
            ) : (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: "rgba(16,24,40,0.07)", color: NAVY }}
                >
                  Cancel
                </button>
                <button
                  disabled={busy}
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "#DC2626" }}
                >
                  Confirm Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ color, children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
      style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}40` }}
    >
      {children}
    </button>
  );
}
