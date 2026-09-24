import { useState } from "react";
import { focalOf, withFocal, hasFocal, stripFocal } from "../../lib/focalPoint";
import { BLUE, BORDER, MUTED, NAVY } from "../theme";

// "Click the part that must stay in shot."
//
// The same picture is shown in boxes of quite different shapes — a business
// hero is 1.94:1 on the desktop profile, 1.33:1 in a card on the same page
// and 1.67:1 in the app — so something is always cropped away. This is where
// whoever uploads the picture says which part that must not be.
//
// The three frames underneath are the real shapes the picture ends up in, so
// the effect of moving the point is visible before saving rather than after
// someone notices a beheaded photo on the homepage.

// The shapes that actually crop pictures on the site, measured from the
// rendered pages rather than guessed.
const PREVIEWS = [
  { label: "Desktop hero", ratio: "2.29 / 1" },
  { label: "Card", ratio: "4 / 3" },
  { label: "App", ratio: "5 / 3" },
];

export default function FocalPointPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const focal = focalOf(value);
  const bare = stripFocal(value);

  function pick(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    onChange(withFocal(value, { x, y }));
  }

  if (!value) return null;

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="text-xs font-semibold self-start" style={{ color: BLUE }}>
        {open ? "Done" : hasFocal(value) ? "Change what stays in shot" : "Choose what stays in shot"}
      </button>

      {open && (
        <div className="flex flex-col gap-3 p-3 rounded-xl" style={{ border: `1.5px solid ${BORDER}` }}>
          <p className="text-[11px]" style={{ color: MUTED }}>
            Click the part of the picture that must never be cut off — a face, a sign, the front of the building.
            Everything is cropped differently on a phone and on a desktop; this is what each crop keeps.
          </p>

          <div className="relative cursor-crosshair self-start" onClick={pick}>
            <img src={bare} alt="" className="max-h-64 rounded-lg block" />
            <span
              className="absolute w-5 h-5 rounded-full pointer-events-none"
              style={{
                left: `${focal.x}%`, top: `${focal.y}%`, transform: "translate(-50%, -50%)",
                border: "2.5px solid #fff", backgroundColor: "rgba(37,99,235,0.6)",
                boxShadow: "0 0 0 1.5px rgba(0,0,0,0.5)",
              }}
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {PREVIEWS.map((p) => (
              <div key={p.label} className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold" style={{ color: MUTED }}>{p.label}</span>
                <div className="w-32 overflow-hidden rounded-lg" style={{ aspectRatio: p.ratio, border: `1px solid ${BORDER}` }}>
                  <img src={bare} alt="" className="w-full h-full object-cover"
                    style={{ objectPosition: `${focal.x}% ${focal.y}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px]" style={{ color: MUTED }}>
              {hasFocal(value) ? `Keeping ${focal.x}% across, ${focal.y}% down` : "Centred (the default)"}
            </span>
            {hasFocal(value) && (
              <button type="button" onClick={() => onChange(bare)}
                className="text-[11px] font-semibold" style={{ color: NAVY }}>
                Reset to centre
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
