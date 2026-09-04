import { FOREST, SAGE, BORDER } from "./FormKit";
import { RANGE_OPTIONS } from "../api/analyticsRanges";

export default function RangeSelector({ value, onChange }) {
  return (
    <div className="inline-flex rounded-xl p-1" style={{ backgroundColor: "rgba(28,46,56,0.05)" }}>
      {RANGE_OPTIONS.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={active
              ? { backgroundColor: "#fff", color: FOREST, boxShadow: "0 1px 3px rgba(16,24,40,0.12)" }
              : { color: "#64748B", border: `1px solid transparent` }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
