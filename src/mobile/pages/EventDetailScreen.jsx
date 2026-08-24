import { useParams, Navigate, Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import StickyCta, { TicketIcon } from "../components/StickyCta";
import useFetch from "../../hooks/useFetch";
import { getEventBySlug, getEvents } from "../../api";
import { categoryColors } from "../../Data/events";
import useMobileBack from "../hooks/useMobileBack";
import ShareButton from "../components/ShareButton";

export default function EventDetailScreen() {
  const { slug } = useParams();
  const { data: event, loading } = useFetch(() => getEventBySlug(slug), [slug]);
  const { data: events } = useFetch(getEvents, []);

  const goBack = useMobileBack("/mobile/whats-on");
  if (!loading && !event) return <Navigate to="/mobile/whats-on" replace />;
  if (loading || !event) return null;

  const dot = categoryColors[event.category] ?? "var(--leaf)";
  const gallery = event.gallery?.length ? event.gallery : [event.image];
  const websiteUrl = event.website ? `https://${event.website.replace(/^https?:\/\//, "")}` : null;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location ?? "")}`;
  const more = (events ?? []).filter((e) => e.slug !== event.slug).slice(0, 3);

  return (
    <MobileShell noPadding onBack={goBack}>
      <div className="flex flex-col">
        <div className="relative">
          <img src={gallery[0]} alt={event.title} className="w-full h-56 object-cover" />
        </div>

        <div className="px-5 pt-4 relative flex flex-col gap-4 pb-8 mobile-stagger">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5" style={{ color: dot }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
                {event.category}
              </span>
              <h1 className="text-2xl font-bold mt-1 leading-snug" style={{ color: "#000000" }}>{event.title}</h1>
            </div>
            <ShareButton path={`/event/${event.slug}`} title={event.title} text={event.standfirst} className="mt-0.5" />
          </div>

          <MobileCard className="p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              <span className="text-sm" style={{ color: "#000000" }}>{event.date}{event.time ? ` · ${event.time}` : ""}</span>
            </div>
            {event.tickets && (
              <div className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" /></svg>
                <span className="text-sm" style={{ color: "#000000" }}>{event.tickets}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                <span className="text-sm" style={{ color: "#000000" }}>{event.location}</span>
              </div>
            )}
          </MobileCard>

          {event.standfirst && (
            <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{event.standfirst}</p>
          )}

          {event.body?.map((b, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              {b.lead && <p className="text-sm font-bold" style={{ color: "#000000" }}>{b.lead}</p>}
              <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{b.text}</p>
            </div>
          ))}

          {gallery.length > 1 && (
            <div className="grid grid-cols-2 gap-2">
              {gallery.slice(1, 5).map((src, i) => (
                <img key={i} src={src} alt="" className="w-full aspect-square object-cover rounded-xl" />
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {event.location && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" data-skip-external-confirm className="text-center py-3 rounded-2xl text-sm font-bold active:opacity-80" style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}>
                Directions
              </a>
            )}
            {websiteUrl && (
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-center py-3 rounded-2xl text-sm font-bold active:opacity-80" style={{ backgroundColor: "rgba(28,46,56,0.06)", color: "#000000" }}>
                Buy Tickets
              </a>
            )}
          </div>

          {more.length > 0 && (
            <div className="mt-2">
              <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>More What's On</p>
              <div className="flex flex-col gap-3">
                {more.map((e) => (
                  <Link key={e.slug} to={`/mobile/event/${e.slug}`} className="flex items-stretch overflow-hidden bg-white active:opacity-90" style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}>
                    <img src={e.image} alt="" className="w-20 h-20 object-cover shrink-0" />
                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: categoryColors[e.category] ?? "var(--leaf)" }}>{e.category}</span>
                      <p className="text-sm font-bold truncate" style={{ color: "#000000" }}>{e.title}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#000000" }}>{e.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky ticket CTA — only when the event has a ticket/booking link. */}
      {websiteUrl && <StickyCta label="Buy a Ticket" href={websiteUrl} icon={<TicketIcon />} />}
    </MobileShell>
  );
}
