import SmartImage from "./SmartImage";

// The dark header band shared by Our Story, Our Traders and Work With Us.
// Everything in it comes from Site Content; the picture is optional — without
// one it's the plain band these pages have always had.
export default function TextPageHero({ copy }) {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-32 overflow-hidden"
      style={{ backgroundColor: "var(--forest)" }}
    >
      {copy.hero && (
        <>
          <SmartImage src={copy.hero} alt="" size="hero" eager sizes="100vw" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.55) 0%, rgba(20,33,42,0.8) 100%)" }} />
        </>
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(47,164,164,0.28) 0%, transparent 70%)" }}
      />
      {copy.eyebrow && (
        <span className="section-eyebrow relative mb-4" style={{ color: "var(--sage)" }}>{copy.eyebrow}</span>
      )}
      <h1 className="relative text-4xl md:text-6xl font-bold leading-tight mb-6 text-white">{copy.title}</h1>
      {copy.intro && (
        <p className="relative text-base md:text-lg max-w-2xl leading-relaxed text-white">{copy.intro}</p>
      )}
    </section>
  );
}
