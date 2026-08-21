import MobileShell from "../components/MobileShell";
import useTapReveal from "../../hooks/useTapReveal";
import useMobileBack from "../hooks/useMobileBack";
import { explore } from "../../Data/explore";

function FeatureImage({ image, alt }) {
  const { revealed, onImageClick } = useTapReveal();
  return (
    <div onClick={onImageClick} className={`spotlight-card relative overflow-hidden aspect-[4/3] ${revealed ? "is-revealed" : ""}`}>
      <img src={image} alt="" aria-hidden="true" loading="lazy" className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover" />
      <img src={image} alt={alt} loading="lazy" className="spotlight-photo absolute inset-0 w-full h-full object-cover" />
    </div>
  );
}

export default function FutureScreen() {
  const goBack = useMobileBack("/mobile/explore");
  return (
    <MobileShell noPadding onBack={goBack}>
      <div className="flex flex-col">
        <div className="relative h-64">
          <img src={explore.hero.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.45) 0%, rgba(20,33,42,0.55) 50%, rgba(20,33,42,0.92) 100%)" }} />
          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: "var(--sage)" }}>{explore.hero.eyebrow}</p>
            <h1 className="text-2xl font-bold leading-tight text-white" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.35)" }}>{explore.hero.title}</h1>
          </div>
        </div>

        <div className="px-5 pt-6 flex flex-col gap-8 pb-8 mobile-stagger">
          <div className="flex flex-col gap-3">
            <p className="section-eyebrow" style={{ color: "var(--leaf)" }}>The Vision</p>
            <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{explore.hero.subtitle}</p>
            {explore.vision.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed" style={{ color: "#000000" }}>{p}</p>
            ))}
          </div>

          {explore.stats?.length > 0 && (
            <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, var(--forest), var(--teal-deep))" }}>
              <div className="grid grid-cols-2 gap-6 text-center">
                {explore.stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold text-white leading-none">{s.value}</p>
                    <p className="text-xs mt-2 leading-snug" style={{ color: "rgba(255,255,255,0.78)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-8">
            {explore.features.map((f) => (
              <div key={f.id} className="flex flex-col gap-3">
                <FeatureImage image={f.image} alt={f.heading} />
                <p className="section-eyebrow" style={{ color: "var(--leaf)" }}>{f.eyebrow}</p>
                <h2 className="section-heading text-lg font-bold leading-snug" style={{ color: "#000000" }}>{f.heading}</h2>
                {f.body.map((p, bi) => (
                  <p key={bi} className="text-sm leading-relaxed" style={{ color: "#000000" }}>{p}</p>
                ))}
              </div>
            ))}
          </div>

          {explore.masterplan && (
            <div className="flex flex-col gap-4">
              <p className="section-eyebrow" style={{ color: "var(--leaf)" }}>{explore.masterplan.eyebrow}</p>
              <h2 className="section-heading text-lg font-bold leading-snug" style={{ color: "#000000" }}>{explore.masterplan.heading}</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{explore.masterplan.body}</p>
              <img src={explore.masterplan.image} alt="Nicholson Quarter masterplan" loading="lazy" className="w-full h-auto rounded-xl" />
              <div className="flex flex-col gap-3">
                {explore.masterplan.locations.map((loc) => (
                  <div key={loc.number} className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.25)" }}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "var(--forest)", color: "#ffffff" }}>
                        {loc.number}
                      </span>
                      <h3 className="font-bold text-sm leading-snug" style={{ color: "#000000" }}>{loc.title}</h3>
                    </div>
                    {loc.tagline && <p className="section-eyebrow mb-1.5" style={{ color: "var(--leaf)" }}>{loc.tagline}</p>}
                    <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{loc.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {explore.community && (
            <div className="text-center flex flex-col gap-3">
              <p className="section-eyebrow" style={{ color: "var(--leaf)" }}>Your Town, Your Future</p>
              <h2 className="section-heading text-lg font-bold leading-snug" style={{ color: "#000000" }}>{explore.community.heading}</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{explore.community.body}</p>
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
