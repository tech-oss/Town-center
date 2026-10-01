import { useRef, useState } from "react";
import { FRAMES, cropOf, cropsOf, withCrop } from "../lib/focalPoint";

// "How it will look" — one live preview per place a picture is shown (the
// page header, the listing card, a gallery tile…), each at that place's exact
// shape. Drag inside a frame to move the picture, zoom with the slider. What
// is framed here is exactly what the website and the app show: both draw the
// picture with the same rules (cropStyle in lib/focalPoint.js).
//
// `frames` picks which places to show, e.g. ["hero", "card"]. `value` is the
// picture URL (its crops ride on it); `onChange` gets the URL back with the
// new framing.
//
// Kept identical in the admin panel and the business portal.

const PREVIEW_WIDTH = { hero: 300, card: 170, gallery: 150, logo: 120, wide: 340, tall: 140 };

function Frame({ src, frame, onCrop, aspect, label }) {
  const spec = { ...FRAMES[frame], ...(aspect ? { aspect } : {}), ...(label ? { label } : {}) };
  const box = useRef(null);
  const drag = useRef(null);
  const crop = cropOf(src, frame);
  const own = !!cropsOf(src)[frame];
  const [dragging, setDragging] = useState(false);
  const width = PREVIEW_WIDTH[frame] ?? 160;

  function onPointerDown(e) {
    e.preventDefault();
    box.current?.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: crop };
    setDragging(true);
  }
  function onPointerMove(e) {
    if (!drag.current || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const { start } = drag.current;
    // Dragging the picture right shows more of its left side, so the
    // position moves the opposite way; zoomed in, the same drag covers less.
    const k = 100 / (start.z / 100);
    const x = start.x - ((e.clientX - drag.current.x) / r.width) * k;
    const y = start.y - ((e.clientY - drag.current.y) / r.height) * k;
    onCrop({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)), z: start.z });
  }
  function onPointerUp() { drag.current = null; setDragging(false); }

  return (
    <div className="flex flex-col gap-1.5" style={{ width }}>
      <span className="text-[11px] font-semibold" style={{ color: "#475569" }}>{spec.label}</span>
      <div
        ref={box}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative overflow-hidden rounded-lg select-none touch-none"
        style={{
          width, aspectRatio: String(spec.aspect), backgroundColor: "#0f172a",
          cursor: dragging ? "grabbing" : "grab",
          boxShadow: own ? "0 0 0 2px #2563EB" : "0 0 0 1px rgba(16,24,40,0.15)",
        }}
        title="Drag to move the picture in this frame"
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            objectPosition: `${crop.x}% ${crop.y}%`,
            ...(crop.z > 100 ? { transform: `scale(${crop.z / 100})`, transformOrigin: `${crop.x}% ${crop.y}%` } : {}),
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px]" style={{ color: "#64748B" }}>Zoom</span>
        <input type="range" min={100} max={300} step={5} value={crop.z}
          onChange={(e) => onCrop({ ...crop, z: Number(e.target.value) })}
          className="flex-1 min-w-0" aria-label={`${spec.label} zoom`} />
      </div>
      {own && (
        <button type="button" onClick={() => onCrop(null)} className="self-start text-[10px] font-semibold" style={{ color: "#2563EB" }}>
          Reset
        </button>
      )}
    </div>
  );
}

export default function ImageFramer({ value, frames, onChange }) {
  if (!value || !frames?.length) return null;
  return (
    <div className="rounded-xl p-3 flex flex-col gap-2" style={{ backgroundColor: "#f8fafc", border: "1px solid rgba(16,24,40,0.08)" }}>
      <p className="text-[11px]" style={{ color: "#64748B" }}>
        <strong style={{ color: "#1E293B" }}>How it will look</strong> — exactly as shown on the website and app. Drag inside each frame to choose what's in view; zoom to fill it.
      </p>
      <div className="flex flex-wrap gap-4 items-start">
        {frames.flatMap((f) => {
          const set = (c) => onChange(withCrop(value, f, c));
          // The listing card is square on computers and 4:3 on phones and in
          // the app — both shown, both moved by the same framing.
          return f === "card"
            ? [
                <Frame key="card" src={value} frame="card" label="Listing card (computer)" onCrop={set} />,
                <Frame key="card-phone" src={value} frame="card" aspect={4 / 3} label="Listing card (phone & app)" onCrop={set} />,
              ]
            // Beside the website's header frames, "hero" is the app's header.
            : [<Frame key={f} src={value} frame={f} onCrop={set}
                label={f === "hero" && (frames.includes("wide") || frames.includes("tall")) ? "App header" : undefined} />];
        })}
      </div>
    </div>
  );
}
