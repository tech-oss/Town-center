import { BORDER, MUTED, NAVY } from "../theme";

// One search box for the moderation lists.
//
// Every one of these screens is a long list of things belonging to businesses,
// and the way admin looks for something is by the business's name — rarely by
// the title of the post. The box matches the business first, and the item's
// own words too, so there is one field to explain rather than two.

export default function SearchBar({ value, onChange, placeholder = "Search by business…" }) {
  return (
    <div className="mb-5 relative max-w-md">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl pl-3.5 pr-20 py-2.5 text-sm outline-none"
        style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }}
      />
      {value && (
        <button onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
          style={{ color: MUTED }}>
          Clear
        </button>
      )}
    </div>
  );
}

// Filters a list of items by what admin typed. `fields` names what to look in
// on each item; a business with no name behind it answers to "town", so an
// unattached item is still findable.
export function matchesQuery(item, query, fields) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = fields.map((f) => item[f] ?? "").join(" ") + (item.businessId ? "" : " town");
  return hay.toLowerCase().includes(q);
}
