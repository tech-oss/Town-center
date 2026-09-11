import { uploadImage } from "../../../lib/uploadImage";
import { BLUE, BORDER, CARD, MUTED, NAVY } from "../../theme";

// Content and media editor for the public /getting-here page. Deliberately
// not a layout editor: the hero, the stats band, the alternating feature
// blocks, their embedded maps and the Good to Know grid all stay exactly as
// the page renders them — this only changes the words and images inside.
//
// Each feature section's `id` is what decides which map is embedded beside it
// (transport, driving, parking, cycling), so it's shown read-only rather than
// made editable.

const INPUT = { border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" };

function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      {children}
      {hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{hint}</span>}
    </label>
  );
}
function Inp(props) { return <input className="rounded-xl px-3 py-2.5 text-sm outline-none w-full" style={INPUT} {...props} />; }
function TextArea({ rows = 3, ...props }) { return <textarea rows={rows} className="rounded-xl px-3 py-2.5 text-sm outline-none resize-y w-full" style={INPUT} {...props} />; }

function Card({ title, hint, children, action }) {
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

function ImageField({ label, value, onChange }) {
  function upload(file) {
    if (!file) return;
    uploadImage(file, "getting-here").then(onChange).catch((e) => alert(e.message));
  }
  return (
    <Field label={label}>
      <div className="flex items-center gap-3 flex-wrap">
        {value && <img src={value} alt="" className="w-28 h-20 rounded-xl object-cover" style={{ border: `1.5px solid ${BORDER}` }} />}
        <label className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: "1.5px solid rgba(37,99,235,0.25)" }}>
          {value ? "Replace Image" : "Upload Image"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
    </Field>
  );
}

function SmallBtn({ children, onClick, danger }) {
  return (
    <button type="button" onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70"
      style={danger
        ? { border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }
        : { border: `1.5px solid ${BORDER}`, color: NAVY }}>
      {children}
    </button>
  );
}

export default function GettingHereEditor({ section, onChange }) {
  const c = section;

  // Helpers for the repeatable lists held inside the content blob.
  function setList(key, next) { onChange(key, next); }
  function updateAt(key, i, patch) {
    setList(key, (c[key] ?? []).map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }
  function removeAt(key, i) { setList(key, (c[key] ?? []).filter((_, idx) => idx !== i)); }
  function addTo(key, blank) { setList(key, [...(c[key] ?? []), blank]); }
  function moveAt(key, i, dir) {
    const list = [...(c[key] ?? [])];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setList(key, list);
  }

  function updateBlock(si, bi, patch) {
    setList("sections", (c.sections ?? []).map((s, idx) => idx !== si ? s : {
      ...s, blocks: (s.blocks ?? []).map((b, bIdx) => (bIdx === bi ? { ...b, ...patch } : b)),
    }));
  }
  function addBlock(si) {
    setList("sections", (c.sections ?? []).map((s, idx) => idx !== si ? s : {
      ...s, blocks: [...(s.blocks ?? []), { title: "", body: "" }],
    }));
  }
  function removeBlock(si, bi) {
    setList("sections", (c.sections ?? []).map((s, idx) => idx !== si ? s : {
      ...s, blocks: (s.blocks ?? []).filter((_, bIdx) => bIdx !== bi),
    }));
  }

  return (
    <div className="flex flex-col gap-5">
      <Card title="Hero" hint="The full-width banner at the top of the page.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Eyebrow" hint="Small label above the title">
            <Inp value={c.heroEyebrow ?? ""} onChange={(e) => onChange("heroEyebrow", e.target.value)} />
          </Field>
          <Field label="Title">
            <Inp value={c.heroTitle ?? ""} onChange={(e) => onChange("heroTitle", e.target.value)} />
          </Field>
        </div>
        <Field label="Intro paragraph">
          <TextArea rows={2} value={c.heroIntro ?? ""} onChange={(e) => onChange("heroIntro", e.target.value)} />
        </Field>
        <ImageField label="Hero image" value={c.heroImage} onChange={(v) => onChange("heroImage", v)} />
      </Card>

      <Card
        title="Travel stats band"
        hint="The four figures on the dark band below the hero."
        action={<SmallBtn onClick={() => addTo("stats", { value: "", label: "" })}>+ Add stat</SmallBtn>}
      >
        <div className="flex flex-col gap-3">
          {(c.stats ?? []).map((s, i) => (
            <div key={i} className="grid sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
              <Field label="Value"><Inp value={s.value ?? ""} onChange={(e) => updateAt("stats", i, { value: e.target.value })} /></Field>
              <Field label="Label"><Inp value={s.label ?? ""} onChange={(e) => updateAt("stats", i, { label: e.target.value })} /></Field>
              <div className="flex gap-1.5 pb-0.5">
                <SmallBtn onClick={() => moveAt("stats", i, -1)}>↑</SmallBtn>
                <SmallBtn onClick={() => moveAt("stats", i, 1)}>↓</SmallBtn>
                <SmallBtn danger onClick={() => removeAt("stats", i)}>Remove</SmallBtn>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {(c.sections ?? []).map((s, si) => (
        <Card
          key={s.id ?? si}
          title={`Section — ${s.heading || s.id}`}
          hint={`Anchored at #${s.id}. Its map is fixed to this section and can't be changed here.`}
          action={<SmallBtn onClick={() => addBlock(si)}>+ Add point</SmallBtn>}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Eyebrow"><Inp value={s.eyebrow ?? ""} onChange={(e) => updateAt("sections", si, { eyebrow: e.target.value })} /></Field>
            <Field label="Heading"><Inp value={s.heading ?? ""} onChange={(e) => updateAt("sections", si, { heading: e.target.value })} /></Field>
          </div>
          <Field label="Intro paragraph">
            <TextArea rows={3} value={s.intro ?? ""} onChange={(e) => updateAt("sections", si, { intro: e.target.value })} />
          </Field>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold" style={{ color: MUTED }}>Points</p>
            {(s.blocks ?? []).map((b, bi) => (
              <div key={bi} className="rounded-xl p-4 flex flex-col gap-3" style={{ border: `1.5px solid ${BORDER}` }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Point {bi + 1}</span>
                  <SmallBtn danger onClick={() => removeBlock(si, bi)}>Remove</SmallBtn>
                </div>
                <Field label="Title"><Inp value={b.title ?? ""} onChange={(e) => updateBlock(si, bi, { title: e.target.value })} /></Field>
                <Field label="Body"><TextArea rows={2} value={b.body ?? ""} onChange={(e) => updateBlock(si, bi, { body: e.target.value })} /></Field>
              </div>
            ))}
          </div>

          <Field label="Closing note" hint="Optional italic line under the points">
            <TextArea rows={2} value={s.note ?? ""} onChange={(e) => updateAt("sections", si, { note: e.target.value })} />
          </Field>

          {/* Only sections without an embedded map show a photo. */}
          {!["transport", "driving", "parking", "cycling"].includes(s.id) && (
            <ImageField label="Section image" value={s.image} onChange={(v) => updateAt("sections", si, { image: v })} />
          )}
        </Card>
      ))}

      <Card
        title="Car park shortcuts"
        hint="The buttons under the parking map. Each one opens Google Maps directions from the visitor's location to the car park's coordinates."
        action={<SmallBtn onClick={() => addTo("carParks", { label: "", query: "", lat: "", lng: "" })}>+ Add car park</SmallBtn>}
      >
        <p className="text-[11px] -mt-1" style={{ color: "#9CA3AF" }}>
          To get coordinates: right-click the car park entrance in Google Maps and click the numbers at the top of the menu to copy them, then paste into Latitude and Longitude (or paste both into Latitude). Without coordinates the button falls back to searching Maps for the address text.
        </p>
        <div className="flex flex-col gap-3">
          {(c.carParks ?? []).map((p, i) => {
            const hasCoords = p.lat !== "" && p.lng !== "" && p.lat != null && p.lng != null && !Number.isNaN(Number(p.lat)) && !Number.isNaN(Number(p.lng));
            return (
              <div key={i} className="rounded-xl p-4 flex flex-col gap-3" style={{ border: `1.5px solid ${BORDER}` }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Car park {i + 1}</span>
                  <div className="flex gap-1.5">
                    <SmallBtn onClick={() => moveAt("carParks", i, -1)}>↑</SmallBtn>
                    <SmallBtn onClick={() => moveAt("carParks", i, 1)}>↓</SmallBtn>
                    <SmallBtn danger onClick={() => removeAt("carParks", i)}>Remove</SmallBtn>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Button label"><Inp value={p.label ?? ""} onChange={(e) => updateAt("carParks", i, { label: e.target.value })} placeholder="e.g. Nicholsons" /></Field>
                  <Field label="Address (fallback)" hint="Used only if no coordinates are set">
                    <Inp value={p.query ?? ""} onChange={(e) => updateAt("carParks", i, { query: e.target.value })} placeholder="e.g. Nicholsons Car Park, Maidenhead" />
                  </Field>
                  <Field label="Latitude">
                    <Inp inputMode="decimal" value={p.lat ?? ""} placeholder="e.g. 51.5226"
                      onChange={(e) => {
                        // Accept a pasted "lat, lng" pair from Google Maps in one go.
                        const pair = e.target.value.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
                        updateAt("carParks", i, pair ? { lat: pair[1], lng: pair[2] } : { lat: e.target.value });
                      }} />
                  </Field>
                  <Field label="Longitude">
                    <Inp inputMode="decimal" value={p.lng ?? ""} placeholder="e.g. -0.7196" onChange={(e) => updateAt("carParks", i, { lng: e.target.value })} />
                  </Field>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  {hasCoords ? (
                    <>
                      <span className="font-semibold" style={{ color: "#15803D" }}>✓ Directions go to {Number(p.lat).toFixed(5)}, {Number(p.lng).toFixed(5)}</span>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: BLUE }}>Check on map ↗</a>
                    </>
                  ) : (
                    <span className="font-semibold" style={{ color: "#B45309" }}>No coordinates — directions use the address search instead.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        title="Good to Know"
        hint="The card grid at the foot of the page."
        action={<SmallBtn onClick={() => addTo("goodToKnow", { id: `card-${Date.now()}`, title: "", body: "" })}>+ Add card</SmallBtn>}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Eyebrow"><Inp value={c.goodToKnowEyebrow ?? ""} onChange={(e) => onChange("goodToKnowEyebrow", e.target.value)} /></Field>
          <Field label="Heading"><Inp value={c.goodToKnowHeading ?? ""} onChange={(e) => onChange("goodToKnowHeading", e.target.value)} /></Field>
        </div>
        <Field label="Intro paragraph">
          <TextArea rows={2} value={c.goodToKnowIntro ?? ""} onChange={(e) => onChange("goodToKnowIntro", e.target.value)} />
        </Field>

        <div className="flex flex-col gap-3 pt-2">
          {(c.goodToKnow ?? []).map((g, i) => (
            <div key={g.id ?? i} className="rounded-xl p-4 flex flex-col gap-3" style={{ border: `1.5px solid ${BORDER}` }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Card {i + 1}</span>
                <div className="flex gap-1.5">
                  <SmallBtn onClick={() => moveAt("goodToKnow", i, -1)}>↑</SmallBtn>
                  <SmallBtn onClick={() => moveAt("goodToKnow", i, 1)}>↓</SmallBtn>
                  <SmallBtn danger onClick={() => removeAt("goodToKnow", i)}>Remove</SmallBtn>
                </div>
              </div>
              <Field label="Title"><Inp value={g.title ?? ""} onChange={(e) => updateAt("goodToKnow", i, { title: e.target.value })} /></Field>
              <Field label="Body"><TextArea rows={3} value={g.body ?? ""} onChange={(e) => updateAt("goodToKnow", i, { body: e.target.value })} /></Field>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
