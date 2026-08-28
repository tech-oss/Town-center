import useFetch from "../../hooks/useFetch";
import { getAdminEvents } from "../../api/admin";
import DataTable, { TableAction } from "../components/DataTable";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";

export default function EventsNewsPage() {
  const { data: events, loading } = useFetch(getAdminEvents, []);

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
          <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Events</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manage What's On events across the portal.</p>
        </div>
        <button className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>+ Create Event</button>
      </div>

      {loading ? <LoadingState /> : (
        <DataTable
          columns={eventCols}
          rows={events}
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
