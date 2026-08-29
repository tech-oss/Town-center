import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import { getAdminEvents } from "../../api/admin";
import DataTable, { TableAction } from "../components/DataTable";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";

const NAVY = "#1E293B", BLUE = "#2563EB", MUTED = "#6B7280", BORDER = "rgba(16,24,40,0.12)";
const TABS = ["All", "Published", "Draft", "Hidden"];

export default function EventsNewsPage() {
  const { data: events, loading } = useFetch(getAdminEvents, []);
  const [tab, setTab] = useState("All");

  const filtered = tab === "All" ? (events ?? []) : (events ?? []).filter((e) => e.status === tab);

  const eventCols = [
    { key: "title", label: "Title" },
    { key: "category", label: "Category" },
    { key: "date", label: "Date", muted: true },
    { key: "featured", label: "Featured", render: (v) => (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v ? "text-green-700 bg-green-100" : "text-gray-400 bg-gray-100"}`}>{v ? "Yes" : "No"}</span>
    )},
    { key: "status", label: "Status", render: (v) => <StatusTag status={v} /> },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Events</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Manage What's On events across the portal.</p>
        </div>
        <button className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: BLUE }}>+ Create Event</button>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: BORDER }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2.5 text-sm font-medium transition-all"
            style={{ color: tab === t ? BLUE : MUTED, borderBottom: tab === t ? `2px solid ${BLUE}` : "2px solid transparent", marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : (
        <DataTable
          columns={eventCols}
          rows={filtered}
          rowActions={(row) => (
            <>
              <TableAction onClick={() => {}}>Edit</TableAction>
              <TableAction onClick={() => {}}>{row.featured ? "Unfeature" : "Feature"}</TableAction>
              <TableAction variant="danger" onClick={() => {}}>Delete</TableAction>
            </>
          )}
          emptyTitle="No events yet"
          emptyMessage="Add your first event."
        />
      )}
    </div>
  );
}
