import { useParams, Navigate, Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import ActionButton from "../components/ActionButton";
import PhotoGallery from "../components/PhotoGallery";
import MiniMap from "../components/MiniMap";
import useFetch from "../../hooks/useFetch";
import { getWorkplaceDevelopments, getWorkplaceDevelopmentBySlug } from "../../api";
import useMobileBack from "../hooks/useMobileBack";

const modeIcon = (mode) => ({ walk: "🚶", train: "🚂", car: "🚗" }[mode] ?? "📍");

// Same content as the website's WorkplaceDevelopmentsPage.jsx — hero, quick
// stats, about, gallery, features, connectivity, contact and map — laid out
// as one long scroll in the app's own visual language rather than the
// website's section-band layout, but nothing dropped.
export default function WorkplaceDevelopmentScreen() {
  const { slug } = useParams();
  const goBack = useMobileBack("/mobile/work");
  const { data: b, loading } = useFetch(() => getWorkplaceDevelopmentBySlug(slug), [slug]);
  const { data: developments } = useFetch(getWorkplaceDevelopments, []);

  if (!loading && !b) return <Navigate to="/mobile/work" replace />;
  if (loading || !b) return null;

  const others = (developments ?? []).filter((x) => x.slug !== b.slug);
  const gallery = (b.gallery?.length ? b.gallery : [b.hero]).filter((g) => g !== b.hero);

  return (
    <MobileShell noPadding onBack={goBack}>
      <div className="flex flex-col">
        <div className="relative">
          <img src={b.hero} alt={b.name} className="w-full h-56 object-cover" />
        </div>

        <div className="px-5 pt-4 relative flex flex-col gap-4 pb-8 mobile-stagger">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{b.developer}</span>
            <h1 className="text-2xl font-bold mt-1 leading-snug" style={{ color: "#000000" }}>{b.name}</h1>
            {b.tagline && <p className="text-sm mt-1" style={{ color: "#000000" }}>{b.tagline}</p>}
          </div>

          {b.quickStats?.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5">
              {b.quickStats.map((s) => (
                <MobileCard key={s.label} className="p-3 flex items-center gap-2.5">
                  <span className="text-xl leading-none shrink-0">{s.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wide leading-none mb-1" style={{ color: "var(--leaf)" }}>{s.label}</p>
                    <p className="text-xs font-bold leading-snug truncate" style={{ color: "#000000" }}>{s.value}</p>
                  </div>
                </MobileCard>
              ))}
            </div>
          )}

          <div>
            <p className="section-eyebrow mb-2.5" style={{ color: "var(--teal-deep)" }}>About the Development</p>
            <div className="flex flex-col gap-3">
              {(b.longDescription?.length ? b.longDescription : [b.description]).map((para, i) => (
                <p key={i} className="text-sm leading-relaxed" style={{ color: "#000000" }}>{para}</p>
              ))}
            </div>
          </div>

          {/* Action rail — same design as every other business/stay/
              development profile in the app. */}
          <MobileCard className="p-4 flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              {b.website && (
                <ActionButton
                  href={b.website}
                  label="Website"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" /></svg>}
                />
              )}
              {b.email && (
                <ActionButton
                  href={`mailto:${b.email}`}
                  label="Email"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>}
                />
              )}
              {b.phone && (
                <ActionButton
                  href={`tel:${b.phone.replace(/\s/g, "")}`}
                  label="Call"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>}
                />
              )}
            </div>
            {(b.email || b.phone) && (
              <div className="flex flex-col gap-2.5 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                {b.email && (
                  <div className="flex items-start gap-3 text-sm break-all" style={{ color: "#000000" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                    {b.email}
                  </div>
                )}
                {b.phone && (
                  <div className="flex items-start gap-3 text-sm" style={{ color: "#000000" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>
                    {b.phone}
                  </div>
                )}
              </div>
            )}
          </MobileCard>

          <PhotoGallery images={gallery} title={b.name} />

          {b.amenities?.length > 0 && (
            <div>
              <p className="section-eyebrow mb-2.5" style={{ color: "var(--teal-deep)" }}>Features</p>
              <div className="grid grid-cols-2 gap-2.5">
                {b.amenities.map((a) => {
                  const icon = typeof a === "object" ? a.icon : "✓";
                  const text = typeof a === "object" ? a.text : a;
                  return (
                    <MobileCard key={text} className="p-3 flex items-start gap-2.5">
                      <span className="text-lg leading-none shrink-0 mt-0.5">{icon}</span>
                      <span className="text-xs font-medium leading-snug" style={{ color: "#000000" }}>{text}</span>
                    </MobileCard>
                  );
                })}
              </div>
            </div>
          )}

          {b.nearbyPlaces?.length > 0 && (
            <div>
              <p className="section-eyebrow mb-2.5" style={{ color: "var(--teal-deep)" }}>Getting Around</p>
              <div className="flex flex-col gap-2.5">
                {b.nearbyPlaces.map((place) => (
                  <MobileCard key={place.name} className="p-3.5 flex items-center gap-3.5">
                    <span className="text-xl shrink-0">{modeIcon(place.mode)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: "#000000" }}>{place.name}</p>
                      <p className="text-xs mt-0.5 font-semibold" style={{ color: "var(--leaf)" }}>{place.distance}</p>
                    </div>
                  </MobileCard>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="section-eyebrow mb-2.5" style={{ color: "var(--teal-deep)" }}>Location</p>
            <MiniMap query={b.location} lat={b.lat} lng={b.lng} />
          </div>

          {others.length > 0 && (
            <div className="mt-2">
              <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>More Developments</p>
              <div className="flex flex-col gap-3">
                {others.map((x) => (
                  <Link key={x.slug} to={`/mobile/work/developments/${x.slug}`} className="flex items-stretch overflow-hidden bg-white active:opacity-90" style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}>
                    <img src={x.image} alt="" className="w-20 h-20 object-cover shrink-0" />
                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{x.developer}</span>
                      <p className="text-sm font-bold truncate" style={{ color: "#000000" }}>{x.name}</p>
                      <span className="inline-flex items-center gap-0.5 self-start text-[10px] font-bold mt-0.5" style={{ color: "var(--leaf)" }}>
                        Read more
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
