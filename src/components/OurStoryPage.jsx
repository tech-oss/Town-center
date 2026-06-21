import { Link } from "react-router-dom";

const paragraphs = [
  "Maidenhead.com is a privately run, independent platform created to help people discover and connect with everything happening in Maidenhead.",
  "Our goal is simple: to showcase the best of the town — from local businesses and restaurants to events, activities, jobs, and places to live. We aim to make it easier for residents and visitors to find out what's on, what's new, and what's worth exploring.",
  "This website is not affiliated with, endorsed by, or operated by the Royal Borough of Windsor & Maidenhead Council. It is an independent project built, maintained, and updated by a private team with a focus on supporting and promoting the local community.",
  "We believe Maidenhead has a lot to offer, and we want to make that more visible in one simple, easy-to-use place.",
  "If you run a local business, organise events, or want to contribute content, we'd love to hear from you. Our aim is to keep the platform up to date, useful, and genuinely helpful for the town.",
  "Thanks for visiting — and welcome to Maidenhead.",
];

export default function OurStoryPage() {
  return (
    <div style={{ backgroundColor: "var(--sand)", minHeight: "100vh" }}>
      {/* Hero band */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-28 md:py-36 overflow-hidden"
        style={{ backgroundColor: "var(--forest)" }}
      >
        {/* subtle teal glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(47,164,164,0.28) 0%, transparent 70%)",
          }}
        />
        <span
          className="relative text-xs font-bold uppercase tracking-widest mb-4"
          style={{ color: "var(--sage)" }}
        >
          About Us
        </span>
        <h1
          className="relative text-4xl md:text-6xl font-bold leading-tight mb-6 text-white"
        >
          Our Story
        </h1>
        <p
          className="relative text-base md:text-lg max-w-xl leading-relaxed"
          style={{ color: "var(--mint)" }}
        >
          An independent platform built to celebrate and connect the best of Maidenhead.
        </p>
      </section>

      {/* Body */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-10 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>Our Story</span>
          </nav>

          <div className="flex flex-col gap-7">
            {paragraphs.map((p, i) => {
              const isDisclaimer = p.includes("not affiliated");
              return (
                <p
                  key={i}
                  className={`text-base md:text-lg leading-relaxed ${isDisclaimer ? "italic" : ""}`}
                  style={{
                    color: isDisclaimer ? "var(--forest)" : "var(--ink)",
                    opacity: isDisclaimer ? 1 : 0.82,
                    fontWeight: isDisclaimer ? 500 : undefined,
                  }}
                >
                  {isDisclaimer ? (
                    <>
                      This website is{" "}
                      <strong>not affiliated with, endorsed by, or operated by the Royal Borough of Windsor &amp; Maidenhead Council</strong>
                      . It is an independent project built, maintained, and updated by a private team with a focus on supporting and promoting the local community.
                    </>
                  ) : p}
                </p>
              );
            })}
          </div>

          {/* CTA */}
          <div
            className="mt-16 rounded-3xl p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6"
            style={{ backgroundColor: "var(--forest)", color: "white" }}
          >
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Want to get involved?</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--mint)" }}>
                If you run a local business, organise events, or want to contribute content, we'd love to hear from you.
              </p>
            </div>
            <a
              href="mailto:hello@maidenhead.com"
              className="shrink-0 px-7 py-3.5 rounded-full font-semibold text-sm transition-colors"
              style={{ backgroundColor: "var(--leaf)", color: "white" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
            >
              Get in touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
