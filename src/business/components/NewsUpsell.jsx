import { FOREST, SAGE, MUTED, CARD } from "./FormKit";
import { Icon, FeatureCard, UpsellHero, UpsellBand } from "./AnalyticsUpsell";

// What a Free business sees on News & Offers: what publishing gets them,
// over a blurred preview of article cards. Same building blocks as the
// Analytics upgrade page.

const PLACES = [
  {
    title: "Your business profile",
    body: "Giving visitors useful and up-to-date content when they discover your business.",
    icon: <><path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M9 21V12h6v9" /></>,
  },
  {
    title: "The News & Offers section",
    body: "Putting your content in front of people browsing across Maidenhead.com.",
    icon: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h10M7 16h6" /></>,
  },
  {
    title: "The Maidenhead App",
    body: "Helping app users discover your latest news, offers and updates.",
    icon: <><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M11 18h2" /></>,
  },
];

function Preview() {
  return (
    <div aria-hidden className="absolute inset-0 p-6 grid grid-cols-3 gap-4 select-none pointer-events-none"
      style={{ filter: "blur(3px)", opacity: 0.35 }}>
      {["Summer offer", "New menu", "Open late"].map((t, i) => (
        <div key={t} className="rounded-xl bg-white overflow-hidden flex flex-col">
          <div className="h-24" style={{ background: ["#93C5FD", "#A5B4FC", "#7DD3FC"][i] }} />
          <div className="p-3 flex flex-col gap-2">
            <div className="text-sm font-bold" style={{ color: FOREST }}>{t}</div>
            <div className="h-2 rounded bg-slate-200" />
            <div className="h-2 w-2/3 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoCard({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-3" style={CARD}>
      <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(37,99,235,0.08)", color: SAGE }}>
        <Icon>{icon}</Icon>
      </span>
      <h2 className="text-base font-bold" style={{ color: FOREST }}>{title}</h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed [&_p]:text-[#64748B]">{children}</div>
    </div>
  );
}

export default function NewsUpsell({ role }) {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <UpsellHero role={role} title="Share your news, offers & updates" preview={<Preview />}>
        <p className="text-base leading-relaxed max-w-2xl" style={{ color: MUTED }}>
          Give customers more reasons to discover, visit and trust your business.
        </p>
      </UpsellHero>

      {/* The allowance — the question every business asks first */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:items-center" style={CARD}>
        <div className="shrink-0 w-24 h-24 rounded-2xl flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)" }}>
          <span className="text-4xl font-bold text-white leading-none">3</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.8)" }}>articles</span>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-base font-bold" style={{ color: FOREST }}>
            Up to 3 News &amp; Offers articles with your business at any one time
          </p>
          <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
            These are <strong style={{ color: FOREST }}>not limited to three articles per month</strong>. As long as you remain on the
            Visibility Plan, you can edit, update, replace and refresh your 3 articles as often as you like.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: FOREST }}>Your content gets seen across Maidenhead</h2>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Your News &amp; Offers articles can appear in:</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {PLACES.map((f) => <FeatureCard key={f.title} f={f} />)}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <InfoCard title="Build trust & get discovered"
          icon={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>}>
          <p>Fresh, useful content gives customers more reasons to engage with your business and helps show that your profile is active and trustworthy.</p>
          <p>Your articles can also give search engines more useful information about your business, helping customers discover you when searching for relevant products, services and local information.</p>
        </InfoCard>
        <InfoCard title="Get ready for AI discovery"
          icon={<><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z" /></>}>
          <p>The future <strong style={{ color: FOREST }}>AI Maidenhead Concierge</strong> will help people discover local businesses and find answers to their questions.</p>
          <p>Keeping your business information and content accurate, useful and up to date helps prepare your business for this next generation of local discovery.</p>
        </InfoCard>
      </section>

      <UpsellBand role={role} title="Start publishing today">
        Upgrade to the Visibility Plan and start publishing your News &amp; Offers content across Maidenhead.com and the Maidenhead App.
      </UpsellBand>
    </div>
  );
}
