import { Link } from "react-router-dom";
import { useEffect } from "react";

const introParagraphs = [
  "Maidenhead.com is an independent platform celebrating everything happening across Maidenhead town centre — from local businesses, restaurants and shops to events, activities and the town's ongoing regeneration.",
  "We welcome enquiries from journalists, bloggers, content creators and local media. Whether you're writing about Maidenhead's independent businesses, the Nicholson Quarter regeneration, or the town's growing food, retail and events scene, we're happy to help with information, interviews and introductions.",
];

const cards = [
  {
    title: "Media Enquiries",
    body: "For interviews, quotes, data or comment about Maidenhead town centre and the businesses featured on the platform, get in touch and we'll respond as quickly as we can.",
  },
  {
    title: "Partnerships",
    body: "We collaborate with local organisations, event organisers and businesses to promote the best of Maidenhead. If you'd like to work with us, we'd love to hear your ideas.",
  },
];

const visibilityParagraphs = [
  "This platform with its web and app, helps connect local businesses, organisations, community groups and stakeholders with people who live, work and visit the area.",
  "By creating a profile, you can showcase your services, opening hours, contact details, events and key information in one easy-to-find place. This gives residents and visitors a simple way to discover what you offer and stay connected with what's happening locally.",
  "For organisations looking for greater visibility, enhanced profile options are available. These can include featured listings, business spotlights, news updates, special offers, featured articles and other promotional opportunities designed to help you reach a wider audience.",
  "Businesses can also benefit from in-app notifications, allowing important updates, events, offers and announcements to be delivered directly to users who are interested in local information and activities.",
  "Our aim is to provide a useful platform that helps strengthen connections between local businesses, community organisations and the people they serve.",
  "If you would like to learn more about creating a profile or the additional visibility options available, please contact us for further details.",
];

export default function PressPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ backgroundColor: "var(--sand)", minHeight: "100vh" }}>
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
          Get Involved
        </span>
        <h1 className="relative text-4xl md:text-6xl font-bold leading-tight mb-6 text-white">Work With Us &amp; Enquiries</h1>
        <p className="relative text-base md:text-lg max-w-xl leading-relaxed" style={{ color: "var(--mint)" }}>
          Working on a story about Maidenhead? We're here to help.
        </p>
      </section>

      <section className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <nav className="mb-10 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>Work With Us &amp; Enquiries</span>
          </nav>

          <div className="flex flex-col gap-6 mb-12">
            {introParagraphs.map((p, i) => (
              <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.82 }}>{p}</p>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-14">
            {cards.map((c) => (
              <div key={c.title} className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 6px 28px -16px rgba(28,46,56,0.28)" }}>
                <h3 className="font-bold text-lg mb-2" style={{ color: "var(--forest)" }}>{c.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink)", opacity: 0.78 }}>{c.body}</p>
              </div>
            ))}
          </div>

          {/* Grow your presence section */}
          <div className="mb-14">
            <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "var(--forest)" }}>
              For businesses to grow your presence and visibility
            </h2>
            <div className="flex flex-col gap-5">
              {visibilityParagraphs.map((p, i) => (
                <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.82 }}>{p}</p>
              ))}
            </div>
          </div>

          {/* Contact CTA */}
          <div
            className="rounded-3xl p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6"
            style={{ backgroundColor: "var(--forest)", color: "white" }}
          >
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Get in touch</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--mint)" }}>
                Email us with your enquiry and a few details, and we'll get back to you.
              </p>
            </div>
            <a
              href="mailto:press@maidenhead.com"
              className="shrink-0 px-7 py-3.5 rounded-full font-semibold text-sm transition-colors"
              style={{ backgroundColor: "var(--leaf)", color: "white" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
            >
              press@maidenhead.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
