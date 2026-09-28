import { useNavigate } from "react-router-dom";
import { FOREST, SAGE, MUTED, CARD } from "./FormKit";

// What a Free business sees on Analytics: what it would get, laid over a
// blurred preview of the real dashboard so it's clear what's being unlocked.
// The numbers in the preview are decoration, not this business's data.

const FEATURES = [
  {
    title: "Profile views",
    body: "See how many times your business profile is viewed.",
    icon: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  },
  {
    title: "Trends over time",
    body: "Understand when interest in your business is increasing.",
    icon: <><path d="M23 6l-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" /></>,
  },
  {
    title: "Article views",
    body: "See how many people are reading your news, offers, articles and events.",
    icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M8 7h8M8 11h6" /></>,
  },
  {
    title: "Website & app activity",
    body: "Understand how customers are discovering and viewing your business.",
    icon: <><rect x="2" y="3" width="14" height="11" rx="2" /><rect x="15" y="8" width="7" height="13" rx="1.5" /><path d="M6 18h6" /></>,
  },
];

const BARS = [28, 36, 31, 44, 40, 52, 48, 61, 57, 70, 66, 82];

export function Icon({ children }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

// A stylised, blurred stand-in for the analytics screen.
function Preview() {
  return (
    <div aria-hidden className="absolute inset-0 p-6 flex flex-col gap-4 select-none pointer-events-none"
      style={{ filter: "blur(3px)", opacity: 0.35 }}>
      <div className="grid grid-cols-3 gap-3">
        {["2,418", "+34%", "916"].map((v) => (
          <div key={v} className="rounded-xl p-3 bg-white">
            <div className="h-2 w-16 rounded bg-slate-200 mb-2" />
            <div className="text-xl font-bold" style={{ color: FOREST }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 rounded-xl bg-white p-4 flex items-end gap-2">
        {BARS.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, backgroundColor: SAGE }} />
        ))}
      </div>
    </div>
  );
}

// Shared with the other upgrade pages (NewsUpsell) so they read as one set.
export function UpsellCta({ role, light }) {
  const navigate = useNavigate();
  if (role === "Content Manager") {
    return light
      ? <p className="shrink-0 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>Ask your business owner to upgrade.</p>
      : <p className="text-sm font-semibold px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#FFFBEB", color: "#92400E" }}>Ask your business owner to upgrade to the Visibility Plan.</p>;
  }
  return light ? (
    <button onClick={() => navigate("/business/upgrade")}
      className="shrink-0 px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
      style={{ backgroundColor: "#fff", color: "#1E3A8A" }}>
      See the Visibility Plan →
    </button>
  ) : (
    <button onClick={() => navigate("/business/upgrade")}
      className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md"
      style={{ backgroundColor: SAGE }}>
      See the Visibility Plan →
    </button>
  );
}

export function FeatureCard({ f }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex gap-4 items-start" style={CARD}>
      <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "rgba(37,99,235,0.08)", color: SAGE }}>
        <Icon>{f.icon}</Icon>
      </span>
      <div>
        <p className="text-sm font-bold" style={{ color: FOREST }}>{f.title}</p>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: MUTED }}>{f.body}</p>
      </div>
    </div>
  );
}

export function UpsellHero({ role, title, preview, children }) {
  return (
    <section className="relative overflow-hidden rounded-3xl" style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F8FAFC 55%, #EEF2FF 100%)", border: "1px solid #E0E7FF" }}>
      {preview}
      <div className="relative px-6 py-12 sm:px-12 sm:py-16 flex flex-col items-center text-center gap-5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] px-3 py-1 rounded-full"
          style={{ backgroundColor: "rgba(37,99,235,0.1)", color: SAGE }}>
          🔒 Visibility Plan feature
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl" style={{ color: FOREST }}>{title}</h1>
        {children}
        <UpsellCta role={role} />
      </div>
    </section>
  );
}

export function UpsellBand({ role, title, children }) {
  return (
    <section className="rounded-2xl px-6 py-8 sm:px-10 flex flex-col md:flex-row md:items-center gap-6"
      style={{ background: "linear-gradient(135deg, #13213B 0%, #1E3A8A 100%)" }}>
      <div className="flex-1">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm mt-2 leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.8)" }}>{children}</p>
      </div>
      <UpsellCta role={role} light />
    </section>
  );
}

export default function AnalyticsUpsell({ role }) {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <UpsellHero role={role} title="See how customers find your business" preview={<Preview />}>
        <p className="text-base leading-relaxed max-w-2xl" style={{ color: MUTED }}>
          Your business is already being discovered on <strong style={{ color: FOREST }}>Maidenhead.com</strong> and{" "}
          <strong style={{ color: FOREST }}>The Maidenhead App</strong> — but do you know how many people are viewing your profile?
        </p>
      </UpsellHero>

      <section className="flex flex-col gap-4">
        <p className="text-sm font-semibold" style={{ color: FOREST }}>
          Upgrade to the Visibility Plan to unlock your business analytics and see:
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => <FeatureCard key={f.title} f={f} />)}
        </div>
      </section>

      <UpsellBand role={role} title="Turn views into valuable insight">
        Knowing how many people are looking at your business helps you understand your visibility and make
        better decisions about how you promote your business.
      </UpsellBand>
    </div>
  );
}
