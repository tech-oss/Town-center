import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import { getAdminProperties, getFeeds } from "../../api/admin";
import DataTable, { TableAction } from "../components/DataTable";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";

const SOURCE_FILTERS = ["All", "manual", "xml"];

export default function PropertiesPage() {
  const [source, setSource] = useState("All");
  const [view, setView] = useState("listings");
  const { data: properties, loading } = useFetch(
    () => getAdminProperties(source !== "All" ? { source } : {}),
    [source]
  );
  const { data: feeds } = useFetch(getFeeds, []);

  const columns = [
    { key: "address", label: "Address", wrap: true },
    { key: "agent", label: "Agent", muted: true, render: (v) => v ?? <span style={{ color: "#9CA3AF" }}>Direct</span> },
    { key: "type", label: "Type" },
    { key: "beds", label: "Beds" },
    { key: "price", label: "Price" },
    { key: "source", label: "Source", render: (v) => (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={v === "xml" ? { backgroundColor: "rgba(59,130,246,0.1)", color: "#1D4ED8" } : { backgroundColor: "rgba(27,67,50,0.08)", color: "#1B4332" }}>
        {v === "xml" ? "XML Import" : "Manual"}
      </span>
    )},
    { key: "status", label: "Status", render: (v) => <StatusTag status={v} /> },
    { key: "listedAt", label: "Listed", muted: true },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Properties</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manual submissions and XML-imported listings.</p>
        </div>
        <button className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>+ Add Property</button>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 rounded-xl self-start" style={{ backgroundColor: "rgba(27,67,50,0.08)" }}>
        {[["listings", "Listings"], ["feeds", "Feed Config"]].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={view === v ? { backgroundColor: "#fff", color: "#1B4332", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" } : { color: "#6B7280" }}>
            {l}
          </button>
        ))}
      </div>

      {view === "listings" && (
        <>
          <div className="flex gap-2 flex-wrap">
            {SOURCE_FILTERS.map((s) => (
              <button key={s} onClick={() => setSource(s)} className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={source === s ? { backgroundColor: "#1B4332", color: "#fff" } : { backgroundColor: "#fff", color: "#1B4332", border: "1.5px solid rgba(27,67,50,0.2)" }}>
                {s === "xml" ? "XML Import" : s === "manual" ? "Manual" : s}
              </button>
            ))}
          </div>
          {loading ? <LoadingState /> : (
            <DataTable
              columns={columns}
              rows={properties}
              rowActions={(row) => (
                row.source === "manual"
                  ? <><TableAction onClick={() => {}}>Edit</TableAction><TableAction variant="danger" onClick={() => {}}>Remove</TableAction></>
                  : <span className="text-xs" style={{ color: "#9CA3AF" }}>Auto-managed</span>
              )}
              emptyTitle="No properties found"
              emptyMessage="Try changing the source filter."
            />
          )}
        </>
      )}

      {view === "feeds" && (
        <div className="flex flex-col gap-4">
          {(feeds ?? []).map((feed) => (
            <div key={feed.id} className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <h3 className="font-bold text-sm" style={{ color: "#1B4332" }}>{feed.name}</h3>
                  <p className="text-xs mt-0.5 break-all" style={{ color: "#6B7280" }}>{feed.url}</p>
                </div>
                <button className="px-4 py-1.5 rounded-lg text-xs font-semibold shrink-0" style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }}>Edit Feed</button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: "rgba(27,67,50,0.05)" }}>
                  <p className="text-lg font-bold" style={{ color: "#1B4332" }}>{feed.imported}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Imported</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: "rgba(217,119,6,0.08)" }}>
                  <p className="text-lg font-bold" style={{ color: "#92400E" }}>{feed.skipped}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#92400E" }}>Skipped</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: feed.errors > 0 ? "rgba(185,28,28,0.08)" : "rgba(27,67,50,0.05)" }}>
                  <p className="text-lg font-bold" style={{ color: feed.errors > 0 ? "#991B1B" : "#1B4332" }}>{feed.errors}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: feed.errors > 0 ? "#991B1B" : "#6B7280" }}>Errors</p>
                </div>
              </div>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Last sync: {new Date(feed.lastSync).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
              {feed.skipLog.length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs font-semibold cursor-pointer" style={{ color: "#2D6A4F" }}>View skip / error log ({feed.skipLog.length})</summary>
                  <ul className="mt-2 flex flex-col gap-1">
                    {feed.skipLog.map((l, i) => (
                      <li key={i} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(185,28,28,0.06)", color: "#991B1B" }}>{l}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
