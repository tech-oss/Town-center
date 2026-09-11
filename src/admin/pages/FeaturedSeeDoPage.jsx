import { useState } from "react";
import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import {
  getBusinessEvents,
  setEventHomepageFeature,
  swapEventHomepageFeature,
} from "../../api/admin";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

// Picks which three events fill the homepage "WHAT'S ON" grid. The events
// themselves are created and edited under Events — this screen only chooses
// what's live on the homepage, the same way In the Spotlight and Featured
// Stories do for their sections.

const MAX_SLOTS = 3;

// Business submissions carry a plain date with no label; admin-authored events
// can set their own wording ("2nd Sunday of each month") which wins.
function whenLabel(item) {
  if (item.dateLabel) return item.dateLabel;
  if (!item.eventDate) return "No date";
  const [y, m, d] = item.eventDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function Toast({ message, error, onDismiss }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg flex items-center gap-3 max-w-sm"
      style={{ backgroundColor: error ? "#991B1B" : "#1E293B", color: "#fff" }}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-lg leading-none">✕</button>
    </div>
  );
}

function HomeBadge({ active }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap"
      style={active
        ? { backgroundColor: "rgba(220,38,38,0.15)", color: "#B91C1C" }
        : { backgroundColor: "rgba(16,24,40,0.07)", color: "#9CA3AF" }
      }
    >
      {active ? "● LIVE ON HOME PAGE" : "Not featured"}
    </span>
  );
}

function SwapPickerModal({ candidates, onPick, onCancel, title, description }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(16,24,40,0.55)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full flex flex-col gap-4 max-h-[80vh] overflow-y-auto" style={{ boxShadow: "0 20px 60px rgba(16,24,40,0.3)" }}>
        <div>
          <h3 className="font-bold text-base" style={{ color: "#1E293B" }}>{title}</h3>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{description}</p>
        </div>
        <div className="flex flex-col gap-2">
          {candidates.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              className="flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:opacity-80"
              style={{ border: "1.5px solid rgba(16,24,40,0.15)" }}
            >
              {(c.heroImage || c.gallery?.[0]) && (
                <img src={c.heroImage || c.gallery[0]} alt="" className="w-12 h-10 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#1E293B" }}>{c.title}</p>
                <p className="text-xs truncate" style={{ color: "#6B7280" }}>{whenLabel(c)}</p>
              </div>
              <span className="text-xs font-semibold shrink-0" style={{ color: "#2563EB" }}>Swap →</span>
            </button>
          ))}
        </div>
        <div className="flex gap-3 pt-1 border-t" style={{ borderColor: "rgba(16,24,40,0.1)" }}>
          <button onClick={onCancel} className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: "#6B7280", border: "1.5px solid #D1D5DB" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function EventRow({ item, onToggleFeature, onOpenSwap }) {
  const image = item.heroImage || item.gallery?.[0];
  return (
    <div className="bg-white rounded-2xl p-4 flex items-start gap-4" style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: item.homepage ? "1.5px solid rgba(220,38,38,0.35)" : "1px solid rgba(16,24,40,0.08)" }}>
      {image && <img src={image} alt="" className="w-20 h-16 rounded-xl object-cover shrink-0 hidden sm:block" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-bold truncate" style={{ color: "#1E293B" }}>{item.title}</span>
          <HomeBadge active={item.homepage} />
        </div>
        <p className="text-xs font-semibold mb-1" style={{ color: "#1E293B" }}>
          {whenLabel(item)}{item.eventTime ? ` · ${item.eventTime}` : ""}
        </p>
        <p className="text-xs line-clamp-2" style={{ color: "#6B7280" }}>{item.excerpt || item.description}</p>
        <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>
          {item.businessName ? `${item.businessName} · ` : "Town event · "}{item.location}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        {item.homepage ? (
          <div className="flex gap-2">
            <button onClick={() => onToggleFeature(item)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "#B91C1C", border: "1.5px solid rgba(220,38,38,0.3)" }}>
              Remove from Homepage
            </button>
            <button onClick={() => onOpenSwap(item)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap" style={{ backgroundColor: "rgba(16,24,40,0.07)", color: "#1E293B", border: "1.5px solid rgba(16,24,40,0.15)" }}>
              Swap →
            </button>
          </div>
        ) : (
          <button onClick={() => onToggleFeature(item)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap" style={{ backgroundColor: "rgba(16,24,40,0.07)", color: "#1E293B", border: "1.5px solid rgba(16,24,40,0.15)" }}>
            ☆ Add to Homepage
          </button>
        )}
      </div>
    </div>
  );
}

export default function FeaturedSeeDoPage() {
  const { data: items, loading } = useFetch(() => getBusinessEvents({ status: "Live" }), []);
  const [localItems, setLocalItems] = useState(null);
  const [toast, setToast] = useState(null);
  const [swapPicker, setSwapPicker] = useState(null);
  const [search, setSearch] = useState("");

  const list = localItems ?? items ?? [];
  const featured = list.filter((e) => e.homepage);
  const filtered = list.filter((e) =>
    !search.trim() || e.title?.toLowerCase().includes(search.trim().toLowerCase())
  );

  function showToast(msg, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 4000);
  }

  function handleToggleFeature(item) {
    setEventHomepageFeature(item.id, !item.homepage).then((res) => {
      if (res?.full) {
        setSwapPicker({ item, candidates: list.filter((e) => e.homepage) });
        return;
      }
      setLocalItems((prev) => (prev ?? items ?? []).map((e) => e.id === item.id ? { ...e, homepage: res.homepage } : e));
      showToast(res.homepage ? `"${item.title}" added to the homepage.` : `"${item.title}" removed from the homepage.`);
    });
  }

  function handleOpenSwap(item) {
    const candidates = list.filter((e) => !e.homepage && e.id !== item.id);
    if (candidates.length === 0) {
      showToast("No other live events available to swap in.", true);
      return;
    }
    setSwapPicker({ item, candidates, replacing: true });
  }

  function handleSwapConfirm(pickedId) {
    if (!swapPicker) return;
    const { item, replacing } = swapPicker;
    const addId = replacing ? pickedId : item.id;
    const removeId = replacing ? item.id : pickedId;
    swapEventHomepageFeature(addId, removeId).then(() => {
      setLocalItems((prev) => (prev ?? items ?? []).map((e) => {
        if (e.id === addId) return { ...e, homepage: true };
        if (e.id === removeId) return { ...e, homepage: false };
        return e;
      }));
      showToast("Homepage event swapped.");
      setSwapPicker(null);
    });
  }

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Toast message={toast?.msg} error={toast?.error} onDismiss={() => setToast(null)} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>See &amp; Do on the Homepage</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Choose which {MAX_SLOTS} live events fill the homepage "What's On" grid. Create and edit the events themselves under Events.
          </p>
        </div>
        <Link to="/admin/event-approvals" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }}>
          Go to Events →
        </Link>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #16252E 0%, #245C63 60%, #2F8C8C 100%)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(216,243,220,0.7)" }}>Homepage</p>
            <h2 className="text-lg font-bold text-white">What's On</h2>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{featured.length}/{MAX_SLOTS} slots used.</p>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: MAX_SLOTS }, (_, i) => (
              <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={i < featured.length ? { backgroundColor: "#E8A33D", color: "#fff" } : { backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.3)" }}>
                {i < featured.length ? "★" : "○"}
              </div>
            ))}
          </div>
        </div>
        {featured.length > 0 ? (
          <div className="flex flex-col gap-2">
            {featured.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl px-3 py-2 flex-wrap" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                {(f.heroImage || f.gallery?.[0]) && <img src={f.heroImage || f.gallery[0]} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-white">{f.title}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{whenLabel(f)}</p>
                </div>
                <button onClick={() => handleOpenSwap(f)} className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-opacity hover:opacity-70" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.35)" }}>Swap</button>
                <button onClick={() => handleToggleFeature(f)} className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-opacity hover:opacity-70" style={{ color: "#E8A33D", border: "1px solid rgba(232,163,61,0.5)" }}>Remove</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-center py-2" style={{ color: "rgba(255,255,255,0.35)" }}>
            No events on the homepage — the "What's On" section is hidden until you pick one.
          </p>
        )}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search live events…"
        className="rounded-xl px-3 py-2.5 text-sm outline-none max-w-sm"
        style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No live events"
          message="Only events with a Live status can be featured. Create one under Events, or approve a pending submission."
          icon="🎪"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <EventRow key={item.id} item={item} onToggleFeature={handleToggleFeature} onOpenSwap={handleOpenSwap} />
          ))}
        </div>
      )}

      {swapPicker && (
        <SwapPickerModal
          candidates={swapPicker.candidates}
          onPick={handleSwapConfirm}
          onCancel={() => setSwapPicker(null)}
          title={swapPicker.replacing ? `Swap out "${swapPicker.item.title}"` : `Homepage is full (${MAX_SLOTS}/${MAX_SLOTS})`}
          description={swapPicker.replacing
            ? "Pick a live event below to put on the homepage in its place."
            : `The homepage shows ${MAX_SLOTS} events. Pick one of the live events below to swap it out with.`}
        />
      )}
    </div>
  );
}
