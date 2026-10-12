// The "what you get" step of registration for an accommodation management
// company, in place of the standard business profile benefits: how the
// company/property structure works, and Free vs paid. Plan prices aren't
// shown here — they're chosen from the dashboard after approval.

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B", BORDER = "rgba(16,24,40,0.14)";

const STEPS = [
  ["Your company is approved", "Maidenhead admin checks your management company or agency registration."],
  ["Choose a plan", "Start free with one property, or choose a plan for 5, 10, 15, 20 or 30 properties."],
  ["Add your properties", "Each property gets its own page, map pin, photos, reviews and statistics."],
  ["Each property is approved", "Every property is checked by Maidenhead admin before it appears publicly."],
];

const FREE = ["1 property", "Property name and address", "Map pin", "Your company details"];
const PAID = [
  "5, 10, 15, 20 or 30 properties",
  "Header picture + up to 12 photos per property",
  "Full description, tagline and booking link",
  "Amenities, rooms and check-in details",
  "Property FAQs and reviews",
  "Articles shared across your properties",
  "Property and company-wide analytics",
];

function Check({ children }) {
  return (
    <li className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: MUTED }}>
      <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-px text-[10px] font-bold"
        style={{ backgroundColor: "rgba(37,99,235,0.1)", color: SAGE }}>✓</span>
      {children}
    </li>
  );
}

export default function AccommodationBenefits() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-base font-bold" style={{ color: FOREST }}>How accommodation works on Maidenhead</p>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          Visitors find your individual properties. Your company appears on each property page as <strong>Managed by</strong>, with your logo and details.
        </p>
      </div>

      <ol className="grid sm:grid-cols-2 gap-2.5">
        {STEPS.map(([title, detail], i) => (
          <li key={title} className="flex items-start gap-2.5 rounded-xl p-3" style={{ border: `1.5px solid ${BORDER}` }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white" style={{ backgroundColor: SAGE }}>{i + 1}</span>
            <span className="text-xs leading-relaxed" style={{ color: MUTED }}><strong style={{ color: FOREST }}>{title}</strong> — {detail}</span>
          </li>
        ))}
      </ol>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ border: `1.5px solid ${BORDER}` }}>
          <p className="text-sm font-bold" style={{ color: FOREST }}>Free</p>
          <p className="text-[11px] mb-2" style={{ color: MUTED }}>A basic listing to get started</p>
          <ul className="flex flex-col gap-1.5">{FREE.map((f) => <Check key={f}>{f}</Check>)}</ul>
        </div>
        <div className="rounded-xl p-4" style={{ border: `1.5px solid ${SAGE}`, backgroundColor: "rgba(37,99,235,0.04)" }}>
          <p className="text-sm font-bold" style={{ color: FOREST }}>Paid plans</p>
          <p className="text-[11px] mb-2" style={{ color: MUTED }}>The full property profile, for more properties</p>
          <ul className="flex flex-col gap-1.5">{PAID.map((f) => <Check key={f}>{f}</Check>)}</ul>
        </div>
      </div>
    </div>
  );
}
