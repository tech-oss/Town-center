// Sections only an accommodation property's page has: its rooms, and the
// MANAGED BY panel naming the company that runs it. Styled to match the
// stay page's other sections (Availability & Check-in, amenities).
import SocialIcon from "./SocialIcon";
import { SOCIAL_NAMES } from "../lib/socialNames";

// A website typed without its scheme still opens (same rule as
// PlaceDetailLayout's links).
function normalizeUrl(url) {
  const u = typeof url === "string" ? url.trim() : "";
  if (!u) return null;
  return u.startsWith("http") ? u : `https://${u}`;
}

// One card per room type: name, how many it sleeps, beds, a short
// description and its room amenities. Paid properties only — a free
// property's rooms are withheld by the database.
export function RoomsSection({ rooms }) {
  const list = (rooms ?? []).filter((r) => r?.name?.trim());
  if (!list.length) return null;
  return (
    <section className="py-14 md:py-16 px-6 md:px-12" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-5xl mx-auto">
        <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>Where You'll Sleep</p>
        <h2 className="hero-title uppercase text-3xl md:text-4xl mb-8" style={{ color: "#000000" }}>Rooms</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {list.map((r, i) => {
            const facts = [
              r.sleeps ? `Sleeps ${r.sleeps}` : null,
              r.beds?.trim() || null,
            ].filter(Boolean);
            return (
              <div key={`${r.name}-${i}`} className="bg-white rounded-2xl p-5 flex flex-col gap-2"
                style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.25)" }}>
                <h3 className="font-bold text-lg" style={{ color: "#000000" }}>{r.name}</h3>
                {facts.length > 0 && (
                  <p className="text-sm font-semibold" style={{ color: "var(--leaf)" }}>{facts.join(" · ")}</p>
                )}
                {r.description?.trim() && (
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(0,0,0,0.7)" }}>{r.description}</p>
                )}
                {r.amenities?.length > 0 && (
                  <ul className="flex flex-wrap gap-2 mt-1">
                    {r.amenities.map((a) => (
                      <li key={a} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: "var(--mint)", color: "#000000" }}>{a}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// The company that manages the property: its logo, name, address and public
// contact details. Shown on free and paid properties alike.
export function ManagedBySection({ company }) {
  if (!company?.name) return null;
  const website = company.website ? normalizeUrl(company.website) : null;
  const socials = Object.entries(company.social ?? {}).filter(([, url]) => url);
  return (
    <section className="py-14 md:py-16 px-6 md:px-12" style={{ backgroundColor: "var(--mint)" }}>
      <div className="max-w-5xl mx-auto">
        <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>Managed By</p>
        <div className="bg-white rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-start"
          style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.25)" }}>
          {company.logo && (
            <img src={company.logo} alt={`${company.name} logo`} loading="lazy"
              className="w-24 h-24 rounded-xl object-contain shrink-0" style={{ border: "1px solid rgba(28,46,56,0.1)" }} />
          )}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <h2 className="hero-title uppercase text-2xl md:text-3xl" style={{ color: "#000000" }}>{company.name}</h2>
            {company.address && <p className="text-base" style={{ color: "rgba(0,0,0,0.75)" }}>{company.address}</p>}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
              {company.phone && <a href={`tel:${company.phone.replace(/\s+/g, "")}`} style={{ color: "var(--leaf)" }}>{company.phone}</a>}
              {company.email && <a href={`mailto:${company.email}`} style={{ color: "var(--leaf)" }}>{company.email}</a>}
              {website && <a href={website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--leaf)" }}>{company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a>}
            </div>
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {/* Each network's logo, not its name. */}
                {socials.map(([k, url]) => (
                  <a key={k} href={normalizeUrl(url)} target="_blank" rel="noopener noreferrer"
                    aria-label={`${company.name} on ${SOCIAL_NAMES[k] ?? k}`} title={SOCIAL_NAMES[k] ?? k}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}>
                    <SocialIcon name={k} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
