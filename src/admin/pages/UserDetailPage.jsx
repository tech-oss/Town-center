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
      <span className="text-sm font-medium" style={{ color: "#1B4332" }}>{value ?? "—"}</span>
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
        <Link to="/admin/users" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "#2D6A4F" }}>← Users</Link>
      </div>

      <div className="bg-white rounded-2xl p-6 flex flex-col gap-6" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0" style={{ backgroundColor: "#2D6A4F" }}>
            {user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" style={{ color: "#1B4332" }}>{user.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusTag status={user.status} />
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(27,67,50,0.08)", color: "#1B4332" }}>{user.role}</span>
              {user.tier && <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(82,183,136,0.15)", color: "#1B4332" }}>{user.tier}</span>}
            </div>
          </div>
        </div>

        <hr style={{ borderColor: "rgba(27,67,50,0.1)" }} />

        <div className="grid grid-cols-2 gap-5">
          <Field label="User ID" value={user.id} />
          <Field label="Role" value={user.role} />
          <Field label="Tier" value={user.tier ?? "N/A"} />
          <Field label="Status" value={user.status} />
          <Field label="Joined" value={user.joined} />
          <Field label="Last Login" value={user.lastLogin} />
        </div>

        <hr style={{ borderColor: "rgba(27,67,50,0.1)" }} />

        <div className="flex gap-3 flex-wrap">
          <button className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>Edit Account</button>
          <button className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "#991B1B", border: "1.5px solid rgba(185,28,28,0.4)" }}>Suspend Account</button>
        </div>
      </div>
    </div>
  );
}
