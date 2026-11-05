// Questions that open on a "+", the same look as the FAQs on Eat & Drink,
// See & Do and Shop pages (PlaceDetailLayout). Used inside the Services and
// freelancer profile cards, which used to print every answer open.
export default function FaqAccordion({ faq = [] }) {
  if (!faq.length) return null;
  return (
    <div className="flex flex-col" style={{ borderTop: "1px solid rgba(28,46,56,0.12)" }}>
      {faq.map((f, i) => (
        <details key={i} className="group py-4" style={{ borderBottom: "1px solid rgba(28,46,56,0.12)" }}>
          <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-sm md:text-base" style={{ color: "#000000" }}>
            {f.q}
            <span className="shrink-0 text-xl transition-transform group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line" style={{ color: "#000000" }}>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
