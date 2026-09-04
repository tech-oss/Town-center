import { useState } from "react";
import { FOREST, SAGE, MUTED, BORDER } from "./FormKit";

// `date` strings are plain "YYYY-MM-DD" calendar dates (see
// analyticsRanges.js), not timestamps — parsing them with `new Date(str)`
// reads them as UTC midnight, which then silently prints as the previous
// day once formatted in a timezone ahead of UTC. Split by hand instead.
function parseDateOnly(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Hand-rolled SVG line chart — no charting dependency, matches the rest of
// this codebase's approach of hand-drawing every icon/graphic inline.
// series: [{ date: "2026-08-01", views: 82 }, ...]
export default function AnalyticsChart({ series, height = 220 }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const width = 800; // viewBox width — scales to container via CSS
  const padding = { top: 16, right: 16, bottom: 28, left: 16 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  if (!series?.length) {
    return (
      <div className="flex items-center justify-center rounded-xl" style={{ height, border: `1.5px dashed ${BORDER}`, color: MUTED }}>
        <p className="text-sm">No views yet for this period.</p>
      </div>
    );
  }

  const maxViews = Math.max(1, ...series.map((p) => p.views));
  const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;
  const points = series.map((p, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + innerH - (p.views / maxViews) * innerH,
    ...p,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(padding.top + innerH).toFixed(2)} L ${points[0].x.toFixed(2)} ${(padding.top + innerH).toFixed(2)} Z`;

  // Show at most ~6 date labels along the x-axis regardless of range length.
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));
  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - relX);
      if (d < closestDist) { closestDist = d; closest = i; }
    });
    setHoverIndex(closest);
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SAGE} stopOpacity="0.25" />
            <stop offset="100%" stopColor={SAGE} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerH * f}
            y2={padding.top + innerH * f}
            stroke={BORDER}
            strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill="url(#analyticsFill)" />
        <path d={linePath} fill="none" stroke={SAGE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          (i % labelEvery === 0 || i === points.length - 1) && (
            <text key={p.date} x={p.x} y={height - 6} fontSize="10" textAnchor="middle" fill={MUTED}>
              {parseDateOnly(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </text>
          )
        ))}

        {hovered && (
          <>
            <line x1={hovered.x} x2={hovered.x} y1={padding.top} y2={padding.top + innerH} stroke={BORDER} strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={hovered.x} cy={hovered.y} r="4.5" fill={SAGE} stroke="#fff" strokeWidth="2" />
          </>
        )}
      </svg>

      {hovered && (
        <div
          className="absolute pointer-events-none px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap"
          style={{
            backgroundColor: FOREST,
            left: `${(hovered.x / width) * 100}%`,
            top: `${(hovered.y / height) * 100}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          {hovered.views.toLocaleString()} views
          <span className="block font-normal opacity-75">
            {parseDateOnly(hovered.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      )}
    </div>
  );
}
