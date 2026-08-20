import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { exploreSections, exploreInfo } from "../data/mobileMock";

function BigCard({ link }) {
  const inner = (
    <>
      <img src={link.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,20,24,0) 30%, rgba(12,20,24,0.9) 100%)" }} />
      <div className="relative p-4">
        <p className="text-base font-bold text-white">{link.title}</p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>{link.blurb}</p>
      </div>
    </>
  );
  const className = "relative rounded-2xl overflow-hidden h-32 flex items-end active:scale-[0.98] transition-transform";
  const style = { boxShadow: "0 8px 24px -8px rgba(0,0,0,0.4)" };
  return link.to
    ? <Link to={link.to} className={className} style={style}>{inner}</Link>
    : <a href={link.href} className={className} style={style}>{inner}</a>;
}

export default function ExploreScreen() {
  return (
    <MobileShell>
      <div className="flex flex-col gap-5 mobile-stagger">
        <div>
          <h1 className="section-heading text-2xl font-bold mb-1.5" style={{ color: "#000000" }}>Explore</h1>
          <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>Discover more about Maidenhead and plan your visit.</p>
        </div>

        <p className="section-eyebrow" style={{ color: "var(--leaf)" }}>Explore</p>
        <div className="flex flex-col gap-4">
          <BigCard link={{ id: "the-future", title: "The Future", blurb: "Nicholson Quarter & the town's next chapter.", image: "/images/explore/street.jpg", href: "/explore/the-future" }} />
          <BigCard link={{ id: "guides", title: "Neighbourhood Guides", blurb: "Curated guides to the town.", image: "/images/eat-drink-hero-desktop.png", to: "/mobile/guides" }} />
        </div>

        <p className="section-eyebrow mt-1" style={{ color: "var(--leaf)" }}>All Sections</p>
        <div className="flex flex-col gap-4">
          {exploreSections.map((l) => <BigCard key={l.id} link={l} />)}
        </div>

        <p className="section-eyebrow mt-1" style={{ color: "var(--leaf)" }}>Plan</p>
        <div className="flex flex-col gap-4">
          {exploreInfo.map((l) => <BigCard key={l.id} link={l} />)}
        </div>
      </div>
    </MobileShell>
  );
}
