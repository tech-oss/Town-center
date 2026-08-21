import MobileShell from "../components/MobileShell";

// Ports the website's PressPage.jsx ("Work With Us & Enquiries") content
// natively.
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

export default function WorkWithUsScreen() {
  return (
    <MobileShell title="Work With Us" onBack backFallback="/mobile/explore" noPadding>
      <div className="flex flex-col">
        <div className="relative px-6 py-14 text-center overflow-hidden" style={{ backgroundColor: "var(--forest)" }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 90% 70% at 50% 120%, rgba(47,164,164,0.32) 0%, transparent 70%)" }}
          />
          <span className="relative section-eyebrow" style={{ color: "var(--sage)" }}>Get Involved</span>
          <h1 className="relative text-3xl font-bold leading-tight mt-3 text-white">Work With Us &amp; Enquiries</h1>
          <p className="relative text-sm leading-relaxed mt-3 text-white" style={{ opacity: 0.9 }}>
            Working on a story about Maidenhead? We're here to help.
          </p>
        </div>

        <div className="px-5 pt-6 pb-10 flex flex-col gap-7 mobile-stagger">
          <div className="flex flex-col gap-4">
            {introParagraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed" style={{ color: "#000000" }}>{p}</p>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {cards.map((c) => (
              <div key={c.title} className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 10px 26px -14px rgba(28,46,56,0.45)" }}>
                <h3 className="font-bold text-base mb-1.5" style={{ color: "#000000" }}>{c.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{c.body}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold leading-snug" style={{ color: "#000000" }}>
              For businesses to grow your presence and visibility
            </h2>
            {visibilityParagraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed" style={{ color: "#000000" }}>{p}</p>
            ))}
          </div>

          <div className="rounded-2xl p-6 flex flex-col gap-3" style={{ backgroundColor: "var(--forest)" }}>
            <h2 className="text-lg font-bold text-white">Get in touch</h2>
            <p className="text-sm leading-relaxed text-white" style={{ opacity: 0.9 }}>
              Email us with your enquiry and a few details, and we'll get back to you.
            </p>
            <a
              href="mailto:press@maidenhead.com"
              className="self-start px-5 py-3 rounded-full text-sm font-bold active:opacity-85"
              style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}
            >
              press@maidenhead.com
            </a>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
