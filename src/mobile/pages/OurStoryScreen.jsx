import MobileShell from "../components/MobileShell";

// Ports the website's OurStoryPage.jsx content verbatim — same copy, same
// "not affiliated with the council" disclaimer styling — into a native
// mobile layout: a dark hero band (no image on desktop either) instead of a
// full-bleed photo hero, plain stacked paragraphs, and a bottom CTA card.
const paragraphs = [
  "Maidenhead.com is a privately run, independent platform created to help people discover and connect with everything happening in Maidenhead.",
  "Our goal is simple: to showcase the best of the town — from local businesses and restaurants to events, activities, jobs, and places to live. We aim to make it easier for residents and visitors to find out what's on, what's new, and what's worth exploring.",
  "This website is not affiliated with, endorsed by, or operated by the Royal Borough of Windsor & Maidenhead Council. It is an independent project built, maintained, and updated by a private team with a focus on supporting and promoting the local community.",
  "We believe Maidenhead has a lot to offer, and we want to make that more visible in one simple, easy-to-use place.",
  "If you run a local business, organise events, or want to contribute content, we'd love to hear from you. Our aim is to keep the platform up to date, useful, and genuinely helpful for the town.",
  "Thanks for visiting — and welcome to Maidenhead.",
];

export default function OurStoryScreen() {
  return (
    <MobileShell title="Our Story" onBack backFallback="/mobile/explore" noPadding>
      <div className="flex flex-col">
        <div className="relative px-6 py-14 text-center overflow-hidden" style={{ backgroundColor: "var(--forest)" }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 90% 70% at 50% 120%, rgba(47,164,164,0.32) 0%, transparent 70%)" }}
          />
          <span className="relative section-eyebrow" style={{ color: "var(--sage)" }}>About Us</span>
          <h1 className="relative text-3xl font-bold leading-tight mt-3 text-white">Our Story</h1>
          <p className="relative text-sm leading-relaxed mt-3 text-white" style={{ opacity: 0.9 }}>
            An independent platform built to celebrate and connect the best of Maidenhead.
          </p>
        </div>

        <div className="px-5 pt-6 pb-10 flex flex-col gap-6 mobile-stagger">
          <div className="flex flex-col gap-4">
            {paragraphs.map((p, i) => {
              const isDisclaimer = p.includes("not affiliated");
              return (
                <p
                  key={i}
                  className="text-sm leading-relaxed"
                  style={{ color: isDisclaimer ? "var(--forest)" : "#000000", fontWeight: isDisclaimer ? 600 : 400, fontStyle: isDisclaimer ? "italic" : "normal" }}
                >
                  {p}
                </p>
              );
            })}
          </div>

          <div className="rounded-2xl p-6 flex flex-col gap-3" style={{ backgroundColor: "var(--forest)" }}>
            <h2 className="text-lg font-bold text-white">Want to get involved?</h2>
            <p className="text-sm leading-relaxed text-white" style={{ opacity: 0.9 }}>
              If you run a local business, organise events, or want to contribute content, we'd love to hear from you.
            </p>
            <a
              href="mailto:hello@maidenhead.com"
              className="self-start px-5 py-3 rounded-full text-sm font-bold active:opacity-85"
              style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}
            >
              Get in touch
            </a>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
