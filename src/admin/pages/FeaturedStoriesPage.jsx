import { useState } from "react";

// ─── Static mock stories (UI only — not wired to any data layer) ──────────────
const MOCK_STORIES = [
  {
    id: 1,
    category: "Fitness & Wellbeing",
    title: "Jetts Maidenhead: 24/7 Fitness in the Heart of Town",
    excerpt:
      "A modern, results-driven gym built around one simple idea — train whenever you want, on your own terms, with no barriers.",
    image: "/images/jetts/exterior.jpg",
    href: "/news/jetts-maidenhead",
    order: 1,
    status: "Published",
  },
  {
    id: 2,
    category: "Shopping",
    title: "New Season Arrivals at Maidenhead's Independent Boutiques",
    excerpt:
      "Discover the latest collections landing in town this month — from contemporary fashion to handcrafted homewares.",
    image: "/images/shopping/boutique.jpg",
    href: "/news/new-season-arrivals",
    order: 2,
    status: "Published",
  },
  {
    id: 3,
    category: "Eat & Drink",
    title: "Coppa Club Opens its Terrace for Summer",
    excerpt:
      "Riverside dining returns — Coppa Club's outdoor terrace is open for al fresco lunches, sunset cocktails and lazy weekend brunches.",
    image: "/images/coppa/terrace.jpg",
    href: "/news/coppa-club-terrace",
    order: 3,
    status: "Draft",
  },
];

const CATEGORIES = [
  "Fitness & Wellbeing",
  "Shopping",
  "Eat & Drink",
  "Arts & Culture",
  "Community",
  "Property",
  "Events",
  "News",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const isPublished = status === "Published";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={
        isPublished
          ? { backgroundColor: "rgba(45,106,79,0.12)", color: "#2D6A4F" }
          : { backgroundColor: "rgba(107,114,128,0.1)", color: "#6B7280" }
      }
    >
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{ backgroundColor: isPublished ? "#2D6A4F" : "#9CA3AF" }}
      />
      {status}
    </span>
  );
}

// ─── Story card (list view) ───────────────────────────────────────────────────
function StoryCard({ story, index, total, onEdit, onDelete, onMoveUp, onMoveDown }) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden flex flex-col sm:flex-row"
      style={{
        boxShadow: "0 2px 16px rgba(13,42,51,0.07)",
        border: "1px solid rgba(27,67,50,0.09)",
      }}
    >
      {/* Image */}
      <div
        className="relative shrink-0 w-full sm:w-52 h-40 sm:h-auto bg-gray-100 overflow-hidden"
        style={{ minHeight: 140 }}
      >
        {story.image ? (
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl" style={{ backgroundColor: "rgba(27,67,50,0.06)" }}>
            🖼
          </div>
        )}
        {/* Order badge */}
        <div
          className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: "#1B4332" }}
        >
          {story.order}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-5 flex flex-col gap-2 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#2D6A4F" }}>
            {story.category}
          </span>
          <StatusPill status={story.status} />
        </div>
        <h3 className="text-base font-bold leading-snug" style={{ color: "#1B4332", fontFamily: "var(--font-heading, Georgia, serif)" }}>
          {story.title}
        </h3>
        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "#6B7280" }}>
          {story.excerpt}
        </p>
        <p className="text-xs font-mono mt-auto pt-1" style={{ color: "#9CA3AF" }}>{story.href}</p>
      </div>

      {/* Actions */}
      <div className="flex sm:flex-col items-center justify-end gap-2 p-4 border-t sm:border-t-0 sm:border-l" style={{ borderColor: "rgba(27,67,50,0.08)" }}>
        {/* Reorder */}
        <div className="flex sm:flex-col gap-1">
          <button
            onClick={() => onMoveUp(story.id)}
            disabled={index === 0}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-opacity disabled:opacity-25 hover:opacity-70"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }}
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => onMoveDown(story.id)}
            disabled={index === total - 1}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-opacity disabled:opacity-25 hover:opacity-70"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }}
            title="Move down"
          >
            ↓
          </button>
        </div>

        <div className="flex sm:flex-col gap-1 ml-auto sm:ml-0">
          <button
            onClick={() => onEdit(story)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1.5px solid rgba(27,67,50,0.22)", color: "#1B4332" }}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(story.id)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Preview card (mirrors the public site layout) ────────────────────────────
function PublicPreviewCard({ story }) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col md:flex-row gap-0 bg-white"
      style={{ boxShadow: "0 4px 24px rgba(13,42,51,0.1)", border: "1px solid rgba(27,67,50,0.08)" }}
    >
      <div className="md:w-1/2 h-52 md:h-auto bg-gray-100 overflow-hidden">
        {story.image ? (
          <img src={story.image} alt={story.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl" style={{ backgroundColor: "rgba(27,67,50,0.05)" }}>🖼</div>
        )}
      </div>
      <div className="flex-1 p-8 flex flex-col justify-center gap-4">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#2D6A4F" }}>{story.category}</p>
        <h3 className="text-2xl font-bold leading-snug" style={{ color: "#0D2A33", fontFamily: "var(--font-heading, Georgia, serif)" }}>{story.title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>{story.excerpt}</p>
        <button
          className="self-start px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#52B788" }}
        >
          Read more →
        </button>
      </div>
    </div>
  );
}

// ─── Add / Edit form ──────────────────────────────────────────────────────────
function StoryForm({ initial, onSave, onCancel }) {
  const blank = {
    category: CATEGORIES[0],
    title: "",
    excerpt: "",
    image: "",
    href: "",
    status: "Published",
  };
  const [form, setForm] = useState(initial ?? blank);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  const isValid = form.title.trim() && form.excerpt.trim();

  return (
    <div
      className="bg-white rounded-2xl p-6 flex flex-col gap-5"
      style={{ boxShadow: "0 4px 24px rgba(13,42,51,0.1)", border: "1.5px solid rgba(27,67,50,0.12)" }}
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-bold" style={{ color: "#1B4332" }}>
          {initial?.id ? "Edit Story" : "Add Featured Story"}
        </h3>
        <button onClick={onCancel} className="text-lg leading-none opacity-40 hover:opacity-70" style={{ color: "#1B4332" }}>✕</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
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

        {/* Title */}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Title *</span>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Jetts Maidenhead: 24/7 Fitness in the Heart of Town"
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }}
          />
        </label>

        {/* Excerpt */}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Summary / excerpt *</span>
          <textarea
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={3}
            placeholder="Short description shown on the homepage card…"
            className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
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
            <img src={form.image} alt="" className="mt-1.5 w-28 h-16 object-cover rounded-lg" style={{ border: "1px solid rgba(27,67,50,0.1)" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          )}
        </label>

        {/* Link / slug */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Link (page URL)</span>
          <input
            value={form.href}
            onChange={(e) => set("href", e.target.value)}
            placeholder="/news/story-slug"
            className="rounded-xl px-3 py-2.5 text-sm outline-none font-mono"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }}
          />
        </label>
      </div>

      {/* Live mini-preview */}
      {(form.title || form.excerpt) && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#9CA3AF" }}>Preview</p>
          <PublicPreviewCard story={form} />
        </div>
      )}

      <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "rgba(27,67,50,0.1)" }}>
        <button
          onClick={() => onSave(form)}
          disabled={!isValid}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#2D6A4F" }}
        >
          {initial?.id ? "Save Changes" : "Add Story"}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: "#6B7280", border: "1.5px solid #D1D5DB" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────
function DeleteModal({ story, onConfirm, onCancel }) {
  if (!story) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg" style={{ backgroundColor: "rgba(185,28,28,0.1)" }}>🗑</div>
          <div>
            <h3 className="font-bold text-sm mb-1" style={{ color: "#1B4332" }}>Remove Featured Story?</h3>
            <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
              "<span className="font-semibold">{story.title}</span>" will be removed from the Featured Stories section on the homepage.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#991B1B" }}>Remove</button>
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ border: "1.5px solid #D1D5DB", color: "#374151" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FeaturedStoriesPage() {
  const [stories, setStories] = useState(MOCK_STORIES);
  const [editing, setEditing] = useState(null);   // null=list, {}=new, story=edit
  const [toDelete, setToDelete] = useState(null);
  const [previewId, setPreviewId] = useState(null);

  const previewStory = stories.find((s) => s.id === previewId) ?? stories[0];

  function handleSave(form) {
    if (form.id) {
      setStories((prev) => prev.map((s) => (s.id === form.id ? { ...s, ...form } : s)));
    } else {
      setStories((prev) => [
        ...prev,
        { ...form, id: Date.now(), order: prev.length + 1 },
      ]);
    }
    setEditing(null);
  }

  function handleDelete(id) {
    setStories((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
    setToDelete(null);
  }

  function moveUp(id) {
    setStories((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
  }

  function moveDown(id) {
    setStories((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
  }

  return (
    <>
      <DeleteModal
        story={toDelete}
        onConfirm={() => handleDelete(toDelete.id)}
        onCancel={() => setToDelete(null)}
      />

      <div className="flex flex-col gap-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Featured Stories</h1>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              Manage the featured story cards shown on the Maidenhead homepage. Drag to reorder or use the arrows.
            </p>
          </div>
          {editing === null && (
            <button
              onClick={() => setEditing({})}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
              style={{ backgroundColor: "#2D6A4F" }}
            >
              + Add Story
            </button>
          )}
        </div>

        {/* Add / Edit form */}
        {editing !== null && (
          <StoryForm
            initial={editing?.id ? editing : null}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total stories", value: stories.length },
            { label: "Published", value: stories.filter((s) => s.status === "Published").length, accent: true },
            { label: "Drafts", value: stories.filter((s) => s.status === "Draft").length },
          ].map(({ label, value, accent }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-4 flex flex-col gap-1"
              style={{ boxShadow: "0 2px 10px rgba(13,42,51,0.06)", border: "1px solid rgba(27,67,50,0.08)" }}
            >
              <span className="text-2xl font-bold" style={{ color: accent ? "#2D6A4F" : "#1B4332" }}>{value}</span>
              <span className="text-xs" style={{ color: "#9CA3AF" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Stories list */}
        {stories.length === 0 ? (
          <div
            className="bg-white rounded-2xl p-12 flex flex-col items-center gap-3 text-center"
            style={{ border: "2px dashed rgba(27,67,50,0.15)" }}
          >
            <span className="text-4xl">📰</span>
            <p className="font-semibold" style={{ color: "#1B4332" }}>No featured stories yet</p>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>Click "Add Story" to create the first one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {stories.map((story, i) => (
              <StoryCard
                key={story.id}
                story={story}
                index={i}
                total={stories.length}
                onEdit={(s) => setEditing(s)}
                onDelete={(id) => setToDelete(stories.find((s) => s.id === id))}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
              />
            ))}
          </div>
        )}

        {/* Public preview panel */}
        {stories.length > 0 && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#9CA3AF" }}>Homepage Preview</p>
                <p className="text-sm font-semibold" style={{ color: "#1B4332" }}>How it looks on the public site</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {stories.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setPreviewId(s.id)}
                    className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                    style={
                      (previewId ?? stories[0].id) === s.id
                        ? { backgroundColor: "#1B4332", color: "#fff" }
                        : { backgroundColor: "#fff", color: "#1B4332", border: "1.5px solid rgba(27,67,50,0.2)" }
                    }
                  >
                    Story {s.order}
                  </button>
                ))}
              </div>
            </div>
            <PublicPreviewCard story={previewStory} />
            <p className="text-xs mt-3 text-center" style={{ color: "#9CA3AF" }}>
              This is a live preview of how the selected story will appear on the Maidenhead homepage.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
