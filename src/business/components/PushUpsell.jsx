import { FOREST, SAGE, MUTED, CARD } from "./FormKit";
import { Icon, UpsellHero, UpsellBand } from "./AnalyticsUpsell";
import { Chip } from "./EventsUpsell";

// What a Free business sees on Push Notifications, over a blurred phone lock
// screen. Same building blocks as the other upgrade pages.

const USES = [
  "Special offers and promotions",
  "New products and services",
  "Events and upcoming dates",
  "Business news and announcements",
  "Limited-time offers and last-minute availability",
  "Important updates for your customers",
];

function Preview() {
  return (
    <div aria-hidden className="absolute inset-0 flex justify-center items-center select-none pointer-events-none"
      style={{ filter: "blur(3px)", opacity: 0.35 }}>
      <div className="w-64 h-[120%] rounded-[2.5rem] p-4 pt-16 flex flex-col gap-3" style={{ background: "#1E3A8A" }}>
        {["20% off this weekend", "Live music Friday", "New menu launched"].map((t) => (
          <div key={t} className="rounded-2xl bg-white/90 p-3 flex gap-3 items-center">
            <div className="w-8 h-8 rounded-lg" style={{ background: SAGE }} />
            <div className="text-xs font-bold" style={{ color: FOREST }}>{t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PushUpsell({ role }) {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <UpsellHero role={role} title="Reach customers directly" preview={<Preview />}>
        <p className="text-base leading-relaxed max-w-2xl" style={{ color: MUTED }}>
          Put your latest news, offers and events directly in front of people using <strong style={{ color: FOREST }}>The Maidenhead App</strong>.
        </p>
      </UpsellHero>

      <section className="bg-white rounded-2xl p-6 sm:p-8 grid md:grid-cols-[1fr_1.2fr] gap-8" style={CARD}>
        <div className="flex flex-col gap-3">
          <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(37,99,235,0.08)", color: SAGE }}>
            <Icon><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></Icon>
          </span>
          <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
            Send an in-app push notification to promote a special offer, announce an event, launch a new product,
            share important news or remind customers about something happening at your business.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-bold" style={{ color: FOREST }}>Perfect for</h2>
          <div className="flex flex-wrap gap-2">{USES.map((u) => <Chip key={u}>✓ {u}</Chip>)}</div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {[
          { t: "Image & link", b: "Your notification can include an image and a link, helping turn attention into visits, enquiries and bookings.",
            i: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></> },
          { t: "You choose the message", b: "We handle the delivery.",
            i: <><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></> },
          { t: "Approved & scheduled", b: "Push notifications are subject to approval and are sent by The Maidenhead App at the agreed time.",
            i: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> },
        ].map((c) => (
          <div key={c.t} className="bg-white rounded-2xl p-5 flex flex-col gap-2" style={CARD}>
            <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(37,99,235,0.08)", color: SAGE }}><Icon>{c.i}</Icon></span>
            <p className="text-sm font-bold mt-1" style={{ color: FOREST }}>{c.t}</p>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{c.b}</p>
          </div>
        ))}
      </section>

      <UpsellBand role={role} title="Put your business on their home screen">
        Upgrade to the Visibility Plan to send push notifications to people using The Maidenhead App.
      </UpsellBand>
    </div>
  );
}
