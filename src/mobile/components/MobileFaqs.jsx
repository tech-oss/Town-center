// A business's FAQs on an app business page. Renders nothing when there are none.
export default function MobileFaqs({ faq }) {
  if (!faq?.length) return null;
  return (
    <div className="flex flex-col">
      <p className="section-eyebrow mb-2" style={{ color: "var(--teal-deep)" }}>Frequently Asked Questions</p>
      <div className="bg-white px-4" style={{ borderRadius: 16, boxShadow: "0 6px 20px -12px rgba(28,46,56,0.35)" }}>
        {faq.map((f, i) => (
          <details key={i} className="group py-3.5" style={i < faq.length - 1 ? { borderBottom: "1px solid rgba(28,46,56,0.1)" } : undefined}>
            <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-semibold" style={{ color: "#000000" }}>
              {f.q}
              <span className="shrink-0 text-lg transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line" style={{ color: "#000000" }}>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
