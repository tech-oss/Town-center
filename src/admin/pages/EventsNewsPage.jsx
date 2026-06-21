import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import { getAdminEvents, getAdminNews } from "../../api/admin";
import DataTable, { TableAction } from "../components/DataTable";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";

export default function EventsNewsPage() {
  const [tab, setTab] = useState("events");
  const { data: events, loading: loadingEvents } = useFetch(getAdminEvents, []);
  const { data: news, loading: loadingNews } = useFetch(getAdminNews, []);

  const eventCols = [
    { key: "title", label: "Title" },
    { key: "category", label: "Category" },
    { key: "date", label: "Date", muted: true },
    { key: "featured", label: "Featured", render: (v) => (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v ? "text-green-700 bg-green-100" : "text-gray-400 bg-gray-100"}`}>{v ? "Yes" : "No"}</span>
    )},
    { key: "status", label: "Status", render: (v) => <StatusTag status={v} /> },
  ];

  const newsCols = [
    { key: "title", label: "Title" },
    { key: "category", label: "Category" },
    { key: "published", label: "Published", muted: true },
    { key: "featured", label: "Homepage", render: (v) => (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v ? "text-green-700 bg-green-100" : "text-gray-400 bg-gray-100"}`}>{v ? "Featured" : "—"}</span>
    )},
    { key: "status", label: "Status", render: (v) => <StatusTag status={v} /> },
  ];

  const loading = tab === "events" ? loadingEvents : loadingNews;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Events & News</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manage What's On events and Journal news articles.</p>
        </div>
        <button className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>+ Create {tab === "events" ? "Event" : "Article"}</button>
      </div>

      <div className="flex gap-1 p-1 rounded-xl self-start" style={{ backgroundColor: "rgba(27,67,50,0.08)" }}>
        {[["events", "Events"], ["news", "News"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === v ? { backgroundColor: "#fff", color: "#1B4332", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" } : { color: "#6B7280" }}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : (
        <DataTable
          columns={tab === "events" ? eventCols : newsCols}
          rows={tab === "events" ? events : news}
          rowActions={(row) => (
            <>
              <TableAction onClick={() => {}}>Edit</TableAction>
              <TableAction onClick={() => {}}>{row.featured ? "Unfeature" : "Feature"}</TableAction>
              <TableAction variant="danger" onClick={() => {}}>Delete</TableAction>
            </>
          )}
          emptyTitle={`No ${tab} yet`}
          emptyMessage={`Add your first ${tab === "events" ? "event" : "article"}.`}
        />
      )}
    </div>
  );
}
