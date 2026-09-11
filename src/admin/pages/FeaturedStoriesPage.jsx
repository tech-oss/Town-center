import { useState } from "react";
import { uploadImage } from "../../lib/uploadImage";
import useFetch from "../../hooks/useFetch";
import {
  getFeatureArticles,
  saveFeatureArticle,
  deleteFeatureArticle,
  setArticleHomepageFeature,
  swapArticleHomepageFeature,
} from "../../api/admin";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

// Real editor for public.feature_articles — the homepage "FEATURED STORIES"
// / "In Focus" section (src/components/FeatureBlocks.jsx) and its detail
// pages at /story/:slug (src/components/FeatureArticlePage.jsx). Field names
// mirror that component's expectations exactly (see src/api/stories.js).

function slugify(text) {
  return String(text ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function linesToArray(text) {
  return String(text ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
}

// ─── Toast ────────────────────────────────────────────────────────────────────
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

// ─── Homepage badge ─────────────────────────────────────────────────────────────
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

// ─── Swap picker modal (max 2 homepage slots) ───────────────────────────────────
function SwapPickerModal({ candidates, onPick, onCancel, title, description }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(16,24,40,0.55)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full flex flex-col gap-4" style={{ boxShadow: "0 20px 60px rgba(16,24,40,0.3)" }}>
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
              {c.cardImage && <img src={c.cardImage} alt="" className="w-12 h-10 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#1E293B" }}>{c.cardHeading || c.title}</p>
                <p className="text-xs truncate" style={{ color: "#6B7280" }}>{c.category}</p>
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

// ─── Image upload field ───────────────────────────────────────────────────────
function ImageField({ label, value, onChange }) {
  function handleUpload(file) {
    if (!file) return;
    uploadImage(file, "stories").then(onChange).catch((e) => alert(e.message));
  }
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>{label}</span>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 inline-flex items-center gap-2" style={{ backgroundColor: "rgba(16,24,40,0.07)", color: "#1E293B", border: "1.5px solid rgba(16,24,40,0.2)" }}>
          <span>⬆</span> {value ? "Change Image" : "Upload Image"}
          <input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0])} className="hidden" />
        </label>
        {value && (
          <div className="relative">
            <img src={value} alt="" className="w-24 h-16 object-cover rounded-lg" style={{ border: "1px solid rgba(16,24,40,0.1)" }} />
            <button type="button" onClick={() => onChange("")} className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center" style={{ backgroundColor: "#991B1B" }} title="Remove image">✕</button>
          </div>
        )}
      </div>
    </label>
  );
}

// ─── Body block editor ───────────────────────────────────────────────────────────
function BodyBlockEditor({ blocks, onChange }) {
  function updateBlock(i, patch) {
    onChange(blocks.map((b, bi) => (bi === i ? { ...b, ...patch } : b)));
  }
  function addBlock() {
    onChange([...blocks, { heading: "", paras: [] }]);
  }
  function removeBlock(i) {
    onChange(blocks.filter((_, bi) => bi !== i));
  }
  function moveBlock(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => (
        <div key={i} className="rounded-xl p-4 flex flex-col gap-3" style={{ border: "1.5px solid rgba(16,24,40,0.15)" }}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Section {i + 1}</span>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg text-xs disabled:opacity-25" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }}>↑</button>
              <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} className="w-7 h-7 rounded-lg text-xs disabled:opacity-25" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }}>↓</button>
              <button type="button" onClick={() => removeBlock(i)} className="px-2.5 h-7 rounded-lg text-xs font-semibold" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Remove</button>
            </div>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Section heading (optional — first section is often headless)</span>
            <input
              value={block.heading ?? ""}
              onChange={(e) => updateBlock(i, { heading: e.target.value })}
              className="rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Paragraphs (one per line)</span>
            <textarea
              value={(block.paras ?? []).join("\n")}
              onChange={(e) => updateBlock(i, { paras: linesToArray(e.target.value) })}
              rows={4}
              className="rounded-xl px-3 py-2.5 text-sm outline-none resize-y"
              style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Bullet points (optional, one per line)</span>
            <textarea
              value={(block.bullets ?? []).join("\n")}
              onChange={(e) => updateBlock(i, { bullets: linesToArray(e.target.value) })}
              rows={2}
              className="rounded-xl px-3 py-2.5 text-sm outline-none resize-y"
              style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Paragraphs after bullets (optional, one per line)</span>
            <textarea
              value={(block.parasAfter ?? []).join("\n")}
              onChange={(e) => updateBlock(i, { parasAfter: linesToArray(e.target.value) })}
              rows={2}
              className="rounded-xl px-3 py-2.5 text-sm outline-none resize-y"
              style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }}
            />
          </label>
        </div>
      ))}
      <button type="button" onClick={addBlock} className="self-start px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#2563EB" }}>
        + Add Section
      </button>
    </div>
  );
}

// ─── Gallery editor ───────────────────────────────────────────────────────────────
function GalleryEditor({ images, onChange }) {
  function handleAdd(file) {
    if (!file) return;
    uploadImage(file, "stories").then((url) => onChange([...images, url])).catch((e) => alert(e.message));
  }
  function remove(i) {
    onChange(images.filter((_, gi) => gi !== i));
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Gallery images (woven into the article body)</span>
      <div className="flex items-center gap-3 flex-wrap">
        {images.map((src, i) => (
          <div key={i} className="relative">
            <img src={src} alt="" className="w-20 h-16 object-cover rounded-lg" style={{ border: "1px solid rgba(16,24,40,0.1)" }} />
            <button type="button" onClick={() => remove(i)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center" style={{ backgroundColor: "#991B1B" }}>✕</button>
          </div>
        ))}
        <label className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 inline-flex items-center gap-2" style={{ backgroundColor: "rgba(16,24,40,0.07)", color: "#1E293B", border: "1.5px solid rgba(16,24,40,0.2)" }}>
          <span>⬆</span> Add Image
          <input type="file" accept="image/*" onChange={(e) => handleAdd(e.target.files?.[0])} className="hidden" />
        </label>
      </div>
    </div>
  );
}

// ─── Edit / Create form ───────────────────────────────────────────────────────
function StoryForm({ initial, onSave, onCancel, featuredItems = [] }) {
  const blank = {
    eyebrow: "", category: "", date: "",
    cardHeading: "", cardBody: "", cardImage: "",
    title: "", heroImage: "", standfirst: "", location: "", website: "",
    body: [], gallery: [], homepage: false,
  };
  const [form, setForm] = useState(initial ?? blank);
  const [saving, setSaving] = useState(false);
  const [swapOutId, setSwapOutId] = useState(null);
  const [showSwapPicker, setShowSwapPicker] = useState(false);

  const swapCandidates = featuredItems.filter((f) => f.id !== initial?.id);
  const swapOutItem = swapCandidates.find((f) => f.id === swapOutId);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleToggleFeatureClick() {
    if (form.homepage) {
      set("homepage", false);
      setSwapOutId(null);
      return;
    }
    if (swapCandidates.length < 2) {
      set("homepage", true);
      return;
    }
    setShowSwapPicker(true);
  }

  function handleSwapPick(id) {
    set("homepage", true);
    setSwapOutId(id);
    setShowSwapPicker(false);
  }

  function handleSave() {
    if (!form.title.trim() || !form.cardHeading.trim()) return;
    setSaving(true);
    saveFeatureArticle(form).then(async (saved) => {
      if (swapOutId) await setArticleHomepageFeature(swapOutId, false);
      setSaving(false);
      onSave(saved, swapOutId);
    });
  }

  const titleSplit = form.title.split(/:\s+/);
  const heroTitle = titleSplit[0];
  const heroSubtitle = titleSplit.length > 1 ? titleSplit.slice(1).join(": ") : null;

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: "1.5px solid rgba(16,24,40,0.12)" }}>
      <h3 className="font-bold text-base" style={{ color: "#1E293B" }}>
        {initial?.id ? "Edit Featured Story" : "Add Featured Story"}
      </h3>

      {/* ── Homepage card ── */}
      <div className="flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>Homepage card</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Eyebrow (small label)</span>
            <input value={form.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} placeholder="e.g. Eat & Drink" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Category</span>
            <input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Fine Dining" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Date / tag text</span>
            <input value={form.date} onChange={(e) => set("date", e.target.value)} placeholder="e.g. Now open · One Maidenhead" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }} />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Card heading *</span>
          <input value={form.cardHeading} onChange={(e) => set("cardHeading", e.target.value)} className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Card summary</span>
          <textarea value={form.cardBody} onChange={(e) => set("cardBody", e.target.value)} rows={2} className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }} />
        </label>
        <ImageField label="Card image" value={form.cardImage} onChange={(v) => set("cardImage", v)} />
      </div>

      {/* ── Detail page ── */}
      <div className="flex flex-col gap-4 pt-4 border-t" style={{ borderColor: "rgba(16,24,40,0.1)" }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>Detail page (/story/…)</p>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Title * — written as "Name: subtitle" (subtitle is optional)</span>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Jetts Maidenhead: A New Era of 24/7 Fitness" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }} />
          <span className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
            Hero title: <strong>{heroTitle || "—"}</strong>{heroSubtitle ? <> · Subtitle: <strong>{heroSubtitle}</strong></> : ""}
          </span>
        </label>
        <ImageField label="Hero image" value={form.heroImage} onChange={(v) => set("heroImage", v)} />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Standfirst (intro paragraph under the hero)</span>
          <textarea value={form.standfirst} onChange={(e) => set("standfirst", e.target.value)} rows={3} className="rounded-xl px-3 py-2.5 text-sm outline-none resize-y" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }} />
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Location</span>
            <input value={form.location} onChange={(e) => set("location", e.target.value)} className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Website (no https://)</span>
            <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="example.co.uk" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }} />
          </label>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col gap-4 pt-4 border-t" style={{ borderColor: "rgba(16,24,40,0.1)" }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>Article body</p>
        <BodyBlockEditor blocks={form.body ?? []} onChange={(v) => set("body", v)} />
      </div>

      {/* ── Gallery ── */}
      <div className="pt-4 border-t" style={{ borderColor: "rgba(16,24,40,0.1)" }}>
        <GalleryEditor images={form.gallery ?? []} onChange={(v) => set("gallery", v)} />
      </div>

      {/* ── Homepage feature ── */}
      <div className="pt-4 border-t flex flex-col gap-1" style={{ borderColor: "rgba(16,24,40,0.1)" }}>
        <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Homepage Featured Stories</span>
        <label className="flex items-start gap-3 mt-1 cursor-pointer">
          <div className="relative mt-0.5 shrink-0" onClick={handleToggleFeatureClick}>
            <div className="w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: form.homepage ? "#E8A33D" : "#D1D5DB" }} />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: form.homepage ? "translateX(20px)" : "none" }} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium" style={{ color: "#1E293B" }}>Show in "FEATURED STORIES" on the homepage</span>
            {!form.homepage && (
              <span className="text-xs" style={{ color: "#9CA3AF" }}>{swapCandidates.length}/2 slots used</span>
            )}
            {form.homepage && swapOutItem && (
              <span className="text-xs" style={{ color: "#92400E" }}>Will swap out "{swapOutItem.cardHeading || swapOutItem.title}" when saved</span>
            )}
            {form.homepage && !swapOutItem && (
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Appears on the public homepage</span>
            )}
          </div>
        </label>
      </div>

      {showSwapPicker && (
        <SwapPickerModal
          candidates={swapCandidates}
          onPick={handleSwapPick}
          onCancel={() => setShowSwapPicker(false)}
          title="Homepage is full (2/2)"
          description="Featured Stories shows a maximum of two. Pick one of the two live stories below to swap it out with."
        />
      )}

      <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "rgba(16,24,40,0.1)" }}>
        <button
          onClick={handleSave}
          disabled={saving || !form.title.trim() || !form.cardHeading.trim()}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#2563EB" }}
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
function StoryRow({ item, onEdit, onDelete, onToggleFeature, onOpenSwap }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-start gap-4" style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: item.homepage ? "1.5px solid rgba(220,38,38,0.35)" : "1px solid rgba(16,24,40,0.08)" }}>
      {item.cardImage && <img src={item.cardImage} alt="" className="w-20 h-16 rounded-xl object-cover shrink-0 hidden sm:block" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-bold truncate" style={{ color: "#1E293B" }}>{item.cardHeading || item.title}</span>
          <HomeBadge active={item.homepage} />
        </div>
        <p className="text-xs font-semibold mb-1" style={{ color: "#1E293B" }}>{item.eyebrow} · {item.category}</p>
        <p className="text-xs line-clamp-2" style={{ color: "#6B7280" }}>{item.cardBody}</p>
        <p className="text-[11px] mt-1 font-mono" style={{ color: "#9CA3AF" }}>/story/{item.slug}</p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        {item.homepage ? (
          <div className="flex gap-2">
            <button onClick={() => onToggleFeature(item)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "#B91C1C", border: "1.5px solid rgba(220,38,38,0.3)" }}>
              Make Offline
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
        <div className="flex gap-2">
          <button onClick={() => onEdit(item)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }}>Edit</button>
          <button onClick={() => onDelete(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FeaturedStoriesPage() {
  const { data: items, loading } = useFetch(getFeatureArticles, []);
  const [localItems, setLocalItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [swapPicker, setSwapPicker] = useState(null);

  const list = localItems ?? items ?? [];
  const featured = list.filter((n) => n.homepage);

  function showToast(msg, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 4000);
  }

  function handleSave(saved, swappedOutId) {
    setLocalItems((prev) => {
      let base = prev ?? items ?? [];
      const idx = base.findIndex((n) => n.id === saved.id);
      base = idx >= 0 ? base.map((n) => n.id === saved.id ? saved : n) : [...base, saved];
      if (swappedOutId) base = base.map((n) => n.id === swappedOutId ? { ...n, homepage: false } : n);
      return base;
    });
    setEditing(null);
    showToast(swappedOutId ? "Saved and swapped onto the homepage." : (editing?.id ? "Changes saved." : "Featured story created."));
  }

  function handleDelete(id) {
    if (!confirm("Remove this featured story? This also removes its detail page.")) return;
    deleteFeatureArticle(id).then(() => {
      setLocalItems((prev) => (prev ?? items ?? []).filter((n) => n.id !== id));
      showToast("Deleted.");
    });
  }

  function handleToggleFeature(item) {
    setArticleHomepageFeature(item.id, !item.homepage).then((res) => {
      if (res?.full) {
        setSwapPicker({ item, candidates: list.filter((n) => n.homepage) });
        return;
      }
      setLocalItems((prev) => (prev ?? items ?? []).map((n) => n.id === item.id ? { ...n, homepage: res.homepage } : n));
      showToast(res.homepage ? `"${item.cardHeading}" added to Featured Stories.` : `"${item.cardHeading}" removed from Featured Stories.`);
    });
  }

  function handleOpenSwap(item) {
    const candidates = list.filter((n) => !n.homepage && n.id !== item.id);
    if (candidates.length === 0) {
      showToast("No other stories available to swap in.", true);
      return;
    }
    setSwapPicker({ item, candidates, replacing: true });
  }

  function handleSwapConfirm(pickedId) {
    if (!swapPicker) return;
    const { item, replacing } = swapPicker;
    const addId = replacing ? pickedId : item.id;
    const removeId = replacing ? item.id : pickedId;
    swapArticleHomepageFeature(addId, removeId).then(() => {
      setLocalItems((prev) => (prev ?? items ?? []).map((n) => {
        if (n.id === addId) return { ...n, homepage: true };
        if (n.id === removeId) return { ...n, homepage: false };
        return n;
      }));
      showToast("Homepage story swapped.");
      setSwapPicker(null);
    });
  }

  if (loading) return <LoadingState />;

  if (editing !== null) {
    return (
      <div className="max-w-3xl flex flex-col gap-4">
        <button onClick={() => setEditing(null)} className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: "#1E293B" }}>← Back to list</button>
        <StoryForm
          initial={editing?.id ? editing : null}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          featuredItems={featured}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Toast message={toast?.msg} error={toast?.error} onDismiss={() => setToast(null)} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Featured Stories</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manage the long-form "FEATURED STORIES" section and its /story/ detail pages on the homepage. Max 2 live at once.</p>
        </div>
        <button onClick={() => setEditing({})} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2563EB" }}>
          + Add Story
        </button>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #16252E 0%, #245C63 60%, #2F8C8C 100%)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(216,243,220,0.7)" }}>Homepage</p>
            <h2 className="text-lg font-bold text-white">Featured Stories</h2>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{featured.length}/2 slots used.</p>
          </div>
          <div className="flex items-center gap-1">
            {[0, 1].map((i) => (
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
                {f.cardImage && <img src={f.cardImage} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-white">{f.cardHeading}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{f.eyebrow}</p>
                </div>
                <button onClick={() => setEditing(f)} className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-opacity hover:opacity-70" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.35)" }}>Edit</button>
                <button onClick={() => handleToggleFeature(f)} className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-opacity hover:opacity-70" style={{ color: "#E8A33D", border: "1px solid rgba(232,163,61,0.5)" }}>Remove</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-center py-2" style={{ color: "rgba(255,255,255,0.35)" }}>No stories featured — toggle "Add to Homepage" on any story below.</p>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState title="No featured stories yet" message='Click "Add Story" to create the first one.' icon="📰" />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((item) => (
            <StoryRow
              key={item.id}
              item={item}
              onEdit={setEditing}
              onDelete={handleDelete}
              onToggleFeature={handleToggleFeature}
              onOpenSwap={handleOpenSwap}
            />
          ))}
        </div>
      )}

      {swapPicker && (
        <SwapPickerModal
          candidates={swapPicker.candidates}
          onPick={handleSwapConfirm}
          onCancel={() => setSwapPicker(null)}
          title={swapPicker.replacing ? `Swap out "${swapPicker.item.cardHeading}"` : "Homepage is full (2/2)"}
          description={swapPicker.replacing
            ? "Pick a story below to put live in its place."
            : "Featured Stories shows a maximum of two. Pick one of the two live stories below to swap it out with."}
        />
      )}
    </div>
  );
}
