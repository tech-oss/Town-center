import { useState } from "react";
import { uploadImage } from "../../../lib/uploadImage";
import { BLUE, BORDER, CARD, MUTED, NAVY } from "../../theme";

// Shared form primitives for the Explore content editors (The Future page and
// the neighbourhood guides). Both edit a nested jsonb document made of the
// same shapes — headed cards, repeatable lists, paragraph arrays and images —
// so the pieces live here rather than being written twice.

const INPUT = { border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" };

export function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      {children}
      {hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{hint}</span>}
    </label>
  );
}

export function Inp(props) {
  return <input className="rounded-xl px-3 py-2.5 text-sm outline-none w-full" style={INPUT} {...props} />;
}

export function TextArea({ rows = 3, ...props }) {
  return <textarea rows={rows} className="rounded-xl px-3 py-2.5 text-sm outline-none resize-y w-full" style={INPUT} {...props} />;
}

export function SmallBtn({ children, onClick, danger, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-30"
      style={danger
        ? { border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }
        : { border: `1.5px solid ${BORDER}`, color: NAVY }}>
      {children}
    </button>
  );
}

export function Card({ title, hint, children, action }) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
      <div className="flex items-start justify-between gap-3 pb-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p className="text-sm font-bold" style={{ color: NAVY }}>{title}</p>
          {hint && <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ImageField({ label, value, onChange, hint, folder = "explore" }) {
  const [busy, setBusy] = useState(false);
  function upload(file) {
    if (!file) return;
    setBusy(true);
    uploadImage(file, folder)
      .then(onChange)
      .catch((e) => alert(e.message))
      .finally(() => setBusy(false));
  }
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3 flex-wrap">
        {value && <img src={value} alt="" className="w-28 h-20 rounded-xl object-cover" style={{ border: `1.5px solid ${BORDER}` }} />}
        <label className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: "1.5px solid rgba(37,99,235,0.25)" }}>
          {busy ? "Uploading…" : value ? "Replace Image" : "Upload Image"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
    </Field>
  );
}

// A list of paragraphs, edited one per line. The public pages render each
// entry as its own <p>, so splitting on newlines keeps that mapping obvious.
export function Paragraphs({ label, value, onChange, rows = 5, hint = "One paragraph per line" }) {
  return (
    <Field label={label} hint={hint}>
      <TextArea
        rows={rows}
        value={(value ?? []).join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
      />
    </Field>
  );
}

// Repeatable list with add / remove / reorder. `renderItem(item, update)` draws
// the fields for one entry; `blank` is what "+ Add" appends.
export function RepeatList({ items, onChange, blank, renderItem, addLabel = "+ Add", itemLabel = "Item" }) {
  const list = items ?? [];
  function update(i, patch) { onChange(list.map((it, idx) => (idx === i ? { ...it, ...patch } : it))); }
  function remove(i) { onChange(list.filter((_, idx) => idx !== i)); }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((item, i) => (
        <div key={i} className="rounded-xl p-4 flex flex-col gap-3" style={{ border: `1.5px solid ${BORDER}` }}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{itemLabel} {i + 1}</span>
            <div className="flex gap-1.5">
              <SmallBtn onClick={() => move(i, -1)} disabled={i === 0}>↑</SmallBtn>
              <SmallBtn onClick={() => move(i, 1)} disabled={i === list.length - 1}>↓</SmallBtn>
              <SmallBtn danger onClick={() => remove(i)}>Remove</SmallBtn>
            </div>
          </div>
          {renderItem(item, (patch) => update(i, patch))}
        </div>
      ))}
      <SmallBtn onClick={() => onChange([...list, blank()])}>{addLabel}</SmallBtn>
    </div>
  );
}
