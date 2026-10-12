// The Accommodation module: an accommodation management company (or agency)
// manages several properties from one account. The company is a business
// row of kind "accommodation_company"; each property is its own business
// row of kind "accommodation_property", with its own page, pin, reviews and
// analytics. See supabase/sql/accommodation_module_2026_10.sql (admin-panel
// branch) for the rules the database enforces.
//
// Hotels are NOT part of this module — a hotel stays a single business.

import { AMENITY_CATEGORIES, ACCOMMODATION_AMENITY_CATEGORIES, BUSINESS_TYPES } from "./businessPortalMock";

export const COMPANY_KIND = "accommodation_company";
export const PROPERTY_KIND = "accommodation_property";

export const isAccommodationCompany = (user) => user?.kind === COMPANY_KIND;

// Registration's business type list. The shared taxonomy still carries the
// combined "Hotel & Accommodation" type (the admin panel's registration form
// uses it); here a hotel registers as a Hotel and accommodation registers
// as a management company.
export const ACCOMMODATION_TYPE = { value: "accommodation", label: "Accommodation (management company or agency)" };
export const REGISTRATION_TYPES = [
  ...BUSINESS_TYPES.map((t) => (t.value === "hotel" ? { ...t, label: "Hotel" } : t)),
  ACCOMMODATION_TYPE,
];

// Shown the moment Accommodation is chosen at registration — the client's
// agreed wording.
export const REGISTRATION_NOTICE =
  "The business name, business website and address you register are the details of your accommodation management company or agency. "
  + "Your contact email and telephone number will not be shown publicly at this stage. Once your account is approved, you will be able to add "
  + "the individual accommodations you want displayed on the platform, including their contact details for users to enquire needed, from your login panel.";

// A property's lifecycle (businesses.property_state), as the owner sees it.
export const PROPERTY_STATES = {
  draft:    { label: "Draft",            color: "#475569", bg: "rgba(71,85,105,0.10)",  help: "Not submitted yet. Finish the details and submit it for approval." },
  pending:  { label: "Pending approval", color: "#B45309", bg: "rgba(217,119,6,0.12)",  help: "With Maidenhead admin for review. It goes live once approved." },
  live:     { label: "Live",             color: "#047857", bg: "rgba(16,185,129,0.12)", help: "Visible on Maidenhead.com and The Maidenhead App." },
  rejected: { label: "Rejected",         color: "#B91C1C", bg: "rgba(220,38,38,0.10)",  help: "Not approved. Correct it and submit it again." },
  hidden:   { label: "Hidden",           color: "#475569", bg: "rgba(71,85,105,0.10)",  help: "Hidden by you. It doesn't use a plan slot while hidden." },
  inactive: { label: "Inactive",         color: "#6D28D9", bg: "rgba(109,40,217,0.10)", help: "Switched off because the plan allows fewer properties. Reactivate it when a slot is free." },
  archived: { label: "Replaced",         color: "#475569", bg: "rgba(71,85,105,0.10)",  help: "Replaced by another property." },
};

// Order the My Properties list is shown in.
export const STATE_ORDER = ["rejected", "draft", "pending", "live", "hidden", "inactive"];

// What a property shows and edits on the Free plan: its name, address and
// map pin. Everything else — photos, description, contact of its own,
// amenities, rooms, check-in, booking, FAQs, reviews — needs a paid plan.
export const PROPERTY_FREE_FIELDS = new Set(["name", "address", "postalCode", "lat", "lng"]);

// Paid property photos: 1 hero + up to 12 more, on every paid tier.
export const PROPERTY_GALLERY_MAX = 12;

export const PROPERTY_AMENITY_CATEGORIES = ACCOMMODATION_AMENITY_CATEGORIES;
export const ROOM_AMENITIES = AMENITY_CATEGORIES.find((c) => c.category === "Room Facilities")?.options ?? [];
export const ROOMS_MAX = 20;

// The plan name shown in the sidebar and on locks, from the company's tier.
export function tierLabel(user, tiers = []) {
  if (user?.plan !== "premium") return "Free plan";
  const named = tiers.find((t) => t.key === user.siteTierKey)?.name;
  if (named) return named;
  const n = /^acc-(\d+)$/.exec(user.siteTierKey ?? "")?.[1];
  return n ? `${n} Properties plan` : "Accommodation plan";
}
