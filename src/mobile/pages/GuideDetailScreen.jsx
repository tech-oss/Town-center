import { useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { guides, getGuideBySlug } from "../../Data/guides";
import useMobileBack from "../hooks/useMobileBack";

// One "place" section of a guide — hero photo, eyebrow/title/location, full
// body copy, a "Try it for" callout and address/phone footer. Desktop lays
// these out side-by-side alternating left/right; stacked photo-then-text
// reads as one native card per place on a phone.
function PlaceSection({ s }) {
  return (
    <div className="flex flex-col overflow-hidden bg-white" style={{ borderRadius: 18, boxShadow: "0 12px 30px -16px rgba(28,46,56,0.35)" }}>
      <img src={s.image} alt={s.title} loading="lazy" className="w-full h-48 object-cover" />
      <div className="p-4 flex flex-col gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: "var(--leaf)" }}>
            <span>{s.icon}</span> {s.eyebrow}
          </p>
          <h2 className="text-lg font-bold leading-snug mt-1" style={{ color: "#000000" }}>{s.title}</h2>
          {s.location && <p className="text-xs font-semibold mt-0.5" style={{ color: "#000000", opacity: 0.7 }}>{s.location}</p>}
        </div>

        <div className="flex flex-col gap-2.5">
          {s.body.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "#000000" }}>{p}</p>
          ))}
        </div>

        {s.tryItFor && (
          <div className="rounded-xl p-3" style={{ backgroundColor: "var(--mint)" }}>
            <p className="text-xs leading-relaxed" style={{ color: "var(--forest)" }}>
              <span className="font-bold">Try it for:</span> {s.tryItFor}
            </p>
          </div>
        )}

        {(s.address || s.phone) && (
          <p className="text-xs leading-relaxed" style={{ color: "#000000", opacity: 0.6 }}>
            {s.address}{s.address && s.phone ? " · " : ""}{s.phone}
          </p>
        )}
      </div>
    </div>
  );
}

export default function GuideDetailScreen() {
  const { slug } = useParams();
  const guide = getGuideBySlug(slug);
  const [toast, setToast] = useState(false);

  const goBack = useMobileBack("/mobile/guides");
  if (!guide) return <Navigate to="/mobile/guides" replace />;

  const related = guides.filter((g) => g.slug !== guide.slug).slice(0, 3);

  async function handleShare() {
    const url = `${window.location.origin}/guides/${guide.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: guide.title, text: guide.summary, url });
      } catch {
        /* user cancelled — no-op */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast(true);
      setTimeout(() => setToast(false), 2000);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <MobileShell noPadding onBack={goBack}>
      <div className="flex flex-col">
        <div className="relative">
          <img src={guide.heroImage} alt="" className="w-full h-48 object-cover" />
        </div>

        <div className="px-5 pt-2 flex flex-col gap-6 pb-10 mobile-stagger">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{guide.category}</span>
              <h1 className="text-xl font-bold mt-1 leading-snug" style={{ color: "#000000" }}>{guide.title}</h1>
            </div>
            <button onClick={handleShare} className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center active:opacity-80" style={{ backgroundColor: "var(--leaf)" }} aria-label="Share this guide">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" />
              </svg>
            </button>
          </div>

          {/* Full intro — every paragraph, not just the first. */}
          <div className="flex flex-col gap-3">
            {guide.intro.map((p, i) => (
              <p key={i} className={`leading-relaxed ${i === 0 ? "text-base font-semibold" : "text-sm"}`} style={{ color: "#000000" }}>{p}</p>
            ))}
          </div>

          {/* Every place section, full content. */}
          <div className="flex flex-col gap-5">
            {guide.sections.map((s) => <PlaceSection key={s.id} s={s} />)}
          </div>

          {/* More spots worth knowing */}
          {guide.moreSpots && (
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-bold leading-snug mb-1.5" style={{ color: "#000000" }}>{guide.moreSpots.heading}</h2>
                <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{guide.moreSpots.intro}</p>
              </div>
              <div className="flex flex-col gap-3">
                {guide.moreSpots.items.map((it) => (
                  <div key={it.title} className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 8px 22px -14px rgba(28,46,56,0.3)" }}>
                    <h3 className="font-bold text-sm leading-snug mb-1" style={{ color: "#000000" }}>{it.title}</h3>
                    {it.location && <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--leaf)" }}>{it.location}</p>}
                    <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{it.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cheat sheet */}
          {guide.cheatSheet && (
            <div className="-mx-5 px-5 py-8 flex flex-col gap-2" style={{ background: "linear-gradient(135deg, var(--forest), var(--teal-deep))" }}>
              <h2 className="text-lg font-bold text-white text-center leading-snug">{guide.cheatSheet.heading}</h2>
              <p className="text-xs text-center mb-3" style={{ color: "rgba(255,255,255,0.78)" }}>{guide.cheatSheet.intro}</p>
              <div className="flex flex-col gap-2.5">
                {guide.cheatSheet.items.map((it) => (
                  <div key={it.label} className="rounded-xl p-3.5 flex items-center gap-3" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                    <span className="text-xl shrink-0">{it.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.72)" }}>{it.label}</p>
                      <p className="text-sm font-bold text-white leading-snug">{it.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Combinations */}
          {guide.combinations && (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--leaf)" }}>Make a Morning of It</p>
                <h2 className="text-lg font-bold leading-snug mb-1.5" style={{ color: "#000000" }}>{guide.combinations.heading}</h2>
                <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{guide.combinations.intro}</p>
              </div>
              <div className="flex flex-col gap-3">
                {guide.combinations.items.map((c) => (
                  <div key={c.title} className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 8px 22px -14px rgba(28,46,56,0.3)" }}>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-lg">{c.icon}</span>
                      <h3 className="font-bold text-sm leading-snug" style={{ color: "#000000" }}>{c.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Closing */}
          {guide.closing && (
            <div className="-mx-5 relative overflow-hidden" style={{ minHeight: 220 }}>
              <img src={guide.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(20,33,42,0.92), rgba(31,155,181,0.85))" }} />
              <div className="relative px-5 py-9 flex flex-col gap-3">
                <h2 className="text-lg font-bold text-white leading-snug">{guide.closing.heading}</h2>
                {guide.closing.body.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{p}</p>
                ))}
              </div>
            </div>
          )}

          {/* Related guides */}
          {related.length > 0 && (
            <div>
              <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>Keep Exploring</p>
              <div className="flex flex-col gap-3">
                {related.map((g) => (
                  <Link
                    key={g.slug}
                    to={`/mobile/guides/${g.slug}`}
                    className="flex items-stretch overflow-hidden bg-white active:opacity-90"
                    style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}
                  >
                    <img src={g.cardImage} alt="" className="w-24 h-24 object-cover shrink-0" />
                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{g.category}</span>
                      <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: "#000000" }}>{g.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-xs font-semibold" style={{ bottom: 88, backgroundColor: "rgba(15,26,32,0.95)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>
          Link copied to clipboard
        </div>
      )}
    </MobileShell>
  );
}
