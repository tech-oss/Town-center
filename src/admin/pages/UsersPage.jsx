import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { getUsers } from "../../api/admin";
import DataTable, { TableAction } from "../components/DataTable";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";

const ROLE_FILTERS = ["All", "Business Owner", "Estate Agent", "Public"];

export default function UsersPage() {
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState("All");
  const { data: users, loading } = useFetch(
    () => getUsers(roleFilter !== "All" ? { role: roleFilter } : {}),
    [roleFilter]
  );

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email", muted: true },
    { key: "role", label: "Role" },
    { key: "tier", label: "Tier", render: (v) => v ?? <span style={{ color: "#9CA3AF" }}>—</span> },
    { key: "status", label: "Status", render: (v) => <StatusTag status={v} /> },
    { key: "joined", label: "Joined", muted: true },
    { key: "lastLogin", label: "Last Login", muted: true },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Users & Businesses</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>All registered accounts across the portal.</p>
      </div>

      {/* Role filter chips */}
      <div className="flex gap-2 flex-wrap">
        {ROLE_FILTERS.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={roleFilter === r
              ? { backgroundColor: "#1B4332", color: "#fff" }
              : { backgroundColor: "#fff", color: "#1B4332", border: "1.5px solid rgba(27,67,50,0.2)" }
            }
          >
            {r}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : (
        <DataTable
          columns={columns}
          rows={users}
          onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
          rowActions={(row) => (
            <TableAction onClick={() => navigate(`/admin/users/${row.id}`)}>View</TableAction>
          )}
          emptyTitle="No users found"
          emptyMessage="Try a different filter or search term."
        />
      )}
    </div>
  );
}
