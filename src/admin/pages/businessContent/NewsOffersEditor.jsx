import { useState } from "react";
import { Field, Inp, TextArea, StatusPill, NAVY, BLUE, MUTED, BORDER, INPUT, SingleImageUpload } from "./shared";

const EMPTY = { title: "", type: "Offer", image: null, body: "", startDate: "", endDate: "", status: "Draft" };

export default function NewsOffersEditor({ offers, onChange }) {
  const [form, setForm] = useState(null); // null = list, object = editing/creating

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleSave() {
    if (!form.title?.trim()) return;
    if (form.id) {
      onChange(offers.map((o) => (o.id === form.id ? { ...form } : o)));
    } else {
      onChange([{ ...form, id: `o${Date.now()}`, thumbnail: form.image, publishedDate: form.status === "Published" ? new Date().toISOString().slice(0, 10) : "" }, ...offers]);
    }
    setForm(null);
  }
  function handleDelete(id) {
    onChange(offers.filter((o) => o.id !== id));
  }

  if (form !== null) {
    return (
      <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: "rgba(37,99,235,0.03)", border: `1px solid rgba(37,99,235,0.15)` }}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: NAVY }}>{form.id ? "Edit" : "Create"} News / Offer</p>
          <button onClick={() => setForm(null)} className="text-xs" style={{ color: MUTED }}>✕ Cancel</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Title" required span2>
            <Inp value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Happy Hour, New Menu Launch…" />
          </Field>
          <Field label="Type">
            <select value={form.type} onChange={(e) => set("type", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT}>
              <option>News</option><option>Offer</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT}>
              <option>Published</option><option>Draft</option><option>Hidden</option>
            </select>
          </Field>
          <Field label="Start Date">
            <Inp type="date" value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label="End Date" hint="Optional">
            <Inp type="date" value={form.endDate ?? ""} onChange={(e) => set("endDate", e.target.value)} />
          </Field>
          <Field label="Body content — will appear as formatted text on the news/offer page" span2>
            <TextArea rows={4} value={form.body} onChange={(e) => set("body", e.target.value)} placeholder="Details of the offer or news item…" />
          </Field>
          <Field label="Hero Image" span2>
            <SingleImageUpload src={form.image} onChange={(v) => set("image", v)} aspect="aspect-[2/1]" />
          </Field>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={!form.title?.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ backgroundColor: BLUE }}>
            Save
          </button>
          <button onClick={() => setForm(null)} className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: MUTED, border: `1.5px solid #D1D5DB` }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button onClick={() => setForm({ ...EMPTY })}
        className="self-start px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
        style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
        + Create News / Offer
      </button>
      {offers.length === 0 && <p className="text-xs" style={{ color: MUTED }}>No news or offers yet.</p>}
      {offers.map((o) => (
        <div key={o.id} className="rounded-xl p-3 flex items-center gap-3" style={{ border: `1px solid ${BORDER}`, backgroundColor: "#fafafa" }}>
          {o.thumbnail && <img src={o.thumbnail} alt={o.title} className="w-16 h-12 rounded-lg object-cover shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-semibold" style={{ color: NAVY }}>{o.title}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={o.type === "Offer" ? { backgroundColor: "rgba(37,99,235,0.1)", color: BLUE } : { backgroundColor: "rgba(16,163,74,0.1)", color: "#15803D" }}>
                {o.type}
              </span>
              <StatusPill status={o.status} />
            </div>
            {o.publishedDate && <p className="text-[10px]" style={{ color: "#9CA3AF" }}>Published {o.publishedDate}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setForm({ ...o })} className="text-xs font-semibold" style={{ color: BLUE }}>Edit</button>
            <button onClick={() => handleDelete(o.id)} className="text-xs font-semibold" style={{ color: "#DC2626" }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
