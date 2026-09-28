import { FOREST, SAGE, MUTED, CARD } from "./FormKit";
import { Icon, FeatureCard, UpsellHero, UpsellBand } from "./AnalyticsUpsell";

// What a Free business sees on Reviews, over blurred review cards. Same
// building blocks as the other upgrade pages.

const CTA = "View the Visibility Plan";

const BENEFITS = [
  { title: "Build trust", body: "Build trust in your business.",
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></> },
  { title: "Real experiences", body: "Showcase real customer experiences.",
    icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></> },
  { title: "More confidence", body: "Give potential customers more confidence.",
    icon: <><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.3a2 2 0 0 0 2-1.7l1.4-9a2 2 0 0 0-2-2.3z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></> },
  { title: "Verify the source", body: "Let visitors verify the original review source.",
    icon: <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></> },
];

function Stars() {
  return <span className="text-sm tracking-wider" style={{ color: "#F59E0B" }}>★★★★★</span>;
}

function Preview() {
  return (
    <div aria-hidden className="absolute inset-0 p-6 grid grid-cols-3 gap-4 select-none pointer-events-none"
      style={{ filter: "blur(3px)", opacity: 0.35 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl bg-white p-4 flex flex-col gap-2">
          <Stars />
          <div className="h-2 rounded bg-slate-200" />
          <div className="h-2 rounded bg-slate-200" />
          <div className="h-2 w-2/3 rounded bg-slate-200" />
          <span className="text-xs font-semibold mt-auto" style={{ color: SAGE }}>View original review ↗</span>
        </div>
      ))}
    </div>
  );
}

export default function ReviewsUpsell({ role }) {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <UpsellHero role={role} title="Build trust with verified reviews" preview={<Preview />} ctaLabel={CTA}>
        <p className="text-base leading-relaxed max-w-2xl" style={{ color: MUTED }}>
          Show potential customers what people are saying about your business with verified reviews displayed directly on
          your <strong style={{ color: FOREST }}>Maidenhead.com</strong> business profile and{" "}
          <strong style={{ color: FOREST }}>The Maidenhead App</strong>.
        </p>
      </UpsellHero>

      <section className="bg-white rounded-2xl p-6 sm:p-8 flex gap-5 items-center" style={CARD}>
        <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(37,99,235,0.08)", color: SAGE }}>
          <Icon><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6M10 14L21 3" /></Icon>
        </span>
        <p className="text-base leading-relaxed" style={{ color: FOREST }}>
          Each review includes a <strong>source URL</strong>, allowing visitors to click through and view the original review source.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: FOREST }}>Give customers more confidence</h2>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Genuine customer feedback can help:</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENEFITS.map((f) => <FeatureCard key={f.title} f={f} />)}
        </div>
      </section>

      <UpsellBand role={role} title="Verified Reviews are included with the Visibility Plan" ctaLabel={CTA}>
        Keep your customer feedback visible alongside your business information and give new customers another reason to choose you.
      </UpsellBand>
    </div>
  );
}
