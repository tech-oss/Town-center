import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { categoryColors } from "../Data/events";
import { getEventBySlug, getEvents, getBusinessBySlug } from "../api";
import useFetch from "../hooks/useFetch";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";

// Map a What's On event, or a See & Do business (from the businesses resource),
// onto the shared event shape so every See & Do detail page uses the same layout.
function asEvent(rawEvent, it) {
  if (rawEvent) return rawEvent;
  if (!it || it.section !== "see-do") return null;
  const body = it.paragraphs
    ? it.paragraphs.map((p) => ({ text: p }))
    : it.description
    ? [{ text: it.description }]
    : [];
  return {
    slug: it.slug,
    category: it.tag || "What's On",
    title: it.name,
    location: it.address,
    website: it.website ? `https://${it.website.replace(/^https?:\/\//, "")}` : undefined,
    image: it.image,
    gallery: it.gallery?.length ? it.gallery : [it.image],
    standfirst: it.description,
    body,
  };
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function TicketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M3 9a2 2 0 002-2V5h14v2a2 2 0 000 4v2a2 2 0 000 4v2H5v-2a2 2 0 00-2-2V9z" /><path d="M9 5v14" strokeDasharray="2 2" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  );
}

export default function EventPage() {
  const { slug } = useParams();
  // The slug can be either a What's On event or a See & Do business; fetch both
  // and let asEvent() pick the right one.
  const { data: rawEvent, loading: loadingEvent, error } = useFetch(() => getEventBySlug(slug), [slug]);
  const { data: business, loading: loadingBusiness } = useFetch(() => getBusinessBySlug(slug), [slug]);
  const { data: allEvents, loading: loadingList } = useFetch(getEvents, []);
  const [active, setActive] = useState(0);
  // Reset the carousel to the first image when navigating to a different item
  // (adjusting state during render — no extra paint).
  const [seenSlug, setSeenSlug] = useState(slug);
  if (slug !== seenSlug) { setSeenSlug(slug); setActive(0); }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (loadingEvent || loadingBusiness || loadingList) return <Loading minHeight="70vh" />;
  if (error) return <ErrorState minHeight="70vh" />;
  const event = asEvent(rawEvent, business);
  if (!event) return <Navigate to="/" replace />;

  const gallery = event.gallery?.length ? event.gallery : [event.image];
  const dot = categoryColors[event.category] || "var(--leaf)";
  const next = () => setActive((a) => (a + 1) % gallery.length);
  const prev = () => setActive((a) => (a - 1 + gallery.length) % gallery.length);

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      <section className="px-6 md:px-12 pt-6 md:pt-10">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-5 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link to="/see-do?category=events" className="hover:opacity-70 transition-opacity">What's On</Link>
          </nav>

          {/* Carousel */}
          <div className="relative rounded-3xl overflow-hidden aspect-[16/9] bg-black shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
            {gallery.map((g, i) => (
              <img
                key={i}
                src={g}
                alt={`${event.title} ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                style={{ opacity: i === active ? 1 : 0 }}
              />
            ))}
            {gallery.length > 1 && (
              <>
                {/* Prev / next */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button onClick={prev} aria-label="Previous image" className="w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center text-lg shadow" style={{ color: "var(--forest)" }}>‹</button>
                  <button onClick={next} aria-label="Next image" className="w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center text-lg shadow" style={{ color: "var(--forest)" }}>›</button>
                </div>
                {/* Dots */}
                <div className="absolute bottom-5 left-5 flex gap-2">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      aria-label={`Go to image ${i + 1}`}
                      className="rounded-full transition-all"
                      style={{ width: i === active ? 22 : 8, height: 8, backgroundColor: i === active ? "#fff" : "rgba(255,255,255,0.55)" }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="py-10 md:py-14 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Category pill */}
          <span className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-1.5 rounded-full mb-5" style={{ backgroundColor: "#fff", color: "var(--forest)", boxShadow: "0 4px 16px -8px rgba(28,46,56,0.3)" }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dot }} />
            {event.category}
          </span>

          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6" style={{ color: "var(--forest)" }}>
            {event.title}
          </h1>

          {/* Meta rows */}
          <div className="flex flex-col gap-3 mb-8">
            {event.date && (
              <div className="flex items-center gap-3 text-base" style={{ color: "var(--ink)", opacity: 0.85 }}>
                <span style={{ color: "var(--forest)" }}><CalendarIcon /></span>
                <span>{event.date}{event.time ? ` · ${event.time}` : ""}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-3 text-base" style={{ color: "var(--ink)", opacity: 0.85 }}>
                <span style={{ color: "var(--forest)" }}><PinIcon /></span>
                <span>{event.location}</span>
              </div>
            )}
            {event.tickets && (
              <div className="flex items-center gap-3 text-base" style={{ color: "var(--ink)", opacity: 0.85 }}>
                <span style={{ color: "var(--forest)" }}><TicketIcon /></span>
                <span>{event.tickets}</span>
              </div>
            )}
            {event.website && (
              <div className="flex items-center gap-3 text-base" style={{ color: "var(--ink)", opacity: 0.85 }}>
                <span style={{ color: "var(--forest)" }}><GlobeIcon /></span>
                <a href={event.website} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-70 transition-opacity" style={{ color: "var(--forest)" }}>
                  {event.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            {event.location ? (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-colors"
                style={{ backgroundColor: "var(--leaf)" }}
                onMouseEnter={(ev) => { ev.currentTarget.style.backgroundColor = "var(--sage)"; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.backgroundColor = "var(--leaf)"; }}
              >
                <PinIcon /> Get Directions
              </a>
            ) : null}
            {event.website ? (
              <a
                href={event.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors"
                style={{ backgroundColor: "var(--sand)", color: "var(--forest)", border: "2px solid var(--forest)" }}
                onMouseEnter={(ev) => { ev.currentTarget.style.backgroundColor = "var(--forest)"; ev.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.backgroundColor = "var(--sand)"; ev.currentTarget.style.color = "var(--forest)"; }}
              >
                <GlobeIcon /> Visit Website
              </a>
            ) : null}
          </div>

          {/* Standfirst */}
          {event.standfirst && (
            <p className="text-lg md:text-xl italic leading-relaxed mb-6" style={{ color: "var(--ink)", opacity: 0.8 }}>
              {event.standfirst}
            </p>
          )}

          <div className="h-px mb-6" style={{ backgroundColor: "rgba(28,46,56,0.12)" }} />

          {/* Body */}
          <article className="flex flex-col gap-5">
            {event.body.map((b, i) => (
              <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.85 }}>
                {b.lead && <strong style={{ color: "var(--forest)" }}>{b.lead} </strong>}
                {b.text}
              </p>
            ))}
          </article>
        </div>
      </section>

      {/* More events */}
      <section className="pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "var(--forest)" }}>More What's On</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allEvents.filter((e) => e.slug !== event.slug).slice(0, 3).map((e) => (
              <Link
                key={e.slug}
                to={`/event/${e.slug}`}
                className="group bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={e.image} alt={e.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "var(--forest)" }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[e.category] || "var(--leaf)" }} />
                    {e.category}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 p-5">
                  <h3 className="font-bold text-base leading-snug" style={{ color: "var(--forest)" }}>{e.title}</h3>
                  <p className="text-xs" style={{ color: "var(--ink)", opacity: 0.55 }}>{e.date}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
