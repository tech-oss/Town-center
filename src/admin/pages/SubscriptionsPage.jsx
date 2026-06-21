import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { getSubscriptions, getSubscriptionById, grantTrial, resolveDispute } from "../../api/admin";
import DataTable, { TableAction } from "../components/DataTable";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

const TIER_COLOURS = { Premium: "#2D6A4F", Standard: "#1B4332", Agent: "#374151", Basic: "#9CA3AF" };

export function SubscriptionDetailPage() {
  const { id } = useParams();
  const { data: sub, loading } = useFetch(() => getSubscriptionById(id), [id]);
  const [message, setMessage] = useState(null);

  if (loading) return <LoadingState />;
  if (!sub) return <EmptyState title="Not found" />;

  function handleGrantTrial() { grantTrial(id).then((r) => setMessage(r.message)); }
  function handleResolve() { resolveDispute(id).then((r) => setMessage(r.message)); }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <Link to="/admin/subscriptions" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "#2D6A4F" }}>← Subscriptions</Link>

      {message && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: "rgba(45,106,79,0.1)", color: "#1B4332" }}>{message}</div>
      )}

      <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1B4332" }}>{sub.business}</h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>{sub.owner}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${TIER_COLOURS[sub.tier]}20`, color: TIER_COLOURS[sub.tier] }}>{sub.tier}</span>
            <StatusTag status={sub.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            ["Monthly Fee", sub.monthlyFee > 0 ? `£${sub.monthlyFee}` : "Free"],
            ["Renewal Date", sub.renewal],
            ["Payment Status", sub.paymentStatus],
            ["Subscription ID", sub.id],
          ].map(([l, v]) => (
            <div key={l} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{l}</span>
              <span className="text-sm font-medium" style={{ color: "#1B4332" }}>{v}</span>
            </div>
          ))}
        </div>

        {sub.status === "Downgraded" && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(217,119,6,0.1)", color: "#92400E" }}>
            ⚠ This account was automatically downgraded due to a failed payment. Manual override available below.
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <button onClick={handleGrantTrial} className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>Grant 30-day Trial</button>
          {sub.paymentStatus === "Failed" && (
            <button onClick={handleResolve} className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: "#1B4332", border: "1.5px solid rgba(27,67,50,0.3)" }}>Resolve Dispute</button>
          )}
        </div>
      </div>

      {/* History timeline */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
        <h2 className="font-bold text-base mb-5" style={{ color: "#1B4332" }}>Subscription History</h2>
        <div className="relative flex flex-col gap-0">
          {sub.history.map((h, i) => (
            <div key={i} className="flex gap-3 pb-5 relative">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: h.type === "payment" ? "#2D6A4F" : h.type === "downgrade" ? "#E8A33D" : h.type === "warning" ? "#991B1B" : "#1B4332" }} />
                {i < sub.history.length - 1 && <div className="w-px flex-1 mt-1" style={{ backgroundColor: "rgba(27,67,50,0.15)" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug" style={{ color: "#1B4332" }}>{h.event}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{h.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const { data: subs, loading } = useFetch(getSubscriptions, []);

  const columns = [
    { key: "business", label: "Business" },
    { key: "owner", label: "Owner", muted: true },
    { key: "tier", label: "Tier", render: (v) => (
      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${TIER_COLOURS[v] ?? "#9CA3AF"}20`, color: TIER_COLOURS[v] ?? "#9CA3AF" }}>{v}</span>
    )},
    { key: "status", label: "Status", render: (v) => <StatusTag status={v} /> },
    { key: "renewal", label: "Renewal", muted: true },
    { key: "monthlyFee", label: "Fee", render: (v) => v > 0 ? `£${v}/mo` : <span style={{ color: "#9CA3AF" }}>Free</span> },
    { key: "paymentStatus", label: "Payment", render: (v) => <StatusTag status={v} /> },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Subscriptions & Billing</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>All business subscription accounts and payment statuses.</p>
      </div>
      {loading ? <LoadingState /> : (
        <DataTable
          columns={columns}
          rows={subs}
          onRowClick={(row) => navigate(`/admin/subscriptions/${row.id}`)}
          rowActions={(row) => <TableAction onClick={() => navigate(`/admin/subscriptions/${row.id}`)}>View</TableAction>}
          emptyTitle="No subscriptions"
          emptyMessage="Subscription data will appear here once businesses sign up."
        />
      )}
    </div>
  );
}
