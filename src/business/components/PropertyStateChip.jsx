import { PROPERTY_STATES } from "../../Data/accommodation";

// A property's lifecycle state as a small coloured label.
export default function StateChip({ state }) {
  const s = PROPERTY_STATES[state] ?? PROPERTY_STATES.draft;
  return (
    <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}
