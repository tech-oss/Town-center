import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { getSubscriptions, getSubscriptionById, grantTrial, resolveDispute } from "../../api/admin";
import { TIER_FEATURES, SUBSCRIPTION_PAYMENTS } from "../../Data/adminMissingScreensMock";
import DataTable, { TableAction } from "../components/DataTable";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

const TIER_COLOURS = { Premium: "#1E293B", Standard: "#1E293B", Agent: "#374151", Basic: "#9CA3AF", Free: "#9CA3AF" };
const TIERS = ["Free", "Basic", "Standard", "Premium"];

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg" style={{ backgroundColor: "#15803D", color: "#fff" }}>
      ✓ {message}
    </div>
  );
}

function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(16,24,40,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <p className="text-base font-bold" style={{ color: "#1E293B" }}>{title}</p>
        <p className="text-sm" style={{ color: "#6B7280" }}>{body}</p>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ color: "#6B7280", border: "1.5px solid #D1D5DB" }}>Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#DC2626" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: sub, loading } = useFetch(() => getSubscriptionById(id), [id]);
  const [message, setMessage] = useState(null);
  const [toast, setToast] = useState(null);
  const [newTier, setNewTier] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  if (loading) return <LoadingState />;
  if (!sub) return <EmptyState title="Not found" />;

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  function handleGrantTrial() {
    // TODO: call Stripe API on backend integration
    grantTrial(id).then((r) => { setMessage(r.message); notify("30-day trial granted."); });
  }
  function handleResolve() { resolveDispute(id).then((r) => setMessage(r.message)); }
  function handleApplyTier() {
    // TODO: call Stripe API on backend integration
    if (!newTier) return;
    notify(`Plan tier changed to ${newTier}.`);
  }
  function handleCancelSubscription() {
    // TODO: call Stripe API on backend integration
    setConfirmCancel(false);
    setCancelled(true);
    notify("Subscription cancelled.");
  }
  function handleSendReminder() {
    // TODO: trigger Resend email on backend integration
    notify(`Renewal reminder sent to ${sub.owner}.`);
  }

  const payments = SUBSCRIPTION_PAYMENTS[id] ?? [];
  const features = TIER_FEATURES[sub.tier] ?? [];

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <Toast message={toast} />
      {confirmCancel && (
        <ConfirmModal
          title="Cancel this subscription?"
          body={`${sub.business} will lose access to paid features immediately. This cannot be undone from here.`}
          confirmLabel="Cancel Subscription"
          onConfirm={handleCancelSubscription}
          onCancel={() => setConfirmCancel(false)}
        />
      )}

      <Link to="/admin/subscriptions" className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: "#1E293B" }}>← Subscriptions</Link>

      {message && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: "rgba(16,24,40,0.1)", color: "#1E293B" }}>{message}</div>
      )}

      {cancelled && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: "rgba(185,28,28,0.1)", color: "#991B1B" }}>This subscription has been cancelled.</div>
      )}

      {/* Summary card */}
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: "1px solid rgba(16,24,40,0.08)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>{sub.business}</h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>{sub.owner} · {sub.owner.toLowerCase().replace(/\s+/g, ".")}@{sub.business.toLowerCase().replace(/[^a-z0-9]+/g, "")}.co.uk</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${TIER_COLOURS[sub.tier]}20`, color: TIER_COLOURS[sub.tier] }}>{sub.tier}</span>
            <StatusTag status={cancelled ? "Rejected" : sub.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            ["Monthly Fee", sub.monthlyFee > 0 ? `£${sub.monthlyFee}` : "Free"],
            ["Start Date", sub.startDate],
            ["Renewal Date", sub.renewal],
            ["Payment Status", sub.paymentStatus],
            ["Subscription ID", sub.id],
          ].map(([l, v]) => (
            <div key={l} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{l}</span>
              <span className="text-sm font-medium" style={{ color: "#1E293B" }}>{v}</span>
            </div>
          ))}
        </div>

        {sub.status === "Downgraded" && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(217,119,6,0.1)", color: "#92400E" }}>
            ⚠ This account was automatically downgraded due to a failed payment. Manual override available below.
          </div>
        )}

        {sub.paymentStatus === "Failed" && (
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleResolve} className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: "#1E293B", border: "1.5px solid rgba(16,24,40,0.3)" }}>Resolve Dispute</button>
          </div>
        )}
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: "1px solid rgba(16,24,40,0.08)" }}>
        <h2 className="font-bold text-base mb-4" style={{ color: "#1E293B" }}>Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-sm" style={{ color: "#6B7280" }}>No payments recorded yet.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: "rgba(16,24,40,0.05)" }}>
                {["Date", "Amount", "Status", "Invoice"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider" style={{ color: "#1E293B" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i} style={{ borderBottom: i < payments.length - 1 ? "1px solid rgba(16,24,40,0.07)" : "none" }}>
                  <td className="px-3 py-2.5" style={{ color: "#1E293B" }}>{p.date}</td>
                  <td className="px-3 py-2.5 font-medium" style={{ color: "#1E293B" }}>{p.amount}</td>
                  <td className="px-3 py-2.5"><StatusTag status={p.status} /></td>
                  <td className="px-3 py-2.5"><span className="text-xs font-semibold cursor-pointer" style={{ color: "#2563EB" }}>Download PDF</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Features included */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: "1px solid rgba(16,24,40,0.08)" }}>
        <h2 className="font-bold text-base mb-4" style={{ color: "#1E293B" }}>Features Included ({sub.tier})</h2>
        <ul className="flex flex-col gap-2">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#1E293B" }}>
              <span style={{ color: "#15803D" }}>✓</span> {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Manual override */}
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: "1px solid rgba(16,24,40,0.08)" }}>
        <h2 className="font-bold text-base" style={{ color: "#1E293B" }}>Manual Override</h2>

        <div className="flex items-end gap-3 flex-wrap">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Change Tier</span>
            <select value={newTier ?? sub.tier} onChange={(e) => setNewTier(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm outline-none" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B", backgroundColor: "#fff" }}>
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <button onClick={handleApplyTier} className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2563EB" }}>Apply</button>
        </div>

        <div className="flex gap-3 flex-wrap pt-3" style={{ borderTop: "1px solid rgba(16,24,40,0.08)" }}>
          <button onClick={handleGrantTrial} className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: "#1E293B", border: "1.5px solid rgba(16,24,40,0.2)" }}>Grant Trial</button>
          <button onClick={() => setConfirmCancel(true)} disabled={cancelled}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: "#DC2626" }}>
            Cancel Subscription
          </button>
        </div>
      </div>

      {/* Renewal */}
      <div className="bg-white rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap" style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: "1px solid rgba(16,24,40,0.08)" }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>Renewal Date</p>
          <p className="text-lg font-bold" style={{ color: "#1E293B" }}>{sub.renewal}</p>
        </div>
        <button onClick={handleSendReminder} className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: "#1E293B", border: "1.5px solid rgba(16,24,40,0.2)" }}>
          Send Renewal Reminder
        </button>
      </div>

      {/* History timeline */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: "1px solid rgba(16,24,40,0.08)" }}>
        <h2 className="font-bold text-base mb-5" style={{ color: "#1E293B" }}>Subscription History</h2>
        <div className="relative flex flex-col gap-0">
          {sub.history.map((h, i) => (
            <div key={i} className="flex gap-3 pb-5 relative">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: h.type === "payment" ? "#1E293B" : h.type === "downgrade" ? "#E8A33D" : h.type === "warning" ? "#991B1B" : "#1E293B" }} />
                {i < sub.history.length - 1 && <div className="w-px flex-1 mt-1" style={{ backgroundColor: "rgba(16,24,40,0.15)" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug" style={{ color: "#1E293B" }}>{h.event}</p>
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
    { key: "startDate", label: "Start Date", muted: true },
    { key: "renewal", label: "Renewal", muted: true },
    { key: "monthlyFee", label: "Fee", render: (v) => v > 0 ? `£${v}/mo` : <span style={{ color: "#9CA3AF" }}>Free</span> },
    { key: "paymentStatus", label: "Payment", render: (v) => <StatusTag status={v} /> },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Subscriptions & Billing</h1>
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
