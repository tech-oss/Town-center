import { FOREST, SAGE, MUTED, CARD } from "./FormKit";
import { FeatureCard, UpsellHero, UpsellBand } from "./AnalyticsUpsell";

// What a Free business sees on Events, over a blurred calendar preview. Same
// building blocks as the other upgrade pages.

const WHERE = [
  { title: "See & Do / What's On", body: "Your events appear in the See & Do and What's On sections.",
    icon: <><path d="M12 2l3 6.5 7 1-5 4.9 1.2 7L12 18l-6.2 3.4L7 14.4 2 9.5l7-1z" /></> },
  { title: "The events calendar", body: "Listed on the searchable events calendar, by date.",
    icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></> },
  { title: "Website & app", body: "Seen across Maidenhead.com and The Maidenhead App.",
    icon: <><rect x="2" y="3" width="14" height="11" rx="2" /><rect x="15" y="8" width="7" height="13" rx="1.5" /><path d="M6 18h6" /></> },
];

const DETAILS = ["Dates & times", "Location", "Description", "Images", "Booking information", "Direct booking button"];
const KINDS = ["Live events", "Classes", "Workshops", "Performances", "Special evenings", "Family activities", "Seasonal events"];

function Preview() {
  return (
    <div aria-hidden className="absolute inset-0 p-6 select-none pointer-events-none" style={{ filter: "blur(3px)", opacity: 0.35 }}>
      <div className="h-full rounded-xl bg-white p-4 grid grid-cols-7 gap-2">
        {Array.from({ length: 28 }, (_, i) => (
          <div key={i} className="rounded-md p-1 flex flex-col gap-1" style={{ backgroundColor: "#F1F5F9" }}>
            <span className="text-[10px] font-bold" style={{ color: FOREST }}>{i + 1}</span>
            {[3, 8, 12, 17, 19, 24, 26].includes(i) && <span className="h-2 rounded" style={{ backgroundColor: SAGE }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Chip({ children }) {
  return (
    <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.08)", color: SAGE }}>
      {children}
    </span>
  );
}

export default function EventsUpsell({ role }) {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <UpsellHero role={role} title="Get your events seen" preview={<Preview />}>
        <p className="text-base leading-relaxed max-w-2xl" style={{ color: MUTED }}>
          Promote your events across <strong style={{ color: FOREST }}>Maidenhead.com</strong> and{" "}
          <strong style={{ color: FOREST }}>The Maidenhead App</strong> and make it easier for local people to discover what's happening.
        </p>
      </UpsellHero>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: FOREST }}>Where your events appear</h2>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Create events that appear in the See &amp; Do / What's On sections and on the searchable events calendar.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {WHERE.map((f) => <FeatureCard key={f.title} f={f} />)}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6 sm:p-8 grid md:grid-cols-2 gap-8" style={CARD}>
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold" style={{ color: FOREST }}>Put your event in front of more people</h2>
          <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
            Your event can be discovered by people looking for things to do in Maidenhead, with all the details they need:
          </p>
          <div className="flex flex-wrap gap-2">{DETAILS.map((d) => <Chip key={d}>✓ {d}</Chip>)}</div>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold" style={{ color: FOREST }}>Whatever you're hosting</h2>
          <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
            Whether it's a live event, class, workshop, performance, special evening, family activity or seasonal event,
            the events calendar gives people another way to find you.
          </p>
          <div className="flex flex-wrap gap-2">{KINDS.map((k) => <Chip key={k}>{k}</Chip>)}</div>
        </div>
      </section>

      <UpsellBand role={role} title="Start promoting your events">
        Upgrade to the Visibility Plan to put your events on Maidenhead.com, The Maidenhead App and the events calendar.
      </UpsellBand>
    </div>
  );
}
