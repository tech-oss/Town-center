// ─── Mock data for the Business User Portal (/business/**) ───────────────────
// Frontend-only. Nothing here is persisted — every save/submit mocks success
// and shows a toast. See per-field TODO comments for backend integration.

const img = (seed, w = 900, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const BUSINESS_TYPES = [
  { value: "eat-drink", label: "Eat & Drink" },
  { value: "shop",      label: "Shop" },
  { value: "see-do",    label: "See & Do" },
  { value: "hotel",     label: "Hotel & Accommodation" },
  { value: "freelancer",label: "Freelancers/Tradeperson/Professional" },
];

// ─── Freelancer & Trader — pick one ────────────────────────────────────────────
export const FREELANCER_KINDS = [
  { value: "tradesperson", label: "Tradesperson" },
  { value: "professional", label: "Professional" },
  { value: "freelancer",   label: "Freelancer" },
];

// ─── Hotel & Accommodation — pick one ──────────────────────────────────────────
export const HOTEL_KINDS = [
  { value: "hotel",         label: "Hotel" },
  { value: "accommodation", label: "Accommodation" },
];

// ─── Eat & Drink — cuisine type (multi-select) ────────────────────────────────
export const CUISINE_TYPES = [
  { value: "british",  label: "British" },
  { value: "italian",  label: "Italian" },
  { value: "chinese",  label: "Chinese" },
  { value: "indian",   label: "Indian" },
  { value: "french",   label: "French" },
  { value: "thai",     label: "Thai" },
  { value: "japanese", label: "Japanese" },
  { value: "bakery",   label: "Bakery" },
];

// ─── Eat & Drink — venue type (multi-select) ──────────────────────────────────
export const VENUE_TYPES = [
  { value: "bars",           label: "Bars" },
  { value: "restaurants",    label: "Restaurants" },
  { value: "cafes",          label: "Cafes" },
  { value: "grab-go",        label: "Grab & Go" },
  { value: "private-dining", label: "Private Dining" },
];

// ─── Shop — category (multi-select, grouped) ──────────────────────────────────
export const SHOP_CATEGORIES = [
  { value: "accessories-jewellery", label: "Accessories & Jewellery",   group: "Shops" },
  { value: "clothing",              label: "Clothing",                  group: "Shops" },
  { value: "electronics-phones",    label: "Electronics & Phones",      group: "Shops" },
  { value: "groceries",             label: "Groceries",                 group: "Shops" },
  { value: "health-beauty",         label: "Health & Beauty",           group: "Shops" },
  { value: "home-furniture",        label: "Home & Furniture",          group: "Shops" },
  { value: "shoes-footwear",        label: "Shoes & Footwear",          group: "Shops" },
  { value: "sports-fitness",        label: "Sports & Fitness",          group: "Shops" },
  { value: "banks",                 label: "Banks & Foreign Exchange",  group: "Local Services" },
  { value: "childcare",             label: "Childcare",                 group: "Local Services" },
  { value: "dry-cleaning",          label: "Dry Cleaning & Shoe Repair",group: "Local Services" },
  { value: "hairdressing",          label: "Hairdressing & Beauty",     group: "Local Services" },
  { value: "healthcare",            label: "Healthcare",                group: "Local Services" },
  { value: "opticians",             label: "Opticians & Pharmacies",    group: "Local Services" },
  { value: "spa",                   label: "Spa",                       group: "Local Services" },
  { value: "travel-agents",         label: "Travel Agents",             group: "Local Services" },
];

export const DEFAULT_HOURS = () => [
  { day: "Monday",    open: true,  from: "09:00", to: "17:00" },
  { day: "Tuesday",   open: true,  from: "09:00", to: "17:00" },
  { day: "Wednesday", open: true,  from: "09:00", to: "17:00" },
  { day: "Thursday",  open: true,  from: "09:00", to: "17:00" },
  { day: "Friday",    open: true,  from: "09:00", to: "17:00" },
  { day: "Saturday",  open: true,  from: "10:00", to: "16:00" },
  { day: "Sunday",    open: false, from: "10:00", to: "16:00" },
];

// ─── Subscription plans (standard businesses) ─────────────────────────────────
export const SUBSCRIPTION_PLANS = [
  { key: "free", name: "Free", price: 0, features: ["Listing page", "1 photo", "Business contact details"] },
  { key: "standard", name: "Standard", price: 39, features: ["Everything in Free", "Unlimited photos", "News & Offers section", "Priority in search results"] },
  { key: "premium", name: "Premium", price: 79, features: ["Everything in Standard", "Featured placement", "Analytics dashboard", "Homepage spotlight eligibility"] },
];

// ─── Upgrade flow plans (/business/upgrade) ────────────────────────────────────
// Distinct from SUBSCRIPTION_PLANS (used on the Billing page) — this is the
// plan set shown in the dedicated 4-screen upgrade flow.
export const UPGRADE_PLANS = [
  {
    key: "basic", name: "Basic", icon: "paper-plane", price: 0, tagline: "Basic listing",
    features: ["Basic business info", "1 Photo", "Map location", "Customer reviews"],
  },
  {
    key: "premium", name: "Premium", icon: "star", price: 19, tagline: "More visibility", popular: true,
    features: ["Everything in Basic", "5 Photos", "Featured listing", "Priority in search", "Analytics"],
  },
  {
    key: "vip", name: "VIP", icon: "crown", price: 39, tagline: "Maximum visibility",
    features: ["Everything in Premium", "10 Photos", "Top of search results", "Business badge", "Advanced analytics"],
  },
];

// ─── Hotel / accommodation multi-site tiers ───────────────────────────────────
export const HOTEL_SITE_TIERS = [
  { key: "1", label: "1 site", price: 100 },
  { key: "5", label: "Up to 5 sites", price: 200 },
  { key: "10", label: "Up to 10 sites", price: 350 },
  { key: "10+", label: "More than 10 (contact us)", price: null },
];
export const ACCOMMODATION_TIERS = [
  { key: "1", label: "1 property", price: 75 },
  { key: "5", label: "Up to 5 properties", price: 150 },
  { key: "10", label: "Up to 10 properties", price: 275 },
  { key: "10+", label: "More than 10 (contact us)", price: null },
];

export const TERMS_TEXT = `Maidenhead Town Centre — Business Terms of Use

1. Acceptance of Terms
By registering a business account you agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree, do not proceed with registration.

2. Business Listings
You are responsible for the accuracy of the information you submit. Maidenhead Town Centre reserves the right to review, edit, reject or remove any listing content that breaches these terms or is otherwise unsuitable for the platform.

3. Subscription & Billing
Subscription fees are billed monthly in advance. Prices shown at sign-up are indicative and are confirmed on account approval. You may upgrade, downgrade or cancel your subscription at any time from your account settings, subject to the notice periods described in your plan.

4. Content Standards
All content, images and offers submitted must be accurate, lawful, and free of material that is offensive, misleading or infringes the rights of any third party. Admin approval is required before changes go live on the public site.

5. Reviews
Reviews are submitted by members of the public and reflect their own opinions. Businesses may reply to reviews; replies are subject to admin approval before publication. Businesses may not submit reviews of their own listing.

6. Termination
Either party may terminate this agreement at any time. Upon termination your listing will be removed from the public site within a reasonable period.

7. Limitation of Liability
Maidenhead Town Centre is provided on an "as is" basis. We do not guarantee any particular level of footfall, enquiries or bookings resulting from your listing.

8. Changes to These Terms
We may update these terms from time to time. Continued use of the platform after changes take effect constitutes acceptance of the revised terms.`;

// ─── Mock logged-in users ──────────────────────────────────────────────────────
export const coppaMockUser = {
  id: "biz_coppa",
  firstName: "James",
  lastName: "Whitfield",
  email: "james@coppaclub.co.uk",
  phone: "01628 555 210",
  businessName: "Coppa Club",
  businessType: "eat-drink",
  plan: "standard",
  planStatus: "Active",
  renewalDate: "2026-09-12",
  monthlyFee: 39,
  isMultiSite: false,
  visible: true,
  termsAcceptedAt: "2026-04-02T10:14:00",
  // Current plan in the /business/upgrade flow's Basic/Premium/VIP naming —
  // distinct from `plan` above, which drives the Billing page's own tiers.
  upgradePlanKey: "basic",
  // "Owner" registered the business and can manage billing; a "Content
  // Manager" is a second, content-only seat (see useUserRegistry.js) that
  // cannot access Subscriptions & Billing.
  role: "Owner",
};

export const hotelMockUser = {
  id: "biz_fredricks",
  firstName: "Sarah",
  lastName: "Coombes",
  email: "sarah@fredricks-hotel.co.uk",
  phone: "01628 581 000",
  businessName: "Fredrick's Hotel, Restaurant & Spa",
  businessType: "hotel",
  plan: "hotel-5",
  planStatus: "Active",
  renewalDate: "2026-10-01",
  monthlyFee: 200,
  isMultiSite: true,
  siteTierKey: "5",
  visible: true,
  termsAcceptedAt: "2026-03-18T15:42:00",
  upgradePlanKey: "premium",
  role: "Owner",
};

// ─── All businesses on the platform (for the "Register a User" search) ───────
// Only biz_coppa and biz_fredricks have full seeded content above — the rest
// exist so the search/typeahead feels realistic with a real business count.
export const BUSINESS_DIRECTORY = [
  { id: "biz_coppa", name: "Coppa Club" },
  { id: "biz_fredricks", name: "Fredrick's Hotel, Restaurant & Spa" },
  { id: "biz_velvet", name: "The Velvet Lounge" },
  { id: "biz_booknook", name: "Maidenhead Book Nook" },
  { id: "biz_elgandavies", name: "Elgan Davies Plumbing & Heating" },
  { id: "biz_thameside", name: "Thameside Accountancy" },
  { id: "biz_bakedd", name: "Bakedd" },
  { id: "biz_willowvine", name: "Willow & Vine Florist" },
  { id: "biz_riversideyoga", name: "Riverside Yoga Studio" },
  { id: "biz_quickfix", name: "Quickfix Phone Repairs" },
];

// ─── Business content (My Listing) ─────────────────────────────────────────────
export const BUSINESS_LISTING = {
  biz_coppa: {
    name: "Coppa Club",
    tagline: "Riverside dining, all-day drinking and a fire pit terrace on the Thames.",
    description: "Coppa Club Maidenhead sits right on the water's edge, serving all-day brunch, wood-fired pizza and cocktails against one of the best riverside views in town. Our heated terrace and fire pits mean the good times don't stop when the sun goes down.",
    logo: img("coppa-logo", 300, 300),
    heroImage: img("coppa-hero", 1400, 800),
    category: "Eat & Drink", subcategory: "Restaurants, Bars",
    hours: DEFAULT_HOURS(),
    address: "The Boathouse, Ray Mead Road, Maidenhead SL6 8NQ",
    lat: "51.5237", lng: "-0.7115",
    phone: "01628 555 210",
    email: "hello@coppaclub.co.uk",
    website: "https://coppaclub.co.uk",
    bookingUrl: "https://coppaclub.co.uk/book/maidenhead",
    social: { instagram: "https://instagram.com/coppaclub", facebook: "https://facebook.com/coppaclub", twitter: "" },
    gallery: [img("coppa-g1"), img("coppa-g2"), img("coppa-g3"), img("coppa-g4")],
    faqs: [
      { id: "f1", question: "Do you take walk-ins?", answer: "Yes, we always hold back some terrace tables for walk-ins, but booking is recommended at weekends." },
      { id: "f2", question: "Are dogs allowed?", answer: "Well-behaved dogs are welcome on our terrace." },
    ],
    approvalStatus: { profile: "Up to Date", hours: "Up to Date", gallery: "Pending Approval", location: "Up to Date", contact: "Up to Date", faqs: "Up to Date" },
  },
  biz_fredricks: {
    name: "Fredrick's Hotel, Restaurant & Spa",
    tagline: "A 4-star Edwardian townhouse hotel with private gardens and a spa.",
    description: "Built in the 1920s, Fredrick's is a long-standing 4-star hotel in the heart of Maidenhead, set in its own private gardens with a swimming pool, spa and an on-site restaurant.",
    logo: img("fredricks-logo", 300, 300),
    heroImage: img("fredricks-hero", 1400, 800),
    category: "Live & Stay", subcategory: "Hotel",
    availabilityInfo: "Check-in from 3pm, check-out by 11am. 24-hour front desk.",
    address: "Shoppenhangers Road, Maidenhead SL6 2PZ",
    lat: "51.513295", lng: "-0.726958",
    phone: "01628 581 000",
    email: "stay@fredricks-hotel.co.uk",
    website: "https://fredricks-hotel.co.uk",
    bookingUrl: "https://fredricks-hotel.co.uk/book",
    social: { instagram: "https://instagram.com/fredrickshotel", facebook: "https://facebook.com/fredrickshotel", twitter: "" },
    gallery: [img("fredricks-g1"), img("fredricks-g2"), img("fredricks-g3")],
    amenities: ["Free WiFi", "Parking", "Restaurant", "Bar", "Accessible rooms"],
    otherAmenities: "Private gardens, outdoor swimming pool, spa & wellness centre.",
    properties: [
      { id: "p1", name: "Fredrick's Hotel — Main House", address: "Shoppenhangers Road, Maidenhead SL6 2PZ" },
      { id: "p2", name: "Fredrick's Garden Suites", address: "Shoppenhangers Road, Maidenhead SL6 2PZ" },
    ],
    faqs: [
      { id: "f1", question: "Is parking included?", answer: "Yes, complimentary on-site parking is included for all guests." },
    ],
    approvalStatus: { profile: "Up to Date", hours: "Up to Date", gallery: "Up to Date", location: "Up to Date", contact: "Up to Date", faqs: "Changes Rejected" },
  },
};

export const AMENITY_OPTIONS = ["Free WiFi", "Parking", "Restaurant", "Bar", "Gym", "Pet-friendly", "Accessible rooms", "Swimming pool", "Spa", "Room service"];

export const SERVICES_LIST = ["General Enquiries", "Emergency Call-Outs", "Free Quotes"];
export const AREAS_COVERED_LIST = ["Maidenhead", "Windsor", "Marlow"];

// ─── Articles (max 3 per business) ─────────────────────────────────────────────
export const BUSINESS_ARTICLES = {
  biz_coppa: [
    { id: "art1", title: "Summer Terrace Happy Hour", type: "Offer", status: "Live", date: "2026-06-01", startDate: "2026-06-01", endDate: "2026-08-31",
      thumbnail: img("coppa-offer1", 300, 200), heroImage: img("coppa-offer1", 1200, 700), body: "50% off all cocktails on the terrace every weekday between 5-7pm." },
    { id: "art2", title: "New Autumn Menu", type: "News", status: "Pending Approval", date: "2026-08-20", startDate: "", endDate: "",
      thumbnail: img("coppa-news1", 300, 200), heroImage: img("coppa-news1", 1200, 700), body: "Our new autumn menu launches this September, featuring seasonal small plates and wood-fired specials." },
  ],
  biz_fredricks: [
    { id: "art3", title: "Spa Weekend Package", type: "Offer", status: "Live", date: "2026-05-10", startDate: "2026-05-10", endDate: "",
      thumbnail: img("fredricks-offer1", 300, 200), heroImage: img("fredricks-offer1", 1200, 700), body: "Book a two-night stay and receive a complimentary spa treatment for two." },
  ],
};

// ─── Reviews ────────────────────────────────────────────────────────────────────
export const BUSINESS_REVIEWS = {
  biz_coppa: [
    { id: "r1", reviewer: "Hannah B.", rating: 5, date: "2026-08-12", text: "Best riverside spot in Maidenhead — the fire pits make it perfect year-round.", reply: null },
    { id: "r2", reviewer: "Marcus T.", rating: 4, date: "2026-08-02", text: "Great food, lovely view. Service was a little slow on a busy Saturday.", reply: { text: "Thanks for the feedback Marcus — we're working on it!", status: "Pending Approval" } },
    { id: "r3", reviewer: "Priya A.", rating: 5, date: "2026-07-20", text: "Perfect spot for a summer evening. Highly recommend the wood-fired pizza.", reply: null },
    { id: "r4", reviewer: "Oliver K.", rating: 3, date: "2026-07-05", text: "Nice atmosphere but a bit pricey for what you get.", reply: null },
    { id: "r5", reviewer: "Grace L.", rating: 5, date: "2026-06-28", text: "Booked the terrace for a birthday — staff went above and beyond.", reply: null },
  ],
  biz_fredricks: [
    { id: "r6", reviewer: "David M.", rating: 5, date: "2026-08-15", text: "Beautiful hotel, excellent spa. Will be back.", reply: null },
    { id: "r7", reviewer: "Fiona R.", rating: 4, date: "2026-07-30", text: "Lovely gardens and comfortable rooms. Breakfast could be improved.", reply: null },
  ],
};

// ─── Support tickets ────────────────────────────────────────────────────────────
export const BUSINESS_SUPPORT_TICKETS = {
  biz_coppa: [
    { id: "st1", subject: "Can't upload new gallery photos", category: "Bug", status: "Open", submitted: "2026-08-26",
      thread: [{ from: "business", author: "James Whitfield", date: "2026-08-26 09:12", body: "Every time I try to upload a photo it just spins and never finishes." }] },
    { id: "st2", subject: "Question about upgrading my plan", category: "Billing", status: "Resolved", submitted: "2026-08-10",
      thread: [
        { from: "business", author: "James Whitfield", date: "2026-08-10 11:20", body: "What's included if I upgrade to Premium?" },
        { from: "admin", author: "Admin Support", date: "2026-08-10 13:02", body: "Premium adds featured placement, analytics and homepage spotlight eligibility." },
        { from: "business", author: "James Whitfield", date: "2026-08-10 13:40", body: "Great, thank you!" },
      ] },
    { id: "st3", subject: "Wrong opening hours after last edit", category: "Listing Issue", status: "In Progress", submitted: "2026-08-24",
      thread: [
        { from: "business", author: "James Whitfield", date: "2026-08-24 14:05", body: "My Saturday hours are showing incorrectly since my last approved edit." },
        { from: "admin", author: "Admin Support", date: "2026-08-24 16:40", body: "Thanks for flagging — looking into this now." },
      ] },
  ],
  biz_fredricks: [],
};

export const TICKET_CATEGORIES = ["General Question", "Listing Issue", "Billing", "Bug", "Other"];

// ─── Payment history ────────────────────────────────────────────────────────────
export const BUSINESS_PAYMENTS = {
  biz_coppa: [
    { date: "2026-08-12", description: "Standard plan — monthly", amount: "£39.00", status: "Paid" },
    { date: "2026-07-12", description: "Standard plan — monthly", amount: "£39.00", status: "Paid" },
    { date: "2026-06-12", description: "Standard plan — monthly", amount: "£39.00", status: "Paid" },
  ],
  biz_fredricks: [
    { date: "2026-09-01", description: "Hotel plan — up to 5 sites", amount: "£200.00", status: "Paid" },
    { date: "2026-08-01", description: "Hotel plan — up to 5 sites", amount: "£200.00", status: "Paid" },
  ],
};

export const ADD_ONS = [
  { id: "addon1", name: "Homepage Spotlight slot", description: "Feature your business on the homepage for 14 days.", price: "£45 for 14 days" },
  { id: "addon2", name: "Featured Article promotion", description: "Boost an article to the top of the News & Offers feed.", price: "£20 for 7 days" },
];

// ─── Team members ───────────────────────────────────────────────────────────────
export const BUSINESS_TEAM = {
  biz_coppa: [
    { id: "u1", name: "James Whitfield", email: "james@coppaclub.co.uk", role: "Owner" },
    { id: "u2", name: "Ella Marsh", email: "ella@coppaclub.co.uk", role: "Manager" },
  ],
  biz_fredricks: [
    { id: "u3", name: "Sarah Coombes", email: "sarah@fredricks-hotel.co.uk", role: "Owner" },
  ],
};
export const TEAM_ROLES = ["Owner", "Manager", "Staff", "Content Manager"];

// ─── Dashboard activity feed ────────────────────────────────────────────────────
export const DASHBOARD_ACTIVITY = {
  biz_coppa: [
    { id: "act1", text: "Admin approved your opening hours update.", date: "2026-08-27" },
    { id: "act2", text: "New review received from Hannah B. (5★).", date: "2026-08-12" },
    { id: "act3", text: "Article \"Summer Terrace Happy Hour\" went live.", date: "2026-06-01" },
    { id: "act4", text: "Admin approved your gallery images.", date: "2026-05-28" },
    { id: "act5", text: "Your account was approved and your listing went live.", date: "2026-04-03" },
  ],
  biz_fredricks: [
    { id: "act6", text: "Admin approved your profile update.", date: "2026-08-20" },
    { id: "act7", text: "New review received from David M. (5★).", date: "2026-08-15" },
  ],
};

export const PROFILE_COMPLETENESS = {
  biz_coppa: { percent: 85, missing: ["Add FAQs for more topics", "Add a booking URL confirmation email template"] },
  biz_fredricks: { percent: 70, missing: ["Upload more gallery photos", "Add a second registered property", "Complete amenities list"] },
};
