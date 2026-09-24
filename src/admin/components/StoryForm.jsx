import { useState } from "react";
import { Card, Field, ImageField as SectionImageField, Inp, RepeatList, TextArea } from "../pages/explore/contentKit";
import { withSectionImages } from "../../lib/storyImages";
import { uploadImage } from "../../lib/uploadImage";
import { saveFeatureArticle, setArticleHomepageFeature } from "../../api/admin";
import { VENUE_TYPES, CUISINE_TYPES, SEE_DO_CATEGORIES, SHOP_CATEGORIES, SERVICES_CATEGORIES, HOTEL_KINDS } from "../../Data/taxonomy";

// The editor for a Featured Article — the longer editorial pieces, with a
// hero, a standfirst and sections that each carry their own picture.
//
// It came from the Featured Stories page, which is gone: choosing what sits
// on the homepage is Homepage Slots' job now, so only the writing was left.
// It opens from the Business Featured Articles queue.

// The eyebrow is the site section a story belongs to (the small label above
// the heading on the homepage card), and the category narrows it within that
// section — so both are picked from the site's own lists rather than typed,
// which is how stray values like "Fitness & Wellbeing " (trailing space) got in.
const labels = (list) => [...new Set(list.map((c) => c.label).filter((l) => l !== "Other"))];
const STORY_SECTIONS = {
  "Eat & Drink": labels([...VENUE_TYPES, ...CUISINE_TYPES]).concat(["Chocolate Café", "Coffee & Culture", "Fine Dining"]),
  "See & Do": labels(SEE_DO_CATEGORIES).concat(["Fitness & Wellbeing"]),
  "Shop & Local Services": labels(SHOP_CATEGORIES),
  "Services": labels(SERVICES_CATEGORIES),
  "Hotels & Accommodation": labels(HOTEL_KINDS),
};
const STORY_EYEBROWS = Object.keys(STORY_SECTIONS);

function StorySelect({ value, onChange, options, placeholder }) {
  const current = (value ?? "").trim();
  return (
    <select value={current} onChange={(e) => onChange(e.target.value)}
      className="rounded-xl px-3 py-2.5 text-sm outline-none"
      style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B", backgroundColor: "#fff" }}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
      {current && !options.includes(current) && <option value={current}>{current} (current)</option>}
    </select>
  );
}

// Real editor for public.feature_articles — the homepage "FEATURED STORIES"
// / "In Focus" section (src/components/FeatureBlocks.jsx) and its detail
// pages at /story/:slug (src/components/FeatureArticlePage.jsx). Field names
// mirror that component's expectations exactly (see src/api/stories.js).

// ─── Swap picker modal (when every homepage slot is taken) ───────────────────────────────────
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

// Lines typed into a textarea, kept as typed (blank lines too) while editing
// so Enter starts a new paragraph; tidied on save.
function Lines({ label, hint, value, onChange, rows = 4 }) {
  return (
    <Field label={label} hint={hint}>
      <TextArea rows={rows} value={(value ?? []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} />
    </Field>
  );
}

const cleanLines = (list) => (list ?? []).map((l) => l.trim()).filter(Boolean);

// Sections in the same shape as the Neighbourhood Guide editor's places: each
// has its own picture, shown beside it on the website (sides alternate) and
// above it in the app.
function SectionsEditor({ blocks, onChange }) {
  return (
    <Card
      title="Sections"
      hint="The article runs in this order. A section's picture sits beside it on the website — alternating right, then left — and above it in the app. The first section can be a short intro with no heading or picture."
    >
      <RepeatList
        items={blocks}
        onChange={onChange}
        blank={() => ({ heading: "", paras: [], bullets: [], parasAfter: [], image: "" })}
        addLabel="+ Add section"
        itemLabel="Section"
        renderItem={(b, update) => (
          <>
            <Field label="Heading" hint="Optional — leave blank for an intro section">
              <Inp value={b.heading ?? ""} onChange={(e) => update({ heading: e.target.value })} />
            </Field>
            <Lines label="Paragraphs" hint="One paragraph per line" value={b.paras} onChange={(v) => update({ paras: v })} rows={5} />
            <Lines label="Bullet points" hint="Optional — one per line" value={b.bullets} onChange={(v) => update({ bullets: v })} rows={3} />
            <Lines label="Paragraphs after the bullets" hint="Optional — one per line" value={b.parasAfter} onChange={(v) => update({ parasAfter: v })} rows={2} />
            <SectionImageField label="Picture for this section" hint="Optional — shown beside this section" value={b.image ?? ""} onChange={(v) => update({ image: v ?? "" })} folder="stories" />
          </>
        )}
      />
    </Card>
  );
}

export default function StoryForm({ initial, onSave, onCancel, featuredItems = [], businesses = [], capacity = 2 }) {
  const blank = {
    eyebrow: "", category: "", date: "",
    cardHeading: "", cardBody: "", cardImage: "",
    title: "", heroImage: "", standfirst: "", location: "", website: "",
    businessId: "",
    body: [], gallery: [], homepage: false,
  };
  // An older story's gallery pictures open on the sections they already sit
  // beside, so the editor shows exactly where each picture goes.
  const [form, setForm] = useState(() => (initial ? { ...initial, body: withSectionImages(initial) } : blank));
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
    // How many slots there are is set in Homepage Slots, not fixed at two.
    if (swapCandidates.length < capacity) {
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
    if (!form.title.trim() || !form.cardHeading.trim() || !(form.eyebrow ?? "").trim()) {
      alert("Eyebrow, card heading and title are required.");
      return;
    }
    setSaving(true);
    // Free the swapped-out slot first, so the save can take it.
    // Pictures now live on the sections; tidy the typed lines.
    const body = (form.body ?? []).map((b) => ({
      ...(b.heading?.trim() ? { heading: b.heading.trim() } : {}),
      paras: cleanLines(b.paras),
      ...(cleanLines(b.bullets).length ? { bullets: cleanLines(b.bullets) } : {}),
      ...(cleanLines(b.parasAfter).length ? { parasAfter: cleanLines(b.parasAfter) } : {}),
      ...(b.image ? { image: b.image } : {}),
    }));
    (async () => {
      if (swapOutId) await setArticleHomepageFeature(swapOutId, false);
      return saveFeatureArticle({ ...form, body, gallery: [] });
    })().then((saved) => {
      setSaving(false);
      onSave(saved, swapOutId);
    }).catch((e) => {
      setSaving(false);
      alert(e.message);
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
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Eyebrow * (small label above the heading)</span>
            <StorySelect value={form.eyebrow} placeholder="Select a section…" options={STORY_EYEBROWS}
              onChange={(v) => setForm((f) => ({ ...f, eyebrow: v, category: (STORY_SECTIONS[v] ?? []).includes((f.category ?? "").trim()) ? f.category : "" }))} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Category</span>
            <StorySelect value={form.category} onChange={(v) => set("category", v)}
              placeholder={form.eyebrow ? "Select a category…" : "Pick an eyebrow first"}
              options={STORY_SECTIONS[(form.eyebrow ?? "").trim()] ?? []} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Date / tag text</span>
            <input value={form.date} onChange={(e) => set("date", e.target.value)} placeholder="e.g. Now open · One Maidenhead" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B" }} />
          </label>
        </div>

        {/* Any story admin writes can belong to a registered business, the
            same as an admin-written event or News & Offer post can. */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Attach to a business (optional)</span>
          <select
            value={form.businessId ?? ""}
            onChange={(e) => set("businessId", e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B", backgroundColor: "#fff" }}
          >
            <option value="">Town story — no business</option>
            {(businesses ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <span className="text-[11px]" style={{ color: "#6B7280" }}>
            Attached, the story also shows on that business's profile and its views count towards their analytics.
          </span>
        </label>
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

      {/* ── Body: sections, each with its picture ── */}
      <div className="pt-4 border-t" style={{ borderColor: "rgba(16,24,40,0.1)" }}>
        <SectionsEditor blocks={form.body ?? []} onChange={(v) => set("body", v)} />
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
              <span className="text-xs" style={{ color: "#9CA3AF" }}>{swapCandidates.length}/{capacity} slots used</span>
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
          title={`Homepage is full (${capacity}/${capacity})`}
          description={`Featured Stories shows ${capacity} at a time. Pick the one below to swap out.`}
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
