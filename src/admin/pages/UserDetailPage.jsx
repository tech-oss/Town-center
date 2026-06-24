import { useParams, Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { getUserById } from "../../api/admin";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: "#0A192F" }}>{value ?? "—"}</span>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams();
  const { data: user, loading } = useFetch(() => getUserById(id), [id]);

  if (loading) return <LoadingState />;
  if (!user) return <EmptyState title="User not found" message="This account may have been removed." />;

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/users" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "#0A192F" }}>← Users</Link>
      </div>

      <div className="bg-white rounded-2xl p-6 flex flex-col gap-6" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -2px 5px rgba(10,25,47,0.035), 0 1px 2px rgba(10,25,47,0.06), 0 14px 30px -12px rgba(10,25,47,0.28)", border: "1px solid rgba(10,25,47,0.08)" }}>
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0" style={{ backgroundColor: "#0A192F" }}>
            {user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" style={{ color: "#0A192F" }}>{user.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusTag status={user.status} />
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(10,25,47,0.08)", color: "#0A192F" }}>{user.role}</span>
              {user.tier && <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(179,146,88,0.15)", color: "#0A192F" }}>{user.tier}</span>}
            </div>
          </div>
        </div>

        <hr style={{ borderColor: "rgba(10,25,47,0.1)" }} />

        <div className="grid grid-cols-2 gap-5">
          <Field label="User ID" value={user.id} />
          <Field label="Role" value={user.role} />
          <Field label="Tier" value={user.tier ?? "N/A"} />
          <Field label="Status" value={user.status} />
          <Field label="Joined" value={user.joined} />
          <Field label="Last Login" value={user.lastLogin} />
        </div>

        <hr style={{ borderColor: "rgba(10,25,47,0.1)" }} />

        <div className="flex gap-3 flex-wrap">
          <button className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#0A192F" }}>Edit Account</button>
          <button className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "#991B1B", border: "1.5px solid rgba(185,28,28,0.4)" }}>Suspend Account</button>
        </div>
      </div>
    </div>
  );
}
