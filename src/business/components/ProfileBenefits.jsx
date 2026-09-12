// The "what you get" screen shown during sign-up and claim onboarding, in
// place of the plan picker that used to sit there. Nobody subscribes while
// registering any more — everyone starts on the free listing and chooses a
// plan from their dashboard once they're signed in.

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B", BORDER = "rgba(16,24,40,0.14)";

const BENEFITS = [
  ["Tell your story", "introduce your business with a description that lets customers know what makes you special."],
  ["Add your photos", "showcase your business, products, services and atmosphere with a gallery of images."],
  ["Keep your details up to date", "manage your address, telephone number, website and opening hours."],
  ["Connect your social media", "link customers directly to your Instagram, Facebook and other social channels."],
  ["Share your latest offers", "share special offers, promotions and seasonal deals with local customers."],
  ["Share what's happening", "publish news, updates and announcements to keep customers informed."],
  ["Share events", "let people know about upcoming events, activities and special occasions."],
  ["Make it easy to find you", "help customers discover your location and get directions."],
  ["Drive customers to your website", "give customers a direct route to your website and online services."],
  ["Make your business stand out", "create a richer, more engaging profile that increases visibility."],
];

export default function ProfileBenefits() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-base font-bold" style={{ color: FOREST }}>Manage Your Business Profile</p>
        <p className="text-sm mt-1" style={{ color: MUTED }}>With your Business Profile, you can:</p>
      </div>

      <ul className="grid sm:grid-cols-2 gap-2.5">
        {BENEFITS.map(([title, detail]) => (
          <li key={title} className="flex items-start gap-2.5 rounded-xl p-3" style={{ border: `1.5px solid ${BORDER}` }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-px text-[11px] font-bold"
              style={{ backgroundColor: "rgba(37,99,235,0.1)", color: SAGE }}>✓</span>
            <span className="text-xs leading-relaxed" style={{ color: MUTED }}>
              <strong style={{ color: FOREST }}>{title}</strong> — {detail}
            </span>
          </li>
        ))}
      </ul>

    </div>
  );
}
