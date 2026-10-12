// Everything an accommodation company entered for a new property, laid out
// for a first-approval review: the property is approved as a whole, so admin
// sees all of it at once rather than section by section.

const MUTED = "#6B7280", INK = "#1E293B", FAINT = "#9CA3AF", LINE = "rgba(16,24,40,0.1)";

// Pictures carry a focal point after "#" for the public site's cropping.
const src = (u) => (typeof u === "string" ? u.split("#")[0] : u);

function Section({ title, children, note }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: FAINT }}>{title}</h3>
        {note && <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>{note}</p>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, href }) {
  const empty = value == null || value === "" || (Array.isArray(value) && !value.length);
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: FAINT }}>{label}</span>
      {empty
        ? <span className="text-sm italic" style={{ color: FAINT }}>Not provided</span>
        : href
          ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium break-words hover:underline" style={{ color: "#2563EB" }}>{value}</a>
          : <span className="text-sm font-medium break-words whitespace-pre-line" style={{ color: INK }}>{value}</span>}
    </div>
  );
}

function Chips({ items }) {
  if (!items?.length) return <span className="text-sm italic" style={{ color: FAINT }}>None ticked</span>;
  return (
    <div className="flex gap-1.5 flex-wrap">
      {items.map((a) => <span key={a} className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(16,24,40,0.07)", color: INK }}>{a}</span>)}
    </div>
  );
}

const hr = <hr style={{ borderColor: LINE }} />;

export default function PropertyReviewDetail({ detail }) {
  const { property: p, company, plan, paid } = detail;
  const coords = p.lat && p.lng ? `${p.lat}, ${p.lng}` : null;
  const ownContact = p.contactSource === "own";
  const social = Object.entries(p.social ?? {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");

  return (
    <>
      <Section title="Company">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center overflow-hidden" style={{ border: `1px solid ${LINE}`, backgroundColor: "#F8FAFC" }}>
            {company.logo ? <img src={src(company.logo)} alt="" className="w-full h-full object-contain" /> : <span aria-hidden>🏢</span>}
          </div>
          <div className="grid sm:grid-cols-3 gap-3 flex-1">
            <Row label="Managed by" value={company.name} />
            <Row label="Plan" value={plan} />
            <Row label="Company profile" value={company.profileStatus === "Up to Date" ? "Approved" : company.profileStatus ?? "Not set up yet"} />
          </div>
        </div>
        {!paid && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(217,119,6,0.08)", color: "#92400E" }}>
            Free plan: only the property's name, address and map pin go public, with the company's details. Anything else below stays hidden until the company upgrades.
          </p>
        )}
      </Section>
      {hr}

      <Section title="Property">
        {p.heroImage
          ? <img src={src(p.heroImage)} alt="" className="w-full max-h-72 rounded-xl object-cover" style={{ border: `1px solid ${LINE}` }} />
          : <span className="text-sm italic" style={{ color: FAINT }}>No header picture</span>}
        <div className="grid sm:grid-cols-2 gap-4">
          <Row label="Property name" value={p.name} />
          <Row label="Headline / tagline" value={p.tagline} />
        </div>
        <Row label="Description" value={p.description} />
      </Section>
      {hr}

      <Section title="Location" note="The address and pin decide where the property appears on the map.">
        <div className="grid sm:grid-cols-3 gap-4">
          <Row label="Address" value={p.address} />
          <Row label="Postcode" value={p.postalCode} />
          <Row label="Map pin" value={coords} href={coords ? `https://www.google.com/maps?q=${encodeURIComponent(coords)}` : null} />
        </div>
      </Section>
      {hr}

      <Section title="Contact & booking">
        <Row label="Contact details shown" value={ownContact ? "The property's own" : "The company's"} />
        {ownContact && (
          <div className="grid sm:grid-cols-3 gap-4">
            <Row label="Phone" value={p.phone} />
            <Row label="Email" value={p.email} />
            <Row label="Website" value={p.website} href={p.website || null} />
            <Row label="Social links" value={social} />
          </div>
        )}
        <Row label="Booking link" value={p.bookingUrl} href={p.bookingUrl || null} />
      </Section>
      {hr}

      <Section title={`Photos (${p.gallery.length})`}>
        {p.gallery.length
          ? <div className="flex gap-2 flex-wrap">{p.gallery.map((g, i) => <a key={i} href={src(g)} target="_blank" rel="noopener noreferrer"><img src={src(g)} alt="" className="w-28 h-24 rounded-lg object-cover" style={{ border: `1px solid ${LINE}` }} /></a>)}</div>
          : <span className="text-sm italic" style={{ color: FAINT }}>No photos</span>}
      </Section>
      {hr}

      <Section title="Check-in">
        <div className="grid sm:grid-cols-2 gap-4">
          <Row label="Check-in" value={p.checkIn} />
          <Row label="Check-out" value={p.checkOut} />
          <Row label="Early check-in" value={p.earlyCheckin ? "Offered" : "Not offered"} />
          <Row label="Late check-out" value={p.lateCheckout ? "Offered" : "Not offered"} />
        </div>
        <Row label="About arriving" value={p.availabilityInfo} />
      </Section>
      {hr}

      <Section title="Amenities">
        {p.starRating ? <Row label="Star rating" value={`${p.starRating} star${p.starRating === 1 ? "" : "s"}`} /> : null}
        <Chips items={p.amenities} />
      </Section>
      {hr}

      <Section title={`Rooms (${p.rooms.length})`}>
        {p.rooms.length ? (
          <div className="flex flex-col gap-3">
            {p.rooms.map((r, i) => (
              <div key={i} className="rounded-xl p-3 flex flex-col gap-2" style={{ border: `1px solid ${LINE}` }}>
                <div className="grid sm:grid-cols-3 gap-3">
                  <Row label="Room" value={r.name} />
                  <Row label="Sleeps" value={r.sleeps === "" ? null : r.sleeps} />
                  <Row label="Beds" value={r.beds} />
                </div>
                {r.description && <Row label="Description" value={r.description} />}
                <Chips items={r.amenities} />
              </div>
            ))}
          </div>
        ) : <span className="text-sm italic" style={{ color: FAINT }}>No rooms added</span>}
      </Section>
      {hr}

      <Section title={`FAQs (${p.faqs.length})`}>
        {p.faqs.length ? (
          <div className="flex flex-col gap-2">
            {p.faqs.map((f, i) => (
              <div key={i} className="text-sm" style={{ color: INK }}>
                <p className="font-semibold">{f.q ?? f.question}</p>
                <p style={{ color: MUTED }}>{f.a ?? f.answer}</p>
              </div>
            ))}
          </div>
        ) : <span className="text-sm italic" style={{ color: FAINT }}>No FAQs</span>}
      </Section>
    </>
  );
}
