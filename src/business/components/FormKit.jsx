import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { canEditField } from "../../Data/plans";
import { supabase } from "../../lib/supabaseClient";
import { compressImage } from "../../lib/compressImage";
import { focalPosition, stripFocal } from "../../lib/focalPoint";
import FocalPointPicker from "./FocalPointPicker";

export async function uploadToStorage(file, pathPrefix) {
  // A filename straight off a phone ("Photo 12 Apr, 09.14.png") makes a
  // storage key with spaces and commas in it, and the public URL for that key
  // did not resolve — which is why an attached screenshot arrived in admin as
  // a broken image. Everything outside [a-z0-9._-] is folded to a dash.
  // Resized and re-encoded first: pictures came off phones at 2-3 MB and were
  // then served at full resolution into cards a few hundred pixels wide.
  const upload = await compressImage(file);
  const safeName = upload.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "upload";
  const path = `${pathPrefix}/${Date.now()}-${safeName}`;
  // Without this, Storage falls back to one hour, so every visitor
  // re-downloaded every listing picture hourly. The path carries a timestamp,
  // so a file is never replaced in place and can be cached for a year.
  const { error } = await supabase.storage.from("business-media").upload(path, upload, {
    cacheControl: "31536000",
  });
  if (error) throw error;
  return supabase.storage.from("business-media").getPublicUrl(path).data.publicUrl;
}

// ─── Theme — the same "Modern Blue" design system as the admin panel
// (Inter throughout, flat white cards on a light blue-grey canvas), applied
// here so the business dashboard and admin panel read as one consistent
// back-office product. Names kept as FOREST/SAGE/LEAF for backward
// compatibility with every existing `style={{ color: FOREST }}` call site —
// only the values changed. ───────────────────────────────────────────────────
export const FOREST = "#1E293B"; // admin body/heading navy — headings, body text
export const LEAF    = "#3B82F6"; // admin secondary blue accent
export const SAGE     = "#2563EB"; // admin primary blue — buttons, active states, links
export const MUTED    = "#64748B";
export const BORDER   = "rgba(16,24,40,0.1)";
export const CARD     = { backgroundColor: "#fff", border: "1px solid #eef1f6", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };
export const INPUT     = { border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" };

export function Field({ label, required, span2, children, hint }) {
  return (
    <label className={`flex flex-col gap-1.5${span2 ? " sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold" style={{ color: MUTED }}>
        {label}{required && <span style={{ color: "#DC2626" }}> *</span>}
      </span>
      {children}
      {hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{hint}</span>}
    </label>
  );
}

export function Inp({ style, ...props }) {
  return <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ ...INPUT, ...style }} {...props} />;
}
export function TextArea({ rows = 4, style, ...props }) {
  return <textarea rows={rows} className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ ...INPUT, ...style }} {...props} />;
}
export function Select({ children, style, ...props }) {
  return <select className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ ...INPUT, ...style }} {...props}>{children}</select>;
}

// ─── Multi-select checkbox chips, optionally capped at `max` selections ──────
export function CheckGroup({ options, selected, onChange, max }) {
  const atMax = max != null && selected.length >= max;
  function toggle(v) {
    if (selected.includes(v)) { onChange(selected.filter((x) => x !== v)); return; }
    if (atMax) return;
    onChange([...selected, v]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const checked = selected.includes(o.value);
        const disabled = !checked && atMax;
        return (
          <label key={o.value} className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
            style={{
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.4 : 1,
              ...(checked ? { border: `1.5px solid ${SAGE}`, backgroundColor: "rgba(37,99,235,0.07)" } : { border: `1.5px solid ${BORDER}`, backgroundColor: "#fff" }),
            }}>
            <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(o.value)} className="w-3.5 h-3.5" />
            <span className="text-xs font-medium" style={{ color: FOREST }}>{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, sublabel }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer w-fit">
      <div onClick={() => onChange(!checked)}
        className="w-10 h-5 rounded-full transition-colors flex items-center px-0.5 mt-0.5 shrink-0"
        style={{ backgroundColor: checked ? SAGE : "#D1D5DB" }}>
        <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </div>
      {label && (
        <div>
          <span className="text-sm font-medium block" style={{ color: FOREST }}>{label}</span>
          {sublabel && <span className="text-xs block mt-0.5" style={{ color: MUTED }}>{sublabel}</span>}
        </div>
      )}
    </label>
  );
}

export function EditorSection({ title, hint, children, action }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1 pb-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <p className="text-sm font-bold" style={{ color: FOREST }}>{title}</p>
        {action}
      </div>
      {hint && <p className="text-[11px] mt-2" style={{ color: "#9CA3AF" }}>{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

// ─── Approval status badge (per My Listing tab) ───────────────────────────────
export function ApprovalBadge({ status, rejectionReason }) {
  const map = {
    "Up to Date":       { bg: "rgba(37,99,235,0.16)", fg: "#2563EB" },
    "Pending Approval": { bg: "rgba(217,119,6,0.14)", fg: "#92400E" },
    "Changes Rejected": { bg: "rgba(220,38,38,0.1)",   fg: "#991B1B" },
  };
  const c = map[status] ?? map["Up to Date"];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: c.bg, color: c.fg }}
      title={status === "Changes Rejected" ? rejectionReason ?? "Contact support for details." : undefined}>
      {status}
    </span>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────
export function useToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg, setMsg];
}
export function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
      style={{ backgroundColor: FOREST, boxShadow: "0 8px 24px -6px rgba(0,0,0,0.35)" }}>
      <span>✓</span> {message}
    </div>
  );
}

// Why admin turned an edit down. This used to live only in the badge's hover
// tooltip, so on the business's side a rejection arrived with no explanation
// at all — and on a touch screen there was no way to read it.
export function RejectionNotice({ reason, what = "These changes" }) {
  if (!reason) return null;
  return (
    <div className="w-full rounded-xl px-4 py-3 flex gap-2.5 items-start"
      style={{ backgroundColor: "rgba(220,38,38,0.07)", border: "1.5px solid rgba(220,38,38,0.25)" }}>
      <span aria-hidden="true" style={{ color: "#991B1B" }}>⚠</span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-bold" style={{ color: "#991B1B" }}>{what} were not approved</span>
        <span className="text-sm" style={{ color: "#7F1D1D" }}>{reason}</span>
        <span className="text-[11px]" style={{ color: "#991B1B", opacity: 0.8 }}>
          Make the changes asked for and save again to send it back for review.
        </span>
      </div>
    </div>
  );
}

export function SaveBar({ onSave, saving, status, rejectionReason }) {
  return (
    <div className="flex items-center gap-3 pt-4 mt-2 flex-wrap" style={{ borderTop: `1px solid ${BORDER}` }}>
      <button onClick={onSave} disabled={saving}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
        style={{ backgroundColor: SAGE }}>
        {saving ? "Submitting…" : "Save Changes"}
      </button>
      {status && <ApprovalBadge status={status} rejectionReason={rejectionReason} />}
      {status === "Changes Rejected" && <RejectionNotice reason={rejectionReason} />}
    </div>
  );
}

// ─── Image upload (hero/logo, single) ─────────────────────────────────────────
// Reads an image file's pixel dimensions without uploading it.
function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image.")); };
    img.src = url;
  });
}

// Checks a file's aspect ratio against an expected ratio (width/height),
// within a small tolerance to allow for rounding. Returns an error message
// string if it doesn't match, or null if it's fine / no ratio was required.
// Advice, not a gate.
//
// This used to refuse any picture more than 5% off the suggested ratio. It
// was refusing good photographs to prevent cropping that happened anyway:
// the same file is shown at 2.29:1 across the top of a page, 1.33:1 in a
// card and 1.67:1 in the app, so no single ratio satisfies them all. A
// business with a perfectly good 16:9 photo simply could not upload it.
//
// The suggested ratio still earns its place — a picture near it is cropped
// least — so the note stays. What decides where the crop falls is the focal
// point, which is set after the upload, on a picture that is actually there.
async function checkAspectRatio(file, ratio) {
  if (!ratio) return null;
  const { width, height } = await readImageDimensions(file);
  const actual = width / height;
  if (Math.abs(actual - ratio) / ratio > 0.05) {
    return `This picture is ${width}×${height} (${actual.toFixed(2)}:1), not the suggested ${ratio === 1 ? "1:1" : ratio.toFixed(2) + ":1"}. It will still be used — set what stays in shot below so the right part is kept.`;
  }
  return null;
}

export function SingleImageUpload({ src, onChange, label, round = false, aspect = "aspect-video", pathPrefix, ratio, ratioLabel }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  async function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setNotice(await checkAspectRatio(file, ratio).catch(() => null));
    setUploading(true);
    try {
      const url = await uploadToStorage(file, pathPrefix ?? "misc");
      onChange(url);
    } finally {
      setUploading(false);
    }
  }
  return (
    <div>
      {label && <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>{label}</p>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`relative overflow-hidden ${round ? "w-24 h-24 rounded-full" : `w-full max-w-md ${aspect} rounded-2xl`}`}
        style={{ border: dragOver ? `2px dashed ${SAGE}` : `1.5px solid ${BORDER}`, backgroundColor: "#f8fafc" }}>
        {src ? (
          <>
            <img src={stripFocal(src)} alt={label || "preview"} className="w-full h-full object-cover"
              style={{ objectPosition: focalPosition(src) }} />
            {/* Clearing a picture used to be impossible — the only way out of
                an unwanted logo or header was to upload a different one. */}
            <button
              type="button"
              onClick={() => { setError(""); onChange(""); }}
              aria-label={`Remove ${label || "image"}`}
              title="Remove image"
              className="absolute top-1.5 right-1.5 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
              style={{ width: 24, height: 24, backgroundColor: "rgba(16,24,40,0.65)", color: "#fff", lineHeight: 1 }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <span className="text-2xl" style={{ color: "#9CA3AF" }}>+</span>
            <span className="text-[10px] text-center px-2" style={{ color: "#9CA3AF" }}>Drop image or click Upload</span>
          </div>
        )}
      </div>
      <label className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
        style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#2563EB", border: `1.5px solid rgba(37,99,235,0.3)` }}>
        {uploading ? "Uploading…" : src ? "Replace Image" : "Upload Image"}
        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleFiles(e.target.files)} />
      </label>
      {ratioLabel && <p className="text-[10px] mt-1.5" style={{ color: "#9CA3AF" }}>Best aspect ratio: {ratioLabel}</p>}
      {error && <p className="text-[11px] mt-1 font-medium" style={{ color: "#DC2626" }}>{error}</p>}
      {notice && <p className="text-[11px] mt-1 font-medium" style={{ color: "#B45309" }}>{notice}</p>}
      {/* Whatever ratio the picture arrives at, it still gets cropped to
          several different shapes. This is where the owner says which part
          of it must survive that. */}
      <FocalPointPicker value={src} onChange={onChange} />
    </div>
  );
}

// ─── Gallery grid (up to N slots) ─────────────────────────────────────────────
export function GalleryGrid({ images, onChange, max = 6, label, pathPrefix, ratio, ratioLabel }) {
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  // Which picture is having its focal point set. One picker under the grid
  // rather than six crowded into the thumbnails.
  const [focusIndex, setFocusIndex] = useState(null);
  const slots = Array.from({ length: max }, (_, i) => images[i] ?? null);
  async function handleFile(i, files) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setNotice(await checkAspectRatio(file, ratio).catch(() => null));
    setUploadingIndex(i);
    try {
      const url = await uploadToStorage(file, pathPrefix ?? "misc");
      const next = [...images];
      next[i] = url;
      onChange(next.filter(Boolean));
    } finally {
      setUploadingIndex(null);
    }
  }
  function remove(i) {
    const next = [...images];
    next.splice(i, 1);
    onChange(next);
  }
  return (
    <div>
      {label && <p className="text-xs mb-3" style={{ color: MUTED }}>{label}</p>}
      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {slots.map((src, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group"
            style={{ border: `1.5px ${src ? "solid" : "dashed"} ${BORDER}`, backgroundColor: "#f8fafc" }}>
            {src ? (
              <>
                <img src={stripFocal(src)} alt={`gallery ${i + 1}`} className="w-full h-full object-cover"
                  style={{ objectPosition: focalPosition(src) }} />
                <button onClick={() => remove(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: "#DC2626" }}>✕</button>
                <button onClick={() => setFocusIndex(focusIndex === i ? null : i)}
                  title="Choose what stays in shot"
                  className="absolute bottom-1 right-1 px-1.5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: focusIndex === i ? "#2563EB" : "rgba(16,24,40,0.65)" }}>crop</button>
              </>
            ) : (
              <label className="w-full h-full flex items-center justify-center cursor-pointer">
                <span className="text-xl" style={{ color: "#9CA3AF" }}>{uploadingIndex === i ? "…" : "+"}</span>
                <input type="file" accept="image/*" className="hidden" disabled={uploadingIndex === i} onChange={(e) => handleFile(i, e.target.files)} />
              </label>
            )}
          </div>
        ))}
      </div>
      {ratioLabel && <p className="text-[10px] mt-1.5" style={{ color: "#9CA3AF" }}>Best aspect ratio: {ratioLabel}</p>}
      {error && <p className="text-[11px] mt-1 font-medium" style={{ color: "#DC2626" }}>{error}</p>}
      {notice && <p className="text-[11px] mt-1 font-medium" style={{ color: "#B45309" }}>{notice}</p>}
      {focusIndex !== null && images[focusIndex] && (
        <FocalPointPicker
          value={images[focusIndex]}
          onChange={(v) => onChange(images.map((img, idx) => (idx === focusIndex ? v : img)))}
        />
      )}
    </div>
  );
}

// ─── Opening hours 7-row editor ────────────────────────────────────────────────
export function HoursEditor({ hours, onChange }) {
  function setDay(i, key, val) { onChange(hours.map((h, idx) => (idx === i ? { ...h, [key]: val } : h))); }
  return (
    <div className="flex flex-col gap-2">
      {hours.map((h, i) => (
        <div key={h.day} className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium w-24 shrink-0" style={{ color: FOREST }}>{h.day}</span>
          <Toggle checked={h.open} onChange={(v) => setDay(i, "open", v)} />
          {h.open ? (
            <>
              <input type="time" value={h.from} onChange={(e) => setDay(i, "from", e.target.value)}
                className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }} />
              <span className="text-xs" style={{ color: MUTED }}>to</span>
              <input type="time" value={h.to} onChange={(e) => setDay(i, "to", e.target.value)}
                className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }} />
            </>
          ) : (
            <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Closed</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Social links ──────────────────────────────────────────────────────────────
export function SocialFields({ links, onChange }) {
  function set(k, v) { onChange({ ...links, [k]: v }); }
  const fields = [
    { key: "instagram", label: "Instagram URL" },
    { key: "facebook",  label: "Facebook URL" },
    { key: "twitter",   label: "Twitter / X URL" },
    { key: "tiktok",    label: "TikTok URL" },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {fields.map(({ key, label }) => (
        <Field key={key} label={label}>
          <Inp value={links?.[key] ?? ""} onChange={(e) => set(key, e.target.value)} placeholder="https://…" />
        </Field>
      ))}
    </div>
  );
}

// ─── Lat/Lng + static OpenStreetMap preview ───────────────────────────────────
export function LocationFields({ lat, lng, onChange }) {
  const hasCoords = lat !== "" && lng !== "" && lat != null && lng != null && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180;
  // OpenStreetMap's own embed: a live map with a pin, no API key needed.
  // (The static-image service used before has been switched off.)
  const mapSrc = hasCoords
    ? (() => {
        const la = Number(lat), lo = Number(lng), d = 0.004;
        return `https://www.openstreetmap.org/export/embed.html?bbox=${lo - d}%2C${la - d * 0.6}%2C${lo + d}%2C${la + d * 0.6}&layer=mapnik&marker=${la}%2C${lo}`;
      })()
    : null;
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4 mb-3">
        <Field label="Latitude"><Inp type="number" step="0.000001" value={lat ?? ""} onChange={(e) => onChange({ lat: e.target.value, lng })} placeholder="e.g. 51.5225" /></Field>
        <Field label="Longitude"><Inp type="number" step="0.000001" value={lng ?? ""} onChange={(e) => onChange({ lat, lng: e.target.value })} placeholder="e.g. -0.7234" /></Field>
      </div>
      <p className="text-[11px] mb-3" style={{ color: "#9CA3AF" }}>Right-click your location in Google Maps to copy coordinates.</p>
      <div className="rounded-xl overflow-hidden max-w-md" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "#f8fafc", minHeight: 120 }}>
        {mapSrc ? <iframe src={mapSrc} title="Map preview" loading="lazy" className="w-full block" style={{ height: 200, border: 0 }} /> : (
          <div className="h-[120px] flex items-center justify-center text-xs" style={{ color: "#9CA3AF" }}>Enter coordinates to preview the map pin</div>
        )}
      </div>
    </div>
  );
}

// ─── Repeatable list (FAQs handled separately; this is for plain text lists) ──
export function RepeatableList({ items, onChange, placeholder = "" }) {
  function set(i, v) { onChange(items.map((it, idx) => (idx === i ? v : it))); }
  function add() { onChange([...items, ""]); }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5 shrink-0">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-[10px] leading-none disabled:opacity-20" style={{ color: MUTED }}>▲</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-[10px] leading-none disabled:opacity-20" style={{ color: MUTED }}>▼</button>
          </div>
          <input value={it} onChange={(e) => set(i, e.target.value)} placeholder={placeholder}
            className="flex-1 rounded-lg px-3 py-2 text-xs outline-none" style={INPUT} />
          <button onClick={() => remove(i)} className="text-xs font-bold shrink-0 w-6 h-6 rounded-lg" style={{ color: "#DC2626" }}>✕</button>
        </div>
      ))}
      <button onClick={add} type="button" className="self-start text-xs font-semibold mt-1 transition-opacity hover:opacity-70" style={{ color: "#2563EB" }}>+ Add</button>
    </div>
  );
}

// ─── FAQ repeatable list (question/answer pairs) ──────────────────────────────
export function FaqListEditor({ items, onChange }) {
  function set(i, k, v) { onChange(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it))); }
  function add() { onChange([...items, { id: `faq${Date.now()}`, question: "", answer: "" }]); }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div key={it.id ?? i} className="rounded-xl p-4 flex flex-col gap-2" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "#f8fafc" }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>FAQ {i + 1}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-xs disabled:opacity-20" style={{ color: MUTED }}>▲</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-xs disabled:opacity-20" style={{ color: MUTED }}>▼</button>
              <button onClick={() => remove(i)} className="text-xs font-bold" style={{ color: "#DC2626" }}>Remove</button>
            </div>
          </div>
          <Inp value={it.question} onChange={(e) => set(i, "question", e.target.value)} placeholder="Question" />
          <TextArea rows={2} value={it.answer} onChange={(e) => set(i, "answer", e.target.value)} placeholder="Answer" />
        </div>
      ))}
      <button onClick={add} type="button" className="self-start text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "#2563EB" }}>+ Add FAQ</button>
    </div>
  );
}

// ─── Stats / highlights (e.g. "10+ / Years in Business") ──────────────────────
export function StatsEditor({ items, onChange }) {
  function set(i, k, v) { onChange(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it))); }
  function add() { onChange([...items, { id: `stat${Date.now()}`, value: "", label: "" }]); }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div key={it.id ?? i} className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5 shrink-0">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-[10px] leading-none disabled:opacity-20" style={{ color: MUTED }}>▲</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-[10px] leading-none disabled:opacity-20" style={{ color: MUTED }}>▼</button>
          </div>
          <input value={it.value} onChange={(e) => set(i, "value", e.target.value)} placeholder="e.g. 10+"
            className="w-24 rounded-lg px-3 py-2 text-xs outline-none shrink-0" style={INPUT} />
          <input value={it.label} onChange={(e) => set(i, "label", e.target.value)} placeholder="e.g. Years in Business"
            className="flex-1 rounded-lg px-3 py-2 text-xs outline-none" style={INPUT} />
          <button onClick={() => remove(i)} className="text-xs font-bold shrink-0 w-6 h-6 rounded-lg" style={{ color: "#DC2626" }}>✕</button>
        </div>
      ))}
      <button onClick={add} type="button" className="self-start text-xs font-semibold mt-1 transition-opacity hover:opacity-70" style={{ color: "#2563EB" }}>+ Add</button>
    </div>
  );
}

// ─── Portfolio (up to `max` items, each an image + title + optional link) ─────
export function PortfolioEditor({ items, onChange, pathPrefix, max = 6 }) {
  const [uploadingId, setUploadingId] = useState(null);

  function set(i, k, v) { onChange(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it))); }
  function add() { onChange([...items, { id: `pf${Date.now()}`, title: "", link: "", image: null }]); }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }

  async function handleImage(i, files) {
    const file = files?.[0];
    if (!file) return;
    setUploadingId(items[i].id ?? i);
    try {
      const url = await uploadToStorage(file, pathPrefix ?? "misc");
      set(i, "image", url);
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {items.map((it, i) => (
        <div key={it.id ?? i} className="rounded-xl p-3 flex flex-col gap-2" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "#f8fafc" }}>
          <div className="relative aspect-video rounded-lg overflow-hidden" style={{ border: `1.5px ${it.image ? "solid" : "dashed"} ${BORDER}`, backgroundColor: "#fff" }}>
            {it.image ? (
              <img src={it.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <label className="w-full h-full flex items-center justify-center cursor-pointer">
                <span className="text-xl" style={{ color: "#9CA3AF" }}>{uploadingId === (it.id ?? i) ? "…" : "+"}</span>
                <input type="file" accept="image/*" className="hidden" disabled={uploadingId === (it.id ?? i)} onChange={(e) => handleImage(i, e.target.files)} />
              </label>
            )}
          </div>
          <input value={it.title} onChange={(e) => set(i, "title", e.target.value)} placeholder="Title"
            className="rounded-lg px-3 py-2 text-xs outline-none" style={INPUT} />
          <input value={it.link} onChange={(e) => set(i, "link", e.target.value)} placeholder="Link (optional)"
            className="rounded-lg px-3 py-2 text-xs outline-none" style={INPUT} />
          <button onClick={() => remove(i)} type="button" className="self-start text-xs font-bold" style={{ color: "#DC2626" }}>Remove</button>
        </div>
      ))}
      {items.length < max && (
        <button onClick={add} type="button"
          className="rounded-xl flex items-center justify-center text-sm font-semibold aspect-video transition-opacity hover:opacity-70"
          style={{ border: `1.5px dashed ${BORDER}`, color: "#2563EB" }}>
          + Add Portfolio Item
        </button>
      )}
    </div>
  );
}

// ─── Confirmation modal ────────────────────────────────────────────────────────
export function ConfirmModal({ title, body, confirmLabel = "Confirm", danger = true, onConfirm, onCancel, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(16,24,40,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <p className="text-base font-bold" style={{ color: FOREST }}>{title}</p>
        {body && <p className="text-sm" style={{ color: MUTED }}>{body}</p>}
        {children}
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: danger ? "#DC2626" : SAGE }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Star rating (display only) ────────────────────────────────────────────────
export function Stars({ rating, size = 14 }) {
  return (
    <span style={{ fontSize: size, color: "#D97706", letterSpacing: 1 }}>
      {"★".repeat(rating)}<span style={{ color: "#E5E7EB" }}>{"★".repeat(5 - rating)}</span>
    </span>
  );
}


// ─── Plan locks ───────────────────────────────────────────────────────────────
// The signed-in business's plan and role, provided by the page. On the Free
// plan only the business name, address, phone, email and map pin can be
// edited; every other field is still shown, but disabled, and clicking it
// takes an Owner to the Subscribe flow. A Content Manager can't subscribe, so
// they're told to ask the owner instead.
export const PlanContext = createContext({ plan: "premium", role: "Owner" });

function SubscribeBadge({ canSubscribe }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: "rgba(217,119,6,0.14)", color: "#92400E" }}>
      🔒 {canSubscribe ? "Upgrade" : "Visibility Plan"}
    </span>
  );
}

export function Locked({ field, span2, message, children }) {
  const { plan, role } = useContext(PlanContext);
  const navigate = useNavigate();
  if (canEditField(plan, field)) return children;
  const canSubscribe = role !== "Content Manager";
  const hint = canSubscribe ? "Upgrade to the Visibility Plan to unlock this" : "Ask the business owner to upgrade to unlock this";
  // A field with its own explanation shows it under the field, always visible.
  if (message) {
    return (
      <div className={`flex flex-col gap-2${span2 ? " sm:col-span-2" : ""}`}>
        <div className="relative">
          <fieldset disabled className="opacity-45 select-none">{children}</fieldset>
          <button type="button" onClick={() => canSubscribe && navigate("/business/upgrade")}
            className={`absolute inset-0 w-full h-full rounded-xl flex items-start justify-end p-1 ${canSubscribe ? "cursor-pointer" : "cursor-not-allowed"}`}
            aria-label={message} title={message}>
            <SubscribeBadge canSubscribe={canSubscribe} />
          </button>
        </div>
        <p className="text-xs font-semibold max-w-xs" style={{ color: "#92400E" }}>
          {message}{" "}
          {canSubscribe && <button type="button" onClick={() => navigate("/business/upgrade")} className="underline">Upgrade</button>}
        </p>
      </div>
    );
  }
  return (
    <div className={`relative group${span2 ? " sm:col-span-2" : ""}`}>
      <fieldset disabled className="opacity-45 select-none">{children}</fieldset>
      {/* Covers the whole field so any click — not just the badge — leads to Subscribe. */}
      <button
        type="button"
        onClick={() => canSubscribe && navigate("/business/upgrade")}
        className={`absolute inset-0 w-full h-full rounded-xl flex items-start justify-end p-1 ${canSubscribe ? "cursor-pointer" : "cursor-not-allowed"}`}
        aria-label={hint}
        title={hint}
      >
        <SubscribeBadge canSubscribe={canSubscribe} />
      </button>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-7 z-10 hidden group-hover:block text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white whitespace-nowrap"
        style={{ backgroundColor: FOREST }}>
        {hint}
      </span>
    </div>
  );
}

// A whole feature that needs Premium (News & Offers, Events) — shown in place
// of the page for a Free business.
export function PremiumFeatureGate({ title, description }) {
  const { role } = useContext(PlanContext);
  const navigate = useNavigate();
  const canSubscribe = role !== "Content Manager";
  return (
    <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center gap-4 max-w-xl mx-auto mt-6" style={CARD}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: "rgba(217,119,6,0.12)" }}>🔒</div>
      <div>
        <h1 className="text-lg font-bold" style={{ color: FOREST }}>{title}</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>{description}</p>
      </div>
      {canSubscribe ? (
        <button onClick={() => navigate("/business/upgrade")}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
          See the Visibility Plan
        </button>
      ) : (
        <p className="text-xs font-semibold" style={{ color: "#92400E" }}>Ask your business owner to upgrade to the Visibility Plan.</p>
      )}
    </div>
  );
}

// Tab-level notice at the top of an editor on the Free plan.
export function FreePlanNotice() {
  const { role } = useContext(PlanContext);
  const navigate = useNavigate();
  const canSubscribe = role !== "Content Manager";
  return (
    <div className="rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap text-sm"
      style={{ backgroundColor: "rgba(217,119,6,0.08)", border: "1.5px solid rgba(217,119,6,0.3)", color: "#92400E" }}>
      <span className="font-bold">You're on the Free plan.</span>
      <span className="flex-1 min-w-[220px] text-xs">
        You can edit your business name, address, telephone, email and map pin. Your hero picture and everything marked 🔒 unlock with the Visibility Plan.
      </span>
      {canSubscribe && (
        <button onClick={() => navigate("/business/upgrade")}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: SAGE }}>
          Upgrade
        </button>
      )}
    </div>
  );
}
