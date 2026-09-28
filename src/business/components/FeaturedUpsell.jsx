import { FOREST, MUTED, CARD } from "./FormKit";
import { FeatureCard, UpsellHero, UpsellBand } from "./AnalyticsUpsell";

// What a Free business sees on Feature Articles, over a blurred preview of an
// editorial layout. Same building blocks as the other upgrade pages.

const BENEFITS = [
  { title: "A dedicated editorial feature", body: "An article all about your business.",
    icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></> },
  { title: "Multiple images", body: "Pictures throughout the article, not just one.",
    icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></> },
  { title: "More search discovery", body: "More opportunities to be found in search.",
    icon: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></> },
  { title: "Greater visibility & engagement", body: "Across Maidenhead.com and the Maidenhead App.",
    icon: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></> },
  { title: "More engaging than a listing", body: "A richer way to tell your story than a standard business listing.",
    icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></> },
  { title: "Any topic you choose", body: "Products, services, people, or anything you feel is important.",
    icon: <><path d="M12 2l3 6.5 7 1-5 4.9 1.2 7L12 18l-6.2 3.4L7 14.4 2 9.5l7-1z" /></> },
  { title: "AI ready & search optimised", body: "Written to be found by search results and AI assistants.",
    icon: <><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z" /></> },
];

function Preview() {
  return (
    <div aria-hidden className="absolute inset-0 p-6 flex gap-5 select-none pointer-events-none"
      style={{ filter: "blur(3px)", opacity: 0.35 }}>
      <div className="flex-1 rounded-xl bg-white p-4 flex flex-col gap-3">
        <div className="h-28 rounded-lg" style={{ background: "#93C5FD" }} />
        <div className="h-4 w-3/4 rounded bg-slate-300" />
        {[1, 2, 3].map((i) => <div key={i} className="h-2 rounded bg-slate-200" />)}
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 rounded-lg" style={{ background: "#A5B4FC" }} />
          <div className="h-16 rounded-lg" style={{ background: "#7DD3FC" }} />
        </div>
      </div>
      <div className="w-1/3 hidden sm:flex flex-col gap-3">
        <div className="h-40 rounded-xl" style={{ background: "#BFDBFE" }} />
        <div className="h-2 rounded bg-slate-200" />
        <div className="h-2 w-2/3 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export default function FeaturedUpsell({ role }) {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <UpsellHero role={role} title="Put your business in the limelight" preview={<Preview />}>
        <p className="text-base leading-relaxed max-w-2xl" style={{ color: MUTED }}>
          Take your business story further with a <strong style={{ color: FOREST }}>Feature Article</strong> — a longer
          editorial-style article designed to create greater interest, visibility and engagement.
        </p>
      </UpsellHero>

      <section className="bg-white rounded-2xl p-6 sm:p-8" style={CARD}>
        <p className="text-base leading-relaxed" style={{ color: FOREST }}>
          Tell your story in more detail with <strong>multiple images embedded throughout the article</strong>,
          showcasing your business, products, people, services or what makes you unique.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold" style={{ color: FOREST }}>Your Feature Article can provide</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Seven benefits: the last runs the full row rather than sit alone. */}
          {BENEFITS.map((f, i) => (
            <div key={f.title} className={i === BENEFITS.length - 1 ? "sm:col-span-2 lg:col-span-3 grid" : "grid"}>
              <FeatureCard f={f} />
            </div>
          ))}
        </div>
      </section>

      <UpsellBand role={role} title="Give customers more to discover">
        A Feature Article gives potential customers a deeper look at your business and provides valuable content they can read, share and discover.
      </UpsellBand>
    </div>
  );
}
