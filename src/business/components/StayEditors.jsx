import { Field, Inp, TextArea, Toggle, EditorSection, BORDER, MUTED, FOREST, SAGE } from "./FormKit";
import { STAR_RATINGS } from "../../Data/businessPortalMock";

// Editors shared by a hotel's My Listing and an accommodation property's
// editor — one implementation, so the two can't drift apart.

// Check-in / check-out times, the two options guests filter on, and a
// free-text note about arriving.
export function CheckInEditor({ listing, set }) {
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Check-in times">
          <Inp value={listing.checkInTime ?? ""} maxLength={60}
            onChange={(e) => set("checkInTime", e.target.value)}
            placeholder="e.g. From 3pm" />
        </Field>
        <Field label="Check-out times">
          <Inp value={listing.checkOutTime ?? ""} maxLength={60}
            onChange={(e) => set("checkOutTime", e.target.value)}
            placeholder="e.g. By 11am" />
        </Field>
      </div>
      <p className="text-[11px] mt-2" style={{ color: MUTED }}>
        Shown on your page exactly as you write them. Leave either blank and nothing appears in its place.
      </p>

      <div className="mt-4 grid sm:grid-cols-2 gap-2">
        <Toggle checked={!!listing.earlyCheckin} label="We offer early check-in"
          onChange={(v) => set("earlyCheckin", v)} />
        <Toggle checked={!!listing.lateCheckout} label="We offer late check-out"
          onChange={(v) => set("lateCheckout", v)} />
      </div>
      <p className="text-[11px] mt-2" style={{ color: MUTED }}>
        Guests filter Live &amp; Stay by these, so only tick them if you can usually say yes.
      </p>

      <div className="mt-5">
        <Field label="Anything else about arriving">
          <TextArea rows={3} value={listing.availabilityInfo ?? ""} onChange={(e) => set("availabilityInfo", e.target.value)} placeholder="e.g. 24-hour reception. Late arrivals by arrangement." />
        </Field>
      </div>
    </>
  );
}

// Star rating plus ticked amenities, grouped by category.
export function AmenitiesEditor({ listing, set, categories, showStars = true }) {
  const selected = listing.amenities ?? [];
  return (
    <>
      {showStars && (
        <EditorSection title="Star Rating">
          <div className="flex gap-2 flex-wrap">
            {STAR_RATINGS.map((n) => {
              const on = listing.starRating === n;
              return (
                <button key={n} type="button" onClick={() => set("starRating", on ? null : n)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={on ? { border: `1.5px solid ${SAGE}`, backgroundColor: "rgba(37,99,235,0.1)", color: "#2563EB" } : { border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }}>
                  {n} {n === 1 ? "Star" : "Stars"}
                </button>
              );
            })}
          </div>
        </EditorSection>
      )}

      {categories.map((cat) => (
        <EditorSection key={cat.category} title={cat.category}>
          <div className="grid sm:grid-cols-2 gap-2">
            {cat.options.map((a) => (
              <Toggle key={a} checked={selected.includes(a)} label={a}
                onChange={(v) => set("amenities", v ? [...selected, a] : selected.filter((x) => x !== a))} />
            ))}
          </div>
        </EditorSection>
      ))}
    </>
  );
}

// Room / accommodation information: one card per room type.
const EMPTY_ROOM = { name: "", sleeps: "", beds: "", description: "", amenities: [] };

export function RoomsEditor({ rooms, onChange, amenityOptions, max = 20 }) {
  const list = rooms ?? [];
  const update = (i, patch) => onChange(list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const remove = (i) => onChange(list.filter((_, j) => j !== i));
  const move = (i, d) => {
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {list.length === 0 && (
        <p className="text-sm" style={{ color: MUTED }}>No rooms added yet. Add each type of room or unit guests can book.</p>
      )}
      {list.map((room, i) => (
        <div key={i} className="rounded-xl p-4 flex flex-col gap-4" style={{ border: `1.5px solid ${BORDER}` }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold" style={{ color: FOREST }}>{room.name?.trim() || `Room ${i + 1}`}</p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"
                className="w-8 h-8 rounded-lg text-sm disabled:opacity-30" style={{ border: `1px solid ${BORDER}` }}>↑</button>
              <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move down"
                className="w-8 h-8 rounded-lg text-sm disabled:opacity-30" style={{ border: `1px solid ${BORDER}` }}>↓</button>
              <button type="button" onClick={() => remove(i)}
                className="ml-1 px-3 h-8 rounded-lg text-xs font-semibold" style={{ color: "#B91C1C", border: "1px solid rgba(220,38,38,0.3)" }}>Remove</button>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Room name" hint={`${(room.name ?? "").length}/60`}>
              <Inp value={room.name ?? ""} maxLength={60} onChange={(e) => update(i, { name: e.target.value })} placeholder="e.g. Double Room" />
            </Field>
            <Field label="Sleeps">
              <Inp type="number" min={1} max={30} value={room.sleeps ?? ""} onChange={(e) => update(i, { sleeps: e.target.value === "" ? "" : Math.max(1, Math.min(30, Number(e.target.value))) })} placeholder="e.g. 2" />
            </Field>
            <Field label="Beds">
              <Inp value={room.beds ?? ""} maxLength={60} onChange={(e) => update(i, { beds: e.target.value })} placeholder="e.g. 1 king bed" />
            </Field>
            <Field label="Description" span2 hint={`${(room.description ?? "").length}/300`}>
              <TextArea rows={2} value={room.description ?? ""} maxLength={300} onChange={(e) => update(i, { description: e.target.value })} />
            </Field>
          </div>
          {amenityOptions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>Room amenities</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {amenityOptions.map((a) => {
                  const on = (room.amenities ?? []).includes(a);
                  return (
                    <Toggle key={a} checked={on} label={a}
                      onChange={(v) => update(i, { amenities: v ? [...(room.amenities ?? []), a] : (room.amenities ?? []).filter((x) => x !== a) })} />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
      {list.length < max && (
        <button type="button" onClick={() => onChange([...list, { ...EMPTY_ROOM }])}
          className="self-start px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ color: SAGE, border: `1.5px dashed ${SAGE}` }}>
          + Add a room
        </button>
      )}
    </div>
  );
}
