import useNow from "../../hooks/useNow";
import { formatUKDateTime, formatCountdown } from "../../lib/ukDateTime";

// A homepage booking's start and end (UK date and time) with a live countdown:
// "Starts in …" before it begins, "Ends in …" while it runs, then "Ended".
export default function PlacementTimer({ startsAt, endsAt, compact = false }) {
  const now = useNow();
  if (!startsAt || !endsAt) return null;
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();

  let tone = { bg: "rgba(37,99,235,0.08)", fg: "#1D4ED8", label: `Starts in ${formatCountdown(start - now)}` };
  if (now >= end) tone = { bg: "rgba(16,24,40,0.06)", fg: "#6B7280", label: "Ended" };
  else if (now >= start) tone = { bg: "rgba(22,163,74,0.1)", fg: "#15803D", label: `Ends in ${formatCountdown(end - now)}` };

  return (
    <div className={`flex ${compact ? "flex-row flex-wrap items-center gap-x-2 gap-y-1" : "flex-col gap-1"} mt-1.5`}>
      <span className="text-[11px] font-medium tabular-nums" style={{ color: "#475569" }}>
        {formatUKDateTime(startsAt)} → {formatUKDateTime(endsAt)} <span style={{ color: "#94A3B8" }}>UK</span>
      </span>
      <span
        className="self-start inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums"
        style={{ backgroundColor: tone.bg, color: tone.fg }}
        aria-live="off"
      >
        ⏱ {tone.label}
      </span>
    </div>
  );
}
