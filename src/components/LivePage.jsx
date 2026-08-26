import { Link } from "react-router-dom";
import { useEffect } from "react";
import { liveStory } from "../Data/live";
import { guides } from "../Data/guides";
import { getBuildings } from "../api";
import useFetch from "../hooks/useFetch";
import useTapReveal from "../hooks/useTapReveal";
import LocationMap from "./LocationMap";
import ConnectivitySection from "./ConnectivitySection";
// Property search platform (for sale / for rent) — paused for now, kept for
// a future relaunch. See the commented-out routes in src/App.jsx.
// import { FeaturedProperties } from "./PropertySearch";

// ── Editorial photograph — carries the sitewide "framed photograph" hover
// (a sharp foreground photo that insets on hover/tap to reveal a blurred,
// dimmed frame), matching Featured Stories, Explore and the Guides pages. ──
function StoryImage({ image, alt, aspect = "aspect-[4/3]" }) {
  const { revealed, onImageClick } = useTapReveal();
  return (
    <div
      onClick={onImageClick}
      className={`spotlight-card group/img block cursor-pointer shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)] ${revealed ? "is-revealed" : ""}`}
    >
      <div className={`relative overflow-hidden ${aspect}`} style={{ backgroundColor: "#1a1a1a" }}>
        <img src={image} alt="" aria-hidden="true" loading="lazy" className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover" />
        <img src={image} alt={alt} loading="lazy" className="spotlight-photo absolute inset-0 w-full h-full object-cover" />
      </div>
    </div>
  );
}

// ── Same framed-photograph hover, for images shown at their natural aspect
// ratio rather than cropped (e.g. the masterplan diagram) — the reveal
// happens on the padded white mount itself rather than a cropped photo. ──
function FlatSpotlightImage({ image, alt }) {
  const { revealed, onImageClick } = useTapReveal();
  return (
    <div
      onClick={onImageClick}
      className={`spotlight-card group/img block cursor-pointer overflow-hidden bg-white p-2 md:p-3 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.7)] ${revealed ? "is-revealed" : ""}`}
    >
      <img src={image} alt={alt} loading="lazy" className="spotlight-photo w-full h-auto" />
    </div>
  );
}

// ── One alternating story section — text column and photograph side by side
// on desktop (text given the wider share, as on the reference layout), with
// the sides swapping row to row. On mobile the photograph always leads, then
// the copy beneath it. ──
function StorySection({ section, index }) {
  const reversed = index % 2 === 1;
  return (
    <div
      id={section.id}
      className={`grid md:grid-cols-12 gap-8 md:gap-14 lg:gap-20 items-center scroll-mt-28 ${
        reversed ? "md:[&>*:first-child]:order-2" : ""
      }`}
    >
      {/* Photograph — 5 of 12 columns on desktop, first on mobile. */}
      <div className="md:col-span-5">
        <StoryImage image={section.image} alt={section.heading} />
      </div>

      {/* Copy — 7 of 12 columns on desktop. */}
      <div className="md:col-span-7">
        <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>
          {section.eyebrow}
        </p>
        <h2 className="section-heading text-2xl md:text-4xl font-bold mb-5 leading-tight" style={{ color: "#000000" }}>
          {section.heading}
        </h2>
        <div className="flex flex-col gap-4">
          {section.body.map((p, i) => (
            <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>
              {p}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Three Neighbourhood Guides, shown in the same glassmorphic "News &
// Offers" card treatment used on Eat & Drink business pages, so this reads
// as one consistent design language across the site.
const FEATURED_GUIDE_SLUGS = [
  "where-to-have-breakfast-in-maidenhead",
  "hidden-gems-of-maidenhead",
  "date-night-in-maidenhead",
];

function FeaturedArticles() {
  const featured = FEATURED_GUIDE_SLUGS
    .map((slug) => guides.find((g) => g.slug === slug))
    .filter(Boolean);
  if (featured.length === 0) return null;

  return (
    <section
      className="relative py-20 md:py-24 px-6 md:px-12 mt-4 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 50% 48%, rgba(150,215,211,0.22) 0%, transparent 70%), linear-gradient(135deg, #16252E 0%, #245C63 50%, #2F8C8C 100%)",
      }}
    >
      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <p className="section-eyebrow mb-3" style={{ color: "var(--mint)" }}>Neighbourhood Guides</p>
            <h2 className="hero-title uppercase text-3xl md:text-5xl text-white">Featured Articles</h2>
          </div>
          <Link to="/guides" className="group inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-white/80 underline decoration-white/40 underline-offset-4">
            View all guides
            <span className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: "var(--sage)" }}>→</span>
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((g, i) => {
            const isFeatured = i === 1; // middle card glows
            return (
              <Link
                key={g.slug}
                to={`/guides/${g.slug}`}
                className="group relative flex flex-row md:flex-col overflow-hidden p-3 gap-3 md:gap-0
                           transition-all duration-300 ease-out hover:-translate-y-1"
                style={{
                  backgroundColor: "rgba(240,250,250,0.62)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: isFeatured ? "1.5px solid var(--sage)" : "1px solid rgba(255,255,255,0.45)",
                  boxShadow: isFeatured
                    ? "0 0 0 1px var(--sage), 0 10px 40px -8px rgba(82,199,182,0.55)"
                    : "0 8px 28px -12px rgba(22,37,46,0.45)",
                }}
              >
                {/* Image */}
                <div className="relative shrink-0 w-28 sm:w-32 md:w-full self-stretch md:self-auto overflow-hidden">
                  <img
                    src={g.cardImage}
                    alt={g.title}
                    loading="lazy"
                    className="w-full h-full md:h-44 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <span
                    className="absolute top-2 left-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "var(--leaf)" }}
                  >
                    {g.category}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 min-w-0 md:p-3 md:pt-4">
                  <h3
                    className="font-bold text-sm md:text-lg leading-snug mb-2"
                    style={{ color: "#000000", fontFamily: "var(--font-heading)" }}
                  >
                    {g.title}
                  </h3>
                  <p className="text-xs md:text-sm leading-relaxed mb-3 line-clamp-3" style={{ color: "#000000" }}>
                    {g.summary}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold mt-auto" style={{ color: "var(--leaf)" }}>
                    Read more
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function LivePage() {
  const { data: buildings } = useFetch(getBuildings, []);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const { hero, lede, sections, nicholson, pullQuote, closing } = liveStory;

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      {/* ── 1. Hero — same footprint and typography as the Explore / Guides
          / Getting Here heroes, so every editorial landing page in the site
          opens the same way. ── */}
      <section className="relative w-full h-[70vh] min-h-[520px] flex flex-col items-center justify-end text-center px-6 pb-12 md:pb-16 overflow-hidden">
        <img src={hero.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.45) 0%, rgba(20,33,42,0.55) 50%, rgba(20,33,42,0.9) 100%)" }} />
        <span className="section-eyebrow relative mb-3" style={{ color: "var(--sage)" }}>
          {hero.eyebrow}
        </span>
        <h1 className="hero-title relative uppercase text-3xl md:text-5xl lg:text-6xl leading-tight mb-4 text-white max-w-3xl" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
          {hero.title}
        </h1>
        <p className="relative text-sm md:text-base max-w-xl leading-relaxed font-medium text-white" style={{ letterSpacing: "-0.01em" }}>
          {hero.subtitle}
        </p>
      </section>

      {/* ── 2. Breadcrumb — below the hero image, matching the other pages. ── */}
      <nav className="max-w-6xl mx-auto px-6 md:px-12 pt-6 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
        <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
        <span className="mx-2 opacity-40">/</span>
        <span>Live in Maidenhead</span>
      </nav>

      {/* ── 3. Lede — the opening statement, set in the same editorial serif
          treatment as the homepage intro beneath the hero video: large,
          right-aligned Playfair Display. ── */}
      <section className="pt-10 md:pt-14 pb-14 md:pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col gap-6 md:gap-8">
          {lede.map((p, i) => (
            <p
              key={i}
              className="text-right text-2xl md:text-[2.5rem]"
              style={{
                color: "#000000",
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 400,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
              }}
            >
              {p}
            </p>
          ))}

          {/* Straight into the two Stay listings — hotels vs. self catering
              & serviced accommodation — right where the reader's attention
              is, before the editorial story run begins. */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
            <Link
              to="/live/stay/accommodation"
              className="inline-flex items-center justify-center text-center px-8 py-4 rounded-full font-semibold border-2 transition-colors hover:bg-black hover:text-white"
              style={{ borderColor: "#000000", color: "#000000" }}
            >
              Self Catering &amp; Serviced Accommodation
            </Link>
            <Link
              to="/live/stay/hotels"
              className="inline-flex items-center justify-center text-center px-8 py-4 rounded-full font-semibold border-2 transition-colors hover:bg-black hover:text-white"
              style={{ borderColor: "#000000", color: "#000000" }}
            >
              Hotels
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Story sections — alternating copy and photography, set on a
          soft tinted band so the run reads as one continuous chapter. ── */}
      <section className="px-6 md:px-12 py-16 md:py-24" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto flex flex-col gap-20 md:gap-28">
          {sections.map((s, i) => (
            <StorySection key={s.id} section={s} index={i} />
          ))}
        </div>
      </section>

      {/* ── 5. Connectivity — the narrative "Connected" section above is
          followed by the hard numbers (Elizabeth line, road and rail
          times), so the story leads and the detail supports it. ── */}
      <ConnectivitySection />

      {/* ── 6. Nicholson Quarter — the flagship change, given a darker
          full-bleed treatment so it stands apart from the story run. ── */}
      <section id="nicholson-quarter" className="relative overflow-hidden scroll-mt-28" style={{ backgroundColor: "var(--forest)" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
          <div className="grid md:grid-cols-12 gap-8 md:gap-14 lg:gap-20 items-center">
            {/* Photograph first in the DOM so it leads on mobile — the same
                image-then-copy rhythm the story sections above use. */}
            <div className="md:col-span-5">
              <StoryImage image={nicholson.image} alt={nicholson.heading} />
            </div>
            <div className="md:col-span-7">
              <p className="section-eyebrow mb-3" style={{ color: "var(--sage)" }}>
                {nicholson.eyebrow}
              </p>
              <h2 className="section-heading text-2xl md:text-4xl font-bold mb-5 leading-tight text-white">
                {nicholson.heading}
              </h2>
              <div className="flex flex-col gap-4">
                {nicholson.intro.map((p, i) => (
                  <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.82)" }}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* The masterplan, with the closing thoughts beside it. */}
          <div className="grid md:grid-cols-12 gap-8 md:gap-14 lg:gap-20 items-center mt-14 md:mt-20">
            <div className="md:col-span-7">
              <FlatSpotlightImage image={nicholson.planImage} alt="Nicholson Quarter masterplan" />
            </div>
            <div className="md:col-span-5 flex flex-col gap-4">
              {nicholson.outro.map((p, i) => (
                <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.82)" }}>
                  {p}
                </p>
              ))}
              <Link
                to="/explore/the-future"
                className="inline-flex items-center gap-2 mt-3 px-7 py-3.5 rounded-full font-semibold transition-transform hover:scale-105 self-start"
                style={{ backgroundColor: "var(--sage)", color: "#000000" }}
              >
                Explore the full vision <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Pull-quote band — a full-width photograph carrying the single
          line the regeneration story turns on. ── */}
      <section className="relative overflow-hidden">
        <img src={pullQuote.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(20,33,42,0.9), rgba(31,155,181,0.78))" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-20 md:py-32 text-center">
          <p className="text-sm md:text-base mb-5" style={{ color: "rgba(255,255,255,0.8)" }}>
            {pullQuote.lead}
          </p>
          <p className="hero-title uppercase text-2xl md:text-4xl lg:text-5xl leading-tight text-white" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.35)" }}>
            {pullQuote.quote}
          </p>
        </div>
      </section>

      {/* ── 8. Developments — squared cards, same card typography as the
          See & Do / Eat & Drink / Shop / Services listing grids. ── */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>New Homes</p>
          <h2 className="section-heading text-2xl md:text-4xl font-bold mb-3 leading-tight" style={{ color: "#000000" }}>Developments</h2>
          <p className="text-base md:text-lg mb-10 max-w-2xl leading-relaxed" style={{ color: "#000000" }}>
            Explore Maidenhead's leading residential developments.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {(buildings ?? []).map((b) => (
              <Link
                key={b.slug}
                to={`/live/building/${b.slug}`}
                className="group bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
                style={{ borderRadius: "0px", boxShadow: "0 8px 24px rgba(13,42,51,0.08)" }}
              >
                <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden">
                  <img src={b.image} alt={b.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="flex flex-col gap-1 sm:gap-0.5 p-2.5 sm:p-2.5">
                  <span
                    className="inline-flex items-center gap-1.5 text-[9px] sm:text-[9px] font-semibold uppercase tracking-[0.08em] px-2 sm:px-2 py-0.5 sm:py-0.5 rounded-full max-w-full truncate self-start"
                    style={{ color: "#000000", backgroundColor: "#ffffff", boxShadow: "0 1px 4px rgba(13,42,51,0.12)" }}
                  >
                    {b.developer}
                  </span>
                  <h3 className="listing-card-title text-xs sm:text-sm leading-snug sm:leading-tight line-clamp-2 sm:line-clamp-1" style={{ color: "#000000", fontFamily: "var(--font-heading)" }}>
                    {b.name}
                  </h3>
                  <p className="hidden sm:block text-[11px] leading-snug line-clamp-1" style={{ color: "#000000" }}>{b.tagline}</p>
                  <span className="inline-flex items-center gap-1 sm:gap-1 text-[10px] sm:text-[11px] font-semibold mt-0.5 sm:mt-0.5" style={{ color: "#000000" }}>
                    Explore
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Closing statement ── */}
      <section className="px-6 md:px-12 pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="hero-title uppercase text-3xl md:text-5xl mb-8 leading-tight" style={{ color: "#000000" }}>
            {closing.heading}
          </h2>
          <div className="flex flex-col gap-5">
            {closing.body.map((p, i) => (
              <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>
                {p}
              </p>
            ))}
          </div>
          <p className="text-lg md:text-2xl leading-relaxed mt-10" style={{ color: "#000000", fontFamily: "var(--font-heading)" }}>
            {closing.kicker}
          </p>
          <Link
            to={closing.cta.to}
            className="inline-flex items-center gap-2 mt-9 px-7 py-3.5 rounded-full font-semibold transition-transform hover:scale-105"
            style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}
          >
            {closing.cta.label} <span>→</span>
          </Link>
        </div>
      </section>

      {/* ── 10. Location map ── */}
      <section className="pb-16 md:pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <LocationMap heading="Where you'll live" note="Maidenhead, Berkshire — on the Elizabeth Line, 18 minutes from London Paddington." lat={51.5236} lng={-0.7197} query="Maidenhead, Berkshire" />
        </div>
      </section>

      {/* ── 11. Featured Articles — three Neighbourhood Guides, in the same
          card treatment as Eat & Drink's News & Offers section. ── */}
      <FeaturedArticles />
    </div>
  );
}
