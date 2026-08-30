import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { getSubscriptionById } from "../../api/admin";
import {
  SUBSCRIPTION_INVOICES, SUBSCRIPTION_RECEIPTS, SUBSCRIPTION_TERMS_ACCEPTANCE,
} from "../../Data/adminSubscriptionMock";
import SubscriptionTabs from "../components/SubscriptionTabs";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

const NAVY = "#1E293B", MUTED = "#6B7280", BORDER = "rgba(16,24,40,0.12)";
const CARD = { boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: "1px solid rgba(16,24,40,0.08)" };
const SUB_TABS = ["Invoices", "Receipts", "Terms Acceptance"];

function DocsTable({ rows, numberLabel }) {
  if (!rows.length) return <p className="text-sm" style={{ color: MUTED }}>No records yet.</p>;
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr style={{ backgroundColor: "rgba(16,24,40,0.05)" }}>
          {["Date", numberLabel, "Amount", "Status", "Download"].map((h) => (
            <th key={h} className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider" style={{ color: NAVY }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(16,24,40,0.07)" : "none" }}>
            <td className="px-3 py-2.5" style={{ color: NAVY }}>{r.date}</td>
            <td className="px-3 py-2.5" style={{ color: MUTED }}>{r.number}</td>
            <td className="px-3 py-2.5 font-medium" style={{ color: NAVY }}>{r.amount}</td>
            <td className="px-3 py-2.5"><StatusTag status={r.status} /></td>
            <td className="px-3 py-2.5"><span className="text-xs font-semibold cursor-pointer" style={{ color: "#2563EB" }}>Download</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TermsAcceptanceTab({ record, business }) {
  if (!record) return <p className="text-sm" style={{ color: MUTED }}>No terms acceptance record found.</p>;
  const { documents, details } = record;

  return (
    <div className="flex flex-col gap-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ backgroundColor: "rgba(16,24,40,0.05)" }}>
            {["Document", "Version", "Accepted On", "Action"].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider" style={{ color: NAVY }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {documents.map((d, i) => (
            <tr key={i} style={{ borderBottom: i < documents.length - 1 ? "1px solid rgba(16,24,40,0.07)" : "none" }}>
              <td className="px-3 py-2.5" style={{ color: NAVY }}>{d.document}</td>
              <td className="px-3 py-2.5" style={{ color: MUTED }}>{d.version}</td>
              <td className="px-3 py-2.5" style={{ color: NAVY }}>{d.acceptedOn}</td>
              <td className="px-3 py-2.5"><span className="text-xs font-semibold cursor-pointer" style={{ color: "#2563EB" }}>View</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="px-4 py-3 rounded-xl text-xs font-medium" style={{ backgroundColor: "rgba(16,24,40,0.05)", color: "#374151" }}>
        This record is automatically generated and stored when a user accepts our terms. It cannot be edited.
      </div>

      <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
        <h3 className="font-bold text-base" style={{ color: NAVY }}>Acceptance Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            ["Business Name", details.businessName ?? business?.business],
            ["Accepted By", details.acceptedBy],
            ["IP Address", details.ipAddress],
            ["User Agent", details.userAgent],
            ["Acceptance Method", details.acceptanceMethod],
            ["Reference", details.reference],
          ].map(([l, v]) => (
            <div key={l} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{l}</span>
              <span className="text-sm font-medium" style={{ color: NAVY }}>{v}</span>
            </div>
          ))}
        </div>
        <p className="text-xs pt-3" style={{ color: MUTED, borderTop: `1px solid ${BORDER}` }}>
          By using Business Town, you agree to our <span className="font-semibold cursor-pointer" style={{ color: "#2563EB" }}>Terms &amp; Conditions</span>.
        </p>
      </div>
    </div>
  );
}

export default function SubscriptionDocumentsPage() {
  const { id } = useParams();
  const { data: sub, loading } = useFetch(() => getSubscriptionById(id), [id]);
  const [tab, setTab] = useState("Invoices");

  if (loading) return <LoadingState />;
  if (!sub) return <EmptyState title="Not found" />;

  const invoices = SUBSCRIPTION_INVOICES[id] ?? [];
  const receipts = SUBSCRIPTION_RECEIPTS[id] ?? [];
  const termsRecord = SUBSCRIPTION_TERMS_ACCEPTANCE[id];

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <Link to="/admin/subscriptions" className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: NAVY }}>← Subscriptions</Link>

      <SubscriptionTabs id={id} active="documents" />

      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Documents</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>View important documents and records for {sub.business}.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {SUB_TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={tab === t ? { backgroundColor: "#2563EB", color: "#fff" } : { backgroundColor: "#fff", color: NAVY, border: `1.5px solid ${BORDER}` }}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6" style={CARD}>
        {tab === "Invoices" && <DocsTable rows={invoices} numberLabel="Invoice Number" />}
        {tab === "Receipts" && <DocsTable rows={receipts} numberLabel="Receipt Number" />}
        {tab === "Terms Acceptance" && <TermsAcceptanceTab record={termsRecord} business={sub} />}
      </div>
    </div>
  );
}
