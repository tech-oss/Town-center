import { useState } from "react";
import { focalOf, withFocal, hasFocal, stripFocal } from "../../lib/focalPoint";
// Defined here rather than imported from FormKit: FormKit imports this
// component, and importing back would be a cycle.
const BORDER = "rgba(16,24,40,0.1)";
const FOREST = "#1E293B";
const MUTED  = "#64748B";
const SAGE   = "#2563EB";

// "Click the part that must stay in shot."
//
// Your picture is shown in several different shapes: wide and short across
// the top of your page on a desktop, nearly square in a card further down,
// and different again in the app. Something is always cropped away — which
// is why a sign or a face can end up cut in half even when the picture
// looked right when you uploaded it.
//
// This is where you say which part must not be cut. The three frames below
// are the real shapes your picture ends up in, so you can see the result
// before you save rather than after a customer sees it.

const PREVIEWS = [
  { label: "Top of your page", ratio: "2.29 / 1" },
  { label: "In a card", ratio: "4 / 3" },
  { label: "In the app", ratio: "5 / 3" },
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
    <div className="flex flex-col gap-2 mt-2">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="text-xs font-semibold self-start" style={{ color: SAGE }}>
        {open ? "Done" : hasFocal(value) ? "Change what stays in shot" : "Choose what stays in shot"}
      </button>

      {open && (
        <div className="flex flex-col gap-3 p-3 rounded-xl" style={{ border: `1.5px solid ${BORDER}` }}>
          <p className="text-[11px]" style={{ color: MUTED }}>
            Click the part of the picture that must never be cut off — your sign, your shopfront, a face.
            Your picture is cropped differently on a phone and on a desktop; this is what each one keeps.
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
                className="text-[11px] font-semibold" style={{ color: FOREST }}>
                Reset to centre
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
