import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import {
  getNewsOffers,
  saveNewsOffer,
  deleteNewsOffer,
  toggleHomepageFeature,
  EAT_DRINK_BUSINESSES,
} from "../../api/admin";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

const CATEGORIES = ["News", "Offer", "What's On", "Featured"];
const TYPES = ["news", "offer"];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, error, onDismiss }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg flex items-center gap-3 max-w-sm"
      style={{ backgroundColor: error ? "#991B1B" : "#1B4332", color: "#fff" }}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-lg leading-none">✕</button>
    </div>
  );
}

// ─── Spotlight badge ──────────────────────────────────────────────────────────
function SpotlightBadge({ active }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap"
      style={active
        ? { backgroundColor: "rgba(232,163,61,0.18)", color: "#92400E" }
        : { backgroundColor: "rgba(27,67,50,0.07)", color: "#9CA3AF" }
      }
    >
      {active ? "★ On Homepage" : "Not featured"}
    </span>
  );
}

// ─── Edit / Create form ───────────────────────────────────────────────────────
function NewsOfferForm({ initial, onSave, onCancel, featuredCount }) {
  const blank = {
    businessId: EAT_DRINK_BUSINESSES[0].id,
    businessName: EAT_DRINK_BUSINESSES[0].name,
    category: "News",
    type: "news",
    title: "",
    excerpt: "",
    body: "",
    image: "",
    date: "",
    status: "Published",
    featuredOnHome: false,
  };
  const [form, setForm] = useState(initial ?? blank);
  const [saving, setSaving] = useState(false);

  function set(k, v) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      // Keep businessName in sync with businessId
      if (k === "businessId") {
        const biz = EAT_DRINK_BUSINESSES.find((b) => b.id === v);
        next.businessName = biz?.name ?? v;
      }
      return next;
    });
  }

  function handleSave() {
    if (!form.title.trim() || !form.excerpt.trim()) return;
    setSaving(true);
    saveNewsOffer(form).then((saved) => {
      setSaving(false);
      onSave(saved);
    });
  }

  const canFeature = form.featuredOnHome || featuredCount < 3;

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={{ boxShadow: "0 4px 24px rgba(13,42,51,0.1)", border: "1.5px solid rgba(27,67,50,0.12)" }}>
      <h3 className="font-bold text-base" style={{ color: "#1B4332" }}>
        {initial?.id ? "Edit News / Offer" : "Create News / Offer"}
      </h3>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Business */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Business *</span>
          <select
            value={form.businessId}
            onChange={(e) => set("businessId", e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332", backgroundColor: "#fff" }}
          >
            {EAT_DRINK_BUSINESSES.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>

        {/* Category */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Category *</span>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332", backgroundColor: "#fff" }}
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        {/* Title */}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Title *</span>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Summer Cocktail Masterclass"
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }}
          />
        </label>

        {/* Excerpt */}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Short summary (shown on cards) *</span>
          <textarea
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={2}
            placeholder="One or two sentences that appear on the card and homepage spotlight…"
            className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }}
          />
        </label>

        {/* Body */}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Full article / offer body</span>
          <textarea
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            rows={5}
            placeholder="Full text shown on the article detail page. Use blank lines to separate paragraphs."
            className="rounded-xl px-3 py-2.5 text-sm outline-none resize-y"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }}
          />
        </label>

        {/* Image URL */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Image URL</span>
          <input
            value={form.image}
            onChange={(e) => set("image", e.target.value)}
            placeholder="/images/..."
            className="rounded-xl px-3 py-2.5 text-sm outline-none font-mono"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }}
          />
          {form.image && (
            <img src={form.image} alt="" className="mt-1.5 w-24 h-16 object-cover rounded-lg" style={{ border: "1px solid rgba(27,67,50,0.1)" }} />
          )}
        </label>

        {/* Date */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Date / validity text</span>
          <input
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            placeholder="e.g. While stocks last · Monthly · 7pm"
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }}
          />
        </label>

        {/* Status */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Status</span>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332", backgroundColor: "#fff" }}
          >
            <option>Published</option>
            <option>Draft</option>
          </select>
        </label>

        {/* Feature on homepage */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Homepage Spotlight</span>
          <label className="flex items-start gap-3 mt-1 cursor-pointer">
            <div className="relative mt-0.5 shrink-0" onClick={() => canFeature && set("featuredOnHome", !form.featuredOnHome)}>
              <div className="w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: form.featuredOnHome ? "#E8A33D" : "#D1D5DB" }} />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: form.featuredOnHome ? "translateX(20px)" : "none" }} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium" style={{ color: "#1B4332" }}>Feature in "In the Spotlight"</span>
              {!canFeature && !form.featuredOnHome && (
                <span className="text-xs" style={{ color: "#E8A33D" }}>Max 3 items — remove one to add this</span>
              )}
              {canFeature && (
                <span className="text-xs" style={{ color: "#9CA3AF" }}>Appears on the public homepage ({featuredCount}/3 slots used)</span>
              )}
            </div>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "rgba(27,67,50,0.1)" }}>
        <button
          onClick={handleSave}
          disabled={saving || !form.title.trim() || !form.excerpt.trim()}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#2D6A4F" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "#6B7280", border: "1.5px solid #D1D5DB" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Single row card ──────────────────────────────────────────────────────────
function NewsOfferRow({ item, onEdit, onDelete, onToggleFeature }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-start gap-4" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.06)", border: item.featuredOnHome ? "1.5px solid rgba(232,163,61,0.4)" : "1px solid rgba(27,67,50,0.08)" }}>
      {item.image && (
        <img src={item.image} alt="" className="w-20 h-16 rounded-xl object-cover shrink-0 hidden sm:block" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-bold truncate" style={{ color: "#1B4332" }}>{item.title}</span>
          <SpotlightBadge active={item.featuredOnHome} />
          <StatusTag status={item.status} />
        </div>
        <p className="text-xs font-semibold mb-1" style={{ color: "#2D6A4F" }}>{item.businessName} · {item.category}</p>
        <p className="text-xs line-clamp-2" style={{ color: "#6B7280" }}>{item.excerpt}</p>
        {item.date && <p className="text-[11px] mt-1 font-medium" style={{ color: "#9CA3AF" }}>{item.date}</p>}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <button
          onClick={() => onToggleFeature(item)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
          style={item.featuredOnHome
            ? { backgroundColor: "rgba(232,163,61,0.15)", color: "#92400E", border: "1.5px solid rgba(232,163,61,0.4)" }
            : { backgroundColor: "rgba(27,67,50,0.07)", color: "#1B4332", border: "1.5px solid rgba(27,67,50,0.15)" }
          }
        >
          {item.featuredOnHome ? "★ Remove from Homepage" : "☆ Add to Homepage"}
        </button>
        <div className="flex gap-2">
          <button onClick={() => onEdit(item)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70" style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }}>Edit</button>
          <button onClick={() => onDelete(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NewsOffersPage() {
  const { data: items, loading } = useFetch(getNewsOffers, []);
  const [localItems, setLocalItems] = useState(null);
  const [editing, setEditing] = useState(null);        // null = list, {} = new form, item = edit form
  const [bizFilter, setBizFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);

  const list = localItems ?? items ?? [];
  const featuredCount = list.filter((n) => n.featuredOnHome && n.status === "Published").length;

  const filtered = list.filter((n) => {
    if (bizFilter !== "all" && n.businessId !== bizFilter) return false;
    if (statusFilter !== "all" && n.status !== statusFilter) return false;
    return true;
  });

  const featured = list.filter((n) => n.featuredOnHome && n.status === "Published");

  function showToast(msg, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 4000);
  }

  function handleSave(saved) {
    setLocalItems((prev) => {
      const base = prev ?? items ?? [];
      const idx = base.findIndex((n) => n.id === saved.id);
      return idx >= 0 ? base.map((n) => n.id === saved.id ? saved : n) : [...base, saved];
    });
    setEditing(null);
    showToast(editing?.id ? "Changes saved." : "News / offer created.");
  }

  function handleDelete(id) {
    deleteNewsOffer(id).then(() => {
      setLocalItems((prev) => (prev ?? items ?? []).filter((n) => n.id !== id));
      showToast("Deleted.");
    });
  }

  function handleToggleFeature(item) {
    toggleHomepageFeature(item.id).then((res) => {
      if (res?.error) { showToast(res.error, true); return; }
      setLocalItems((prev) =>
        (prev ?? items ?? []).map((n) => n.id === item.id ? { ...n, featuredOnHome: res.featuredOnHome } : n)
      );
      showToast(res.featuredOnHome ? `"${item.title}" added to homepage spotlight.` : `"${item.title}" removed from spotlight.`);
    });
  }

  if (loading) return <LoadingState />;

  // ── Editor view ──────────────────────────────────────────────────────────
  if (editing !== null) {
    return (
      <div className="max-w-3xl flex flex-col gap-4">
        <button onClick={() => setEditing(null)} className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: "#2D6A4F" }}>← Back to list</button>
        <NewsOfferForm
          initial={editing?.id ? editing : null}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          featuredCount={featuredCount}
        />
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Toast message={toast?.msg} error={toast?.error} onDismiss={() => setToast(null)} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Business News & Offers</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manage news and promotions for Eat & Drink businesses. Featured items appear in the homepage "In the Spotlight" section.</p>
        </div>
        <button onClick={() => setEditing({})} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>
          + Create News / Offer
        </button>
      </div>

      {/* Homepage spotlight summary */}
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #16252E 0%, #245C63 60%, #2F8C8C 100%)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(216,243,220,0.7)" }}>Homepage</p>
            <h2 className="text-lg font-bold text-white">In the Spotlight</h2>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{featuredCount}/3 slots used — the first 3 published, featured items appear on the homepage.</p>
          </div>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={i < featuredCount ? { backgroundColor: "#E8A33D", color: "#fff" } : { backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.3)" }}>
                {i < featuredCount ? "★" : "○"}
              </div>
            ))}
          </div>
        </div>
        {featured.length > 0 ? (
          <div className="flex flex-col gap-2">
            {featured.map((f, i) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                <span className="text-xs font-bold w-4 text-center" style={{ color: "#E8A33D" }}>{i + 1}</span>
                {f.image && <img src={f.image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-white">{f.title}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{f.businessName}</p>
                </div>
                <button onClick={() => handleToggleFeature(f)} className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-opacity hover:opacity-70" style={{ color: "#E8A33D", border: "1px solid rgba(232,163,61,0.5)" }}>Remove</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-center py-2" style={{ color: "rgba(255,255,255,0.35)" }}>No items featured — toggle "Add to Homepage" on any published item below.</p>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setBizFilter("all")} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={bizFilter === "all" ? { backgroundColor: "#1B4332", color: "#fff" } : { backgroundColor: "#fff", color: "#1B4332", border: "1.5px solid rgba(27,67,50,0.2)" }}>All businesses</button>
          {EAT_DRINK_BUSINESSES.map((b) => (
            <button key={b.id} onClick={() => setBizFilter(b.id)} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={bizFilter === b.id ? { backgroundColor: "#1B4332", color: "#fff" } : { backgroundColor: "#fff", color: "#1B4332", border: "1.5px solid rgba(27,67,50,0.2)" }}>{b.name}</button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          {["all", "Published", "Draft"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={statusFilter === s ? { backgroundColor: "#2D6A4F", color: "#fff" } : { backgroundColor: "#fff", color: "#374151", border: "1.5px solid rgba(27,67,50,0.15)" }}>{s === "all" ? "All statuses" : s}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState title="Nothing here yet" message="Create a news item or offer, or adjust the filter." icon="📰" />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <NewsOfferRow
              key={item.id}
              item={item}
              onEdit={setEditing}
              onDelete={handleDelete}
              onToggleFeature={handleToggleFeature}
            />
          ))}
        </div>
      )}
    </div>
  );
}
