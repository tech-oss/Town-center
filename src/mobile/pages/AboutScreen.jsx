import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import useMobileBack from "../hooks/useMobileBack";
import { aboutPage, aboutStats } from "../data/mobileMock";

export default function AboutScreen() {
  const goBack = useMobileBack("/mobile/explore");
  return (
    <MobileShell noPadding onBack={goBack}>
      <div className="flex flex-col">
        <div className="relative">
          <img src={aboutPage.image} alt="" className="w-full h-52 object-cover" />
        </div>

        <div className="px-5 pt-5 flex flex-col gap-6 pb-6 mobile-stagger">
          <h1 className="section-heading text-2xl font-bold" style={{ color: "#000000" }}>{aboutPage.title}</h1>
          <p className="text-sm leading-relaxed -mt-3" style={{ color: "rgba(0,0,0,0.7)" }}>{aboutPage.body}</p>

          <div className="grid grid-cols-3 gap-3">
            {aboutStats.map((s) => (
              <div key={s.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "rgba(28,46,56,0.045)" }}>
                <p className="text-xl font-bold" style={{ color: "var(--leaf)" }}>{s.value}</p>
                <p className="text-[10px] mt-1 leading-tight" style={{ color: "rgba(0,0,0,0.6)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          <Link to="/mobile/explore" className="w-full text-center py-3.5 rounded-2xl text-sm font-bold active:opacity-80" style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}>
            Explore Maidenhead
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}
