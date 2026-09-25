import { useState, useEffect, createContext, useContext } from "react";
import { canEditField } from "../../../Data/plans";
import { uploadImage } from "../../../lib/uploadImage";
import { isValidCoords } from "../../../lib/geo";
import CoordsNotice from "../../components/CoordsNotice";

// ─── Theme ────────────────────────────────────────────────────────────────────
// Re-exported so the sub-editors in this folder can keep importing tokens from
// their own shared module rather than reaching up to src/admin/theme.js.
import { NAVY, BLUE, MUTED, BORDER, CARD, FIELD_STYLE } from "../../theme";
export { NAVY, BLUE, MUTED, BORDER, CARD };
export const INPUT = FIELD_STYLE;

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

export function Inp({ ...props }) {
  return <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT} {...props} />;
}

export function TextArea({ rows = 3, ...props }) {
  return <textarea rows={rows} className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={INPUT} {...props} />;
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer w-fit">
      <div onClick={() => onChange(!checked)}
        className="w-10 h-5 rounded-full transition-colors flex items-center px-0.5"
        style={{ backgroundColor: checked ? BLUE : "#D1D5DB" }}>
        <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </div>
      {label && <span className="text-sm" style={{ color: NAVY }}>{label}</span>}
    </label>
  );
}

// ─── Plan locks ───────────────────────────────────────────────────────────────
// The business's subscription plan, provided by BusinessContentPage. A Free
// business can only have its name, address, phone, email and map pin edited;
// every other field is shown but disabled with a Premium tag.
//
// Admin can always set the hero picture (a Free business's hero is the stock
// picture only admin uploads) and the logo (kept ready; it only shows on the
// site once the business is on the Visibility Plan).
export const PlanContext = createContext("premium");
const ADMIN_ALWAYS_EDITABLE = new Set(["heroImage", "logo"]);

export function Locked({ field, span2, children }) {
  const plan = useContext(PlanContext);
  if (canEditField(plan, field) || ADMIN_ALWAYS_EDITABLE.has(field)) return children;
  return (
    <div className={`relative${span2 ? " sm:col-span-2" : ""}`} title="Visibility Plan only">
      <fieldset disabled className="opacity-45 pointer-events-none select-none">{children}</fieldset>
      <span className="absolute -top-1 right-0 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
        style={{ backgroundColor: "rgba(217,119,6,0.14)", color: "#92400E" }}>
        🔒 Visibility Plan
      </span>
    </div>
  );
}

export function EditorSection({ title, hint, children }) {
  return (
    <div>
      <p className="text-sm font-bold mb-1 pb-2" style={{ color: NAVY, borderBottom: `1px solid ${BORDER}` }}>{title}</p>
      {hint && <p className="text-[11px] mb-4" style={{ color: "#9CA3AF" }}>{hint}</p>}
      <div className={hint ? "mt-4" : "mt-4"}>{children}</div>
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    Published: { bg: "rgba(16,163,74,0.1)", fg: "#15803D" },
    Draft:     { bg: "rgba(245,158,11,0.12)", fg: "#B45309" },
    Hidden:    { bg: "rgba(100,116,139,0.12)", fg: "#475569" },
  };
  const c = map[status] || map.Draft;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: c.bg, color: c.fg }}>
      {status}
    </span>
  );
}

export function StatusDot({ status }) {
  const color = status === "Published" ? "#15803D" : status === "Hidden" ? "#94A3B8" : "#B45309";
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} title={status} />;
}

export function SectionBadge({ section, label }) {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: "rgba(37,99,235,0.1)", color: BLUE }}>
      {label}
    </span>
  );
}

// ─── Save button + toast ──────────────────────────────────────────────────────
export function useToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg, setMsg];
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 animate-[fadeIn_0.2s_ease]"
      style={{ backgroundColor: "#15803D", boxShadow: "0 8px 24px -6px rgba(0,0,0,0.35)" }}>
      <span>✓</span> {message}
    </div>
  );
}

export function SaveBar({ onSave, saving }) {
  return (
    <div className="flex gap-3 pt-4 mt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
      <button onClick={onSave} disabled={saving}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
        style={{ backgroundColor: BLUE }}>
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

// ─── Single hero / logo image upload with replace + drag-drop ────────────────
// TODO: wire to Supabase storage bucket on backend integration
// Under the hero/logo uploads: what each picture does on each plan.
export function PlanImageNote() {
  const plan = useContext(PlanContext);
  return (
    <p className="text-[11px] mt-3" style={{ color: "#9CA3AF" }}>
      {canEditField(plan, "heroImage")
        ? "The business can change its own hero picture and logo on the Visibility Plan."
        : "Free plan: the hero picture is the stock picture you upload here, and the business can't change it. The logo is saved now but only shows once the business is on the Visibility Plan."}
    </p>
  );
}

// `logo` previews the picture the way the public site actually shows a
// logo: a rounded square, object-contain on white, so the whole mark is
// visible. It used to be `round` — a circle, object-cover — which was
// wrong twice over. Nothing on the site shows a logo in a circle (the
// business page and the app both use rounded-xl), and object-cover
// cropped the edges off any logo that was not square.
export function SingleImageUpload({ src, onChange, label, logo = false, aspect = "aspect-video" }) {
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    uploadImage(file, "listings").then(onChange).catch((e) => alert(e.message));
  }

  return (
    <div>
      {label && <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>{label}</p>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`relative overflow-hidden ${logo ? "w-24 h-24 rounded-xl" : `w-full max-w-md ${aspect} rounded-2xl`}`}
        style={{ border: dragOver ? `2px dashed ${BLUE}` : `1.5px solid ${BORDER}`, backgroundColor: logo && src ? "#fff" : "#f8fafc" }}
      >
        {src ? (
          <img src={src} alt={label || "preview"}
            className={logo ? "w-full h-full object-contain p-1.5" : "w-full h-full object-cover"} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <span className="text-2xl" style={{ color: "#9CA3AF" }}>+</span>
            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>Drop image or click Replace</span>
          </div>
        )}
      </div>
      <label className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
        style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
        {src ? "Replace Image" : "Upload Image"}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </label>
    </div>
  );
}

// ─── 6-slot gallery grid (3×2) ────────────────────────────────────────────────
// TODO: wire to Supabase storage bucket on backend integration
export function GalleryGrid({ images, onChange, max = 6, label }) {
  const slots = Array.from({ length: max }, (_, i) => images[i] ?? null);

  function handleFile(i, files) {
    const file = files?.[0];
    if (!file) return;
    uploadImage(file, "listings")
      .then((url) => {
        const next = [...images];
        next[i] = url;
        onChange(next.filter(Boolean));
      })
      .catch((e) => alert(e.message));
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
                <img src={src} alt={`gallery ${i + 1}`} className="w-full h-full object-cover" />
                <button onClick={() => remove(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: "#DC2626" }}>✕</button>
              </>
            ) : (
              <label className="w-full h-full flex items-center justify-center cursor-pointer">
                <span className="text-xl" style={{ color: "#9CA3AF" }}>+</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(i, e.target.files)} />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Opening hours (7-row) editor ─────────────────────────────────────────────
export function HoursEditor({ hours, onChange }) {
  function setDay(i, key, val) {
    onChange(hours.map((h, idx) => (idx === i ? { ...h, [key]: val } : h)));
  }
  return (
    <div className="flex flex-col gap-2">
      {hours.map((h, i) => (
        <div key={h.day} className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium w-24 shrink-0" style={{ color: NAVY }}>{h.day}</span>
          <Toggle checked={h.open} onChange={(v) => setDay(i, "open", v)} />
          {h.open ? (
            <>
              <input type="time" value={h.from} onChange={(e) => setDay(i, "from", e.target.value)}
                className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }} />
              <span className="text-xs" style={{ color: MUTED }}>to</span>
              <input type="time" value={h.to} onChange={(e) => setDay(i, "to", e.target.value)}
                className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }} />
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

// ─── Latitude / Longitude fields + static OpenStreetMap preview ──────────────
export function LocationFields({ lat, lng, onChange }) {
  const hasCoords = isValidCoords(lat, lng);
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
        <Field label="Latitude">
          <Inp type="number" step="0.000001" value={lat ?? ""} onChange={(e) => onChange({ lat: e.target.value, lng })} placeholder="e.g. 51.5225" />
        </Field>
        <Field label="Longitude">
          <Inp type="number" step="0.000001" value={lng ?? ""} onChange={(e) => onChange({ lat, lng: e.target.value })} placeholder="e.g. -0.7234" />
        </Field>
      </div>
      <CoordsNotice lat={lat} lng={lng} />
      <p className="text-[11px] mb-3" style={{ color: "#9CA3AF" }}>
        Enter the precise coordinates for this business. You can find these from Google Maps by right-clicking the location.
      </p>
      <div className="rounded-xl overflow-hidden max-w-md" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "#f8fafc", minHeight: 120 }}>
        {mapSrc ? (
          <iframe src={mapSrc} title="Map preview" loading="lazy" className="w-full block" style={{ height: 200, border: 0 }} />
        ) : (
          <div className="h-[120px] flex items-center justify-center text-xs" style={{ color: "#9CA3AF" }}>
            Enter coordinates to preview the map pin
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Repeatable text-list editor (services, why-choose-us, areas, features) ──
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
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
              className="text-[10px] leading-none disabled:opacity-20" style={{ color: MUTED }}>▲</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
              className="text-[10px] leading-none disabled:opacity-20" style={{ color: MUTED }}>▼</button>
          </div>
          <input value={it} onChange={(e) => set(i, e.target.value)} placeholder={placeholder}
            className="flex-1 rounded-lg px-3 py-2 text-xs outline-none" style={INPUT} />
          <button onClick={() => remove(i)} className="text-xs font-bold shrink-0 w-6 h-6 rounded-lg" style={{ color: "#DC2626" }}>✕</button>
        </div>
      ))}
      <button onClick={add} type="button" className="self-start text-xs font-semibold mt-1 transition-opacity hover:opacity-70" style={{ color: BLUE }}>+ Add</button>
    </div>
  );
}

// ─── New-business onboarding: banner + progress steps ────────────────────────
export function NewBusinessBanner({ name }) {
  return (
    <div className="rounded-xl px-4 py-3 mb-6 text-sm font-medium"
      style={{ backgroundColor: "rgba(37,99,235,0.06)", border: `1.5px solid rgba(37,99,235,0.2)`, color: NAVY }}>
      You're adding content for the first time for <strong>{name}</strong>. Fill in the fields below and click Save when ready.
    </div>
  );
}

function hasCoords(lat, lng) {
  return isValidCoords(lat, lng);
}

// Derives the 5-step onboarding checklist from the current form values.
// Purely a display heuristic for a freshly-registered business — nothing
// here is persisted; actual completeness will come from the backend once
// content is saved to Supabase.
export function computeProgressSteps(biz) {
  const steps = [{ label: "Basic Info", hint: "Name, Section, Contact", done: true }];

  if (biz.section === "services") {
    steps.push({ label: "Hero & Images", hint: "Logo & photo strip", done: !!biz.logo || (biz.photos?.length ?? 0) > 0 });
    steps.push({ label: "Opening Hours", hint: null, done: Array.isArray(biz.hours) && biz.hours.length > 0 });
    steps.push({ label: "Location Pin", hint: null, done: hasCoords(biz.lat, biz.lng) });
    steps.push({ label: "News & Offers", hint: null, done: (biz.offers?.length ?? 0) > 0 });
  } else if (biz.section === "live-stay") {
    steps.push({ label: "Hero & Images", hint: "Hero & gallery", done: !!biz.heroImage || (biz.gallery?.length ?? 0) > 0 });
    steps.push({ label: "Opening Hours", hint: "Availability info", done: !!biz.availabilityInfo?.trim() });
    steps.push({ label: "Location Pin", hint: null, done: hasCoords(biz.lat, biz.lng) });
    steps.push({ label: "News & Offers", hint: null, done: (biz.offers?.length ?? 0) > 0 });
  } else if (biz.section === "explore") {
    steps.push({ label: "Hero & Images", hint: "Hero & gallery", done: !!biz.heroImage || (biz.gallery?.length ?? 0) > 0 });
    steps.push({ label: "Body Content", hint: null, done: !!biz.body?.trim() });
    steps.push({ label: "Location Pin", hint: null, done: hasCoords(biz.lat, biz.lng) });
    // Explore pages have no News & Offers sub-section.
  } else {
    steps.push({ label: "Hero & Images", hint: null, done: !!biz.hero?.image || (biz.gallery?.length ?? 0) > 0 });
    steps.push({ label: "Opening Hours", hint: null, done: Array.isArray(biz.hours) && biz.hours.length > 0 });
    steps.push({ label: "Location Pin", hint: null, done: hasCoords(biz.lat, biz.lng) });
    steps.push({ label: "News & Offers", hint: null, done: (biz.offers?.length ?? 0) > 0 });
  }
  return steps;
}

export function ProgressSteps({ steps }) {
  return (
    <div className="bg-white rounded-2xl p-5 mb-6" style={CARD}>
      <div className="flex items-stretch gap-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex-1 flex items-center gap-2">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={s.done
                  ? { backgroundColor: "#15803D", color: "#fff" }
                  : { backgroundColor: "rgba(37,99,235,0.1)", color: BLUE }}>
                {s.done ? "✓" : i + 1}
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold leading-tight" style={{ color: NAVY }}>
                  Step {i + 1} — {s.label}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: s.done ? "#15803D" : MUTED }}>
                  {s.done ? "Done" : "In Progress"}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="h-px flex-1 shrink-0 mb-5" style={{ backgroundColor: s.done ? "#15803D" : BORDER }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat tile editor (4 value/label pairs) ───────────────────────────────────
export function StatTilesEditor({ stats, onChange }) {
  function set(i, key, v) { onChange(stats.map((s, idx) => (idx === i ? { ...s, [key]: v } : s))); }
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {stats.map((s, i) => (
        <div key={i} className="rounded-xl p-3 flex gap-2" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "#f8fafc" }}>
          <input value={s.value} onChange={(e) => set(i, "value", e.target.value)} placeholder="e.g. 10+"
            className="w-20 rounded-lg px-2 py-2 text-xs outline-none text-center font-bold" style={INPUT} />
          <input value={s.label} onChange={(e) => set(i, "label", e.target.value)} placeholder="e.g. Years in Business"
            className="flex-1 rounded-lg px-2 py-2 text-xs outline-none" style={INPUT} />
        </div>
      ))}
    </div>
  );
}
