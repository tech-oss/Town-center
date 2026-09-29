import { Link } from "react-router-dom";
import MobileShell from "./MobileShell";
import SmartImage from "../../components/SmartImage";
import useSiteSection from "../../hooks/useSiteSection";

// The app's Our Story, Our Traders and Work With Us screens. Each one used to
// carry its own hard-coded copy of the words, so nothing edited in Site
// Content ever reached the app; they now read the same section the website
// page does.
//
// `highlight` picks out the paragraph shown in italics (the disclaimer).
export default function TextScreen({ sectionKey, barTitle, highlight }) {
  const copy = useSiteSection(sectionKey);
  const paragraphs = [
    ...(copy.body ?? []),
    ...(copy.introParagraphs ?? []),
  ].filter(Boolean);
  const cards = (copy.cards ?? []).filter((c) => c?.title || c?.body);
  const visibility = (copy.visibilityParagraphs ?? []).filter(Boolean);
  const ctaHref = copy.ctaEmail ? `mailto:${copy.ctaEmail}` : null;
  const ctaLabel = copy.ctaButton || copy.ctaEmail;

  return (
    <MobileShell title={barTitle} onBack backFallback="/mobile/explore" noPadding>
      <div className="flex flex-col">
        <div className="relative px-6 py-14 text-center overflow-hidden" style={{ backgroundColor: "var(--forest)" }}>
          {copy.hero && (
            <>
              <SmartImage src={copy.hero} alt="" size="card" eager sizes="100vw" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.55) 0%, rgba(20,33,42,0.8) 100%)" }} />
            </>
          )}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 90% 70% at 50% 120%, rgba(47,164,164,0.32) 0%, transparent 70%)" }} />
          {copy.eyebrow && <span className="relative section-eyebrow" style={{ color: "var(--sage)" }}>{copy.eyebrow}</span>}
          <h1 className="relative text-3xl font-bold leading-tight mt-3 text-white">{copy.title}</h1>
          {copy.intro && (
            <p className="relative text-sm leading-relaxed mt-3 text-white" style={{ opacity: 0.9 }}>{copy.intro}</p>
          )}
        </div>

        <div className="px-5 pt-6 pb-10 flex flex-col gap-6 mobile-stagger">
          <div className="flex flex-col gap-4">
            {paragraphs.map((p, i) => {
              const hl = highlight?.test(p);
              return (
                <p key={i} className="text-sm leading-relaxed"
                  style={{ color: hl ? "var(--forest)" : "#000000", fontWeight: hl ? 600 : 400, fontStyle: hl ? "italic" : "normal" }}>
                  {p}
                </p>
              );
            })}
          </div>

          {cards.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 6px 24px -14px rgba(28,46,56,0.3)" }}>
              <h3 className="font-bold text-base mb-1.5" style={{ color: "#000000" }}>{c.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{c.body}</p>
            </div>
          ))}

          {(copy.visibilityHeading || visibility.length > 0) && (
            <div className="flex flex-col gap-4">
              {copy.visibilityHeading && <h2 className="text-lg font-bold leading-snug" style={{ color: "#000000" }}>{copy.visibilityHeading}</h2>}
              {visibility.map((p, i) => <p key={i} className="text-sm leading-relaxed" style={{ color: "#000000" }}>{p}</p>)}
            </div>
          )}

          {copy.ctaTitle && (
            <div className="rounded-2xl p-6 flex flex-col gap-3" style={{ backgroundColor: "var(--forest)" }}>
              <h2 className="text-lg font-bold text-white">{copy.ctaTitle}</h2>
              {copy.ctaText && <p className="text-sm leading-relaxed text-white" style={{ opacity: 0.9 }}>{copy.ctaText}</p>}
              {ctaHref && ctaLabel && (
                <a href={ctaHref} className="self-start px-5 py-3 rounded-full text-sm font-bold active:opacity-85"
                  style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}>{ctaLabel}</a>
              )}
              {!ctaHref && copy.ctaButton && copy.ctaLink && (
                <Link to={`/mobile${copy.ctaLink.startsWith("/") ? copy.ctaLink : `/${copy.ctaLink}`}`}
                  className="self-start px-5 py-3 rounded-full text-sm font-bold active:opacity-85"
                  style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}>{copy.ctaButton}</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
