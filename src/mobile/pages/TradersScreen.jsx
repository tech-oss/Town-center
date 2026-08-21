import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";

// Ports the website's TradersPage.jsx content natively.
const intro =
  "Our Trades & Business Directory is designed to celebrate and support the fantastic businesses, services, organisations, and events that make our community thrive.";

const paragraphs = [
  "This website provides a platform where local businesses and event organisers can showcase their services, share information, and connect with residents and visitors. Our aim is to make it easier for people to discover what is available in the local area while helping businesses raise their profile within the community.",
  "While we are proud to promote local businesses and events, it is important to understand that we act solely as a directory and promotional platform. The businesses, services, products, and events featured on this website are independently owned and operated by their respective providers.",
  "We do not manage, supervise, endorse, or guarantee the quality, availability, suitability, or performance of any business, service, product, or event listed on this site. Any enquiries, bookings, purchases, or agreements are made directly between users and the relevant business or organiser.",
  "We encourage users to carry out their own research and make informed decisions before engaging with any listed business or event.",
  "Thank you for supporting local businesses and helping our community grow.",
];

export default function TradersScreen() {
  return (
    <MobileShell title="Traders" onBack backFallback="/mobile/explore" noPadding>
      <div className="flex flex-col">
        <div className="relative px-6 py-14 text-center overflow-hidden" style={{ backgroundColor: "var(--forest)" }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 90% 70% at 50% 120%, rgba(47,164,164,0.32) 0%, transparent 70%)" }}
          />
          <span className="relative section-eyebrow" style={{ color: "var(--sage)" }}>About</span>
          <h1 className="relative text-2xl font-bold leading-tight mt-3 text-white">Our Trades &amp; Business Directory</h1>
          <p className="relative text-sm leading-relaxed mt-3 text-white" style={{ opacity: 0.9 }}>{intro}</p>
        </div>

        <div className="px-5 pt-6 pb-10 flex flex-col gap-6 mobile-stagger">
          <div className="flex flex-col gap-4">
            {paragraphs.map((p, i) => {
              const isDirectory = p.startsWith("While we are proud");
              return (
                <p
                  key={i}
                  className="text-sm leading-relaxed"
                  style={{ color: isDirectory ? "var(--forest)" : "#000000", fontWeight: isDirectory ? 600 : 400, fontStyle: isDirectory ? "italic" : "normal" }}
                >
                  {p}
                </p>
              );
            })}
          </div>

          <div className="rounded-2xl p-6 flex flex-col gap-3" style={{ backgroundColor: "var(--forest)" }}>
            <h2 className="text-lg font-bold text-white">List your business or event</h2>
            <p className="text-sm leading-relaxed text-white" style={{ opacity: 0.9 }}>
              Run a local business or organise events? Get in touch to feature on the directory.
            </p>
            <Link
              to="/mobile/work-with-us"
              className="self-start px-5 py-3 rounded-full text-sm font-bold active:opacity-85"
              style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}
            >
              Work with us &amp; enquiries
            </Link>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
