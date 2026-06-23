import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import {
  getBusinesses,
  registerBusiness,
  approveBusiness,
  rejectBusiness,
  BUSINESS_CATEGORIES,
  BUSINESS_PLANS,
} from "../../api/admin";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg flex items-center gap-3 max-w-sm"
      style={{ backgroundColor: "#1B4332", color: "#fff" }}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-lg leading-none">✕</button>
    </div>
  );
}

// ─── Register form ────────────────────────────────────────────────────────────
function RegisterBusinessForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    category: BUSINESS_CATEGORIES[0],
    contactName: "",
    email: "",
    phone: "",
    address: "",
    plan: "Basic",
  });

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  const isValid = form.name.trim() && form.email.trim() && form.contactName.trim();

  const field = { border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" };

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={{ boxShadow: "0 4px 24px rgba(13,42,51,0.1)", border: "1.5px solid rgba(27,67,50,0.12)" }}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-bold" style={{ color: "#1B4332" }}>Register New Business</h3>
        <button onClick={onCancel} className="text-lg leading-none opacity-40 hover:opacity-70" style={{ color: "#1B4332" }}>✕</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Business Name *</span>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. The Velvet Lounge" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Category</span>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ ...field, backgroundColor: "#fff" }}>
            {BUSINESS_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Subscription Plan</span>
          <select value={form.plan} onChange={(e) => set("plan", e.target.value)} className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ ...field, backgroundColor: "#fff" }}>
            {BUSINESS_PLANS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Contact Name *</span>
          <input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="e.g. Olivia Grant" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Email *</span>
          <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="owner@business.co.uk" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Phone</span>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01628 555 000" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Address</span>
          <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="High Street, Maidenhead SL6" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
        </label>
      </div>

      <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "rgba(27,67,50,0.1)" }}>
        <button onClick={() => onSave(form)} disabled={!isValid} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40" style={{ backgroundColor: "#2D6A4F" }}>
          Register Business
        </button>
        <button onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "#6B7280", border: "1.5px solid #D1D5DB" }}>
          Cancel
        </button>
      </div>
      <p className="text-xs -mt-2" style={{ color: "#9CA3AF" }}>New registrations start as <span className="font-semibold">Pending</span> until an admin approves them.</p>
    </div>
  );
}

// ─── Business row ─────────────────────────────────────────────────────────────
function BusinessRow({ biz, onApprove, onReject }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-start gap-4 flex-wrap" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.06)", border: "1px solid rgba(27,67,50,0.08)" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold shrink-0" style={{ backgroundColor: "rgba(45,106,79,0.1)", color: "#2D6A4F" }}>
        {biz.name[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-bold" style={{ color: "#1B4332" }}>{biz.name}</span>
          <StatusTag status={biz.status} />
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ backgroundColor: "rgba(27,67,50,0.07)", color: "#6B7280" }}>{biz.plan}</span>
        </div>
        <p className="text-xs font-semibold mb-1" style={{ color: "#2D6A4F" }}>{biz.category}</p>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs" style={{ color: "#6B7280" }}>
          <span>👤 {biz.contactName}</span>
          <span>✉️ {biz.email}</span>
          {biz.phone && <span>📞 {biz.phone}</span>}
          {biz.address && <span className="truncate">📍 {biz.address}</span>}
        </div>
        <p className="text-[11px] mt-1.5" style={{ color: "#9CA3AF" }}>Submitted {biz.submitted}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 shrink-0">
        {biz.status === "Pending" ? (
          <>
            <button onClick={() => onApprove(biz)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>✓ Approve Users</button>
            <button onClick={() => onReject(biz)} className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Reject</button>
          </>
        ) : biz.status === "Approved" ? (
          <span className="text-xs font-semibold px-3 py-2 rounded-xl text-center" style={{ backgroundColor: "rgba(45,106,79,0.1)", color: "#2D6A4F" }}>✓ Users active</span>
        ) : (
          <button onClick={() => onApprove(biz)} className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70" style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }}>Re-approve</button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BusinessesPage() {
  const { data: fetched, loading } = useFetch(getBusinesses, []);
  const [local, setLocal] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);

  const list = local ?? fetched ?? [];

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function handleRegister(form) {
    registerBusiness(form).then((saved) => {
      setLocal((prev) => [saved, ...(prev ?? fetched ?? [])]);
      setShowForm(false);
      notify(`"${saved.name}" registered — pending approval.`);
    });
  }

  function handleApprove(biz) {
    approveBusiness(biz.id).then(() => {
      setLocal((prev) => (prev ?? fetched ?? []).map((b) => b.id === biz.id ? { ...b, status: "Approved" } : b));
      notify(`"${biz.name}" approved — its users can now log in.`);
    });
  }

  function handleReject(biz) {
    rejectBusiness(biz.id).then(() => {
      setLocal((prev) => (prev ?? fetched ?? []).map((b) => b.id === biz.id ? { ...b, status: "Rejected" } : b));
      notify(`"${biz.name}" rejected.`);
    });
  }

  const filtered = statusFilter === "All" ? list : list.filter((b) => b.status === statusFilter);
  const counts = {
    Pending: list.filter((b) => b.status === "Pending").length,
    Approved: list.filter((b) => b.status === "Approved").length,
    Rejected: list.filter((b) => b.status === "Rejected").length,
  };

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Business Registrations</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Register new businesses and approve their users so they can start using the platform.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0" style={{ backgroundColor: "#2D6A4F" }}>
            + Register Business
          </button>
        )}
      </div>

      {showForm && <RegisterBusinessForm onSave={handleRegister} onCancel={() => setShowForm(false)} />}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending approval", value: counts.Pending, accent: "#E8A33D" },
          { label: "Approved", value: counts.Approved, accent: "#2D6A4F" },
          { label: "Rejected", value: counts.Rejected, accent: "#991B1B" },
        ].map(({ label, value, accent }) => (
          <div key={label} className="bg-white rounded-2xl p-4 flex flex-col gap-1" style={{ boxShadow: "0 2px 10px rgba(13,42,51,0.06)", border: "1px solid rgba(27,67,50,0.08)" }}>
            <span className="text-2xl font-bold" style={{ color: accent }}>{value}</span>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={statusFilter === s
              ? { backgroundColor: "#1B4332", color: "#fff" }
              : { backgroundColor: "#fff", color: "#1B4332", border: "1.5px solid rgba(27,67,50,0.2)" }
            }
          >
            {s}{s !== "All" && counts[s] != null ? ` (${counts[s]})` : ""}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState title="No businesses here" message="Register a business or change the filter." icon="🏢" />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((biz) => (
            <BusinessRow key={biz.id} biz={biz} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </div>
      )}
    </div>
  );
}
