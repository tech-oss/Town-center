import { Link } from "react-router-dom";
import { useEffect } from "react";

const intro =
  "Our Trades & Business Directory is designed to celebrate and support the fantastic businesses, services, organisations, and events that make our community thrive.";

const paragraphs = [
  "This website provides a platform where local businesses and event organisers can showcase their services, share information, and connect with residents and visitors. Our aim is to make it easier for people to discover what is available in the local area while helping businesses raise their profile within the community.",
  "While we are proud to promote local businesses and events, it is important to understand that we act solely as a directory and promotional platform. The businesses, services, products, and events featured on this website are independently owned and operated by their respective providers.",
  "We do not manage, supervise, endorse, or guarantee the quality, availability, suitability, or performance of any business, service, product, or event listed on this site. Any enquiries, bookings, purchases, or agreements are made directly between users and the relevant business or organiser.",
  "We encourage users to carry out their own research and make informed decisions before engaging with any listed business or event.",
  "Thank you for supporting local businesses and helping our community grow.",
];

export default function TradersPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ backgroundColor: "var(--sand)", minHeight: "100vh" }}>
      {/* Hero band */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-32 overflow-hidden"
        style={{ backgroundColor: "var(--forest)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(47,164,164,0.28) 0%, transparent 70%)",
          }}
        />
        <span className="relative text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--sage)" }}>
          About
        </span>
        <h1 className="relative text-4xl md:text-6xl font-bold leading-tight mb-6 text-white">
          Our Trades & Business Directory
        </h1>
        <p className="relative text-base md:text-lg max-w-2xl leading-relaxed" style={{ color: "var(--mint)" }}>
          {intro}
        </p>
      </section>

      {/* Body */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-10 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>Traders</span>
          </nav>

          <div className="flex flex-col gap-7">
            {paragraphs.map((p, i) => {
              const isDirectory = p.startsWith("While we are proud");
              return (
                <p
                  key={i}
                  className={`text-base md:text-lg leading-relaxed ${isDirectory ? "italic" : ""}`}
                  style={{
                    color: isDirectory ? "var(--forest)" : "var(--ink)",
                    opacity: isDirectory ? 1 : 0.82,
                    fontWeight: isDirectory ? 500 : undefined,
                  }}
                >
                  {p}
                </p>
              );
            })}
          </div>

          {/* CTA card */}
          <div
            className="mt-16 rounded-3xl p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6"
            style={{ backgroundColor: "var(--forest)", color: "white" }}
          >
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold mb-2">List your business or event</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--mint)" }}>
                Run a local business or organise events? Get in touch to feature on the directory.
              </p>
            </div>
            <Link
              to="/work-with-us"
              className="shrink-0 px-7 py-3.5 rounded-full font-semibold text-sm transition-colors"
              style={{ backgroundColor: "var(--leaf)", color: "white" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
            >
              Work with us & enquiries
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
