import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { exploreSections, exploreInfo } from "../data/mobileMock";

function BigCard({ link, height = "h-36" }) {
  const inner = (
    <>
      <img src={link.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,20,24,0) 30%, rgba(12,20,24,0.9) 100%)" }} />
      <div className="relative p-4">
        <p className="text-base font-bold text-white leading-tight">{link.title}</p>
        <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{link.blurb}</p>
      </div>
    </>
  );
  const className = `relative rounded-2xl overflow-hidden ${height} flex items-end active:scale-[0.98] transition-transform`;
  const style = { boxShadow: "0 12px 30px -14px rgba(28,46,56,0.6)" };
  return link.to
    ? <Link to={link.to} className={className} style={style}>{inner}</Link>
    : <a href={link.href} className={className} style={style}>{inner}</a>;
}

// Secondary destinations that no longer have their own bottom-nav tab.
const MORE_LINKS = [
  { label: "Neighbourhood Guides", to: "/mobile/guides" },
  { label: "What's On Calendar", to: "/mobile/whats-on" },
  { label: "Offers & News", to: "/mobile/offers" },
  { label: "About Maidenhead", to: "/mobile/about" },
  { label: "More", to: "/mobile/more" },
];

export default function ExploreScreen() {
  return (
    <MobileShell>
      <div className="flex flex-col gap-5 mobile-stagger">
        <div>
          <h1 className="section-heading text-2xl font-bold mb-1.5" style={{ color: "#000000" }}>Explore</h1>
          <p className="text-sm font-medium" style={{ color: "#000000" }}>Discover more about Maidenhead and plan your visit.</p>
        </div>

        <div>
          <p className="section-eyebrow mb-3" style={{ color: "var(--teal-deep)" }}>Featured</p>
          <div className="flex flex-col gap-4">
            <BigCard link={{ id: "the-future", title: "The Future", blurb: "Nicholson Quarter & the town's next chapter.", image: "/images/explore/street.jpg", to: "/mobile/explore/the-future" }} />
            <BigCard link={{ id: "guides", title: "Neighbourhood Guides", blurb: "Curated guides to the town.", image: "/images/eat-drink-hero-desktop.png", to: "/mobile/guides" }} />
          </div>
        </div>

        <div>
          <p className="section-eyebrow mb-3" style={{ color: "var(--teal-deep)" }}>All Sections</p>
          <div className="flex flex-col gap-4">
            {exploreSections.map((l) => <BigCard key={l.id} link={l} />)}
          </div>
        </div>

        <div>
          <p className="section-eyebrow mb-3" style={{ color: "var(--teal-deep)" }}>Practical Info</p>
          <div className="flex flex-col gap-4">
            {exploreInfo.map((l) => <BigCard key={l.id} link={l} />)}
          </div>
        </div>

        <div>
          <p className="section-eyebrow mb-3" style={{ color: "var(--teal-deep)" }}>More</p>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 10px 26px -14px rgba(28,46,56,0.5)" }}>
            {MORE_LINKS.map((m, i) => (
              <Link
                key={m.to}
                to={m.to}
                className="flex items-center gap-3 px-4 py-3.5 active:bg-black/[0.03]"
                style={i < MORE_LINKS.length - 1 ? { borderBottom: "1px solid rgba(28,46,56,0.1)" } : undefined}
              >
                <span className="flex-1 text-sm font-bold" style={{ color: "#000000" }}>{m.label}</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
