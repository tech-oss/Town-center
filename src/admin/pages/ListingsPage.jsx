import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import { getListings } from "../../api/admin";
import DataTable, { TableAction } from "../components/DataTable";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";

const SECTION_FILTERS = ["All", "Shop", "Eat & Drink", "See & Do"];

export default function ListingsPage() {
  const [section, setSection] = useState("All");
  const { data: listings, loading } = useFetch(
    () => getListings(section !== "All" ? { section } : {}),
    [section]
  );

  const columns = [
    { key: "name", label: "Business Name" },
    { key: "section", label: "Section" },
    { key: "category", label: "Category", muted: true },
    { key: "owner", label: "Owner", muted: true },
    { key: "tier", label: "Tier", render: (v) => (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: v === "Premium" ? "rgba(82,183,136,0.2)" : "rgba(27,67,50,0.08)", color: "#1B4332" }}>{v}</span>
    )},
    { key: "status", label: "Status", render: (v) => <StatusTag status={v} /> },
    { key: "created", label: "Date Created", muted: true },
    { key: "lastUpdated", label: "Last Updated", muted: true },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Listings (Business Directory)</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>All business directory entries across the portal.</p>
        </div>
        <button className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>+ Add Listing</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {SECTION_FILTERS.map((s) => (
          <button key={s} onClick={() => setSection(s)} className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={section === s ? { backgroundColor: "#1B4332", color: "#fff" } : { backgroundColor: "#fff", color: "#1B4332", border: "1.5px solid rgba(27,67,50,0.2)" }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : (
        <DataTable
          columns={columns}
          rows={listings}
          rowActions={(row) => (
            <>
              <TableAction onClick={() => {}}>Edit</TableAction>
              <TableAction variant="danger" onClick={() => {}}>Remove</TableAction>
            </>
          )}
          emptyTitle="No listings found"
          emptyMessage="Try changing the section filter."
        />
      )}
    </div>
  );
}
