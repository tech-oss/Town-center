// ─── Mock data for the admin Subscription Overview & Documents screens ───────
// Frontend-only placeholder data — nothing here is persisted.

import { TIER_FEATURES } from "./adminMissingScreensMock";

// Icon shown next to the plan name in the summary card.
export const TIER_ICONS = { Free: "✈️", Basic: "✈️", Standard: "⭐", Premium: "👑", Agent: "👑" };

// TIER_FEATURES lists each tier's *own* additions, using an "Everything in
// X" shorthand for inherited features rather than repeating them — resolve
// that recursively into a flat, concrete feature list per tier so the
// "What they get" checklist can do a simple membership check.
const TIER_ORDER = ["Free", "Basic", "Standard", "Premium"];

export function resolveTierFeatures(tier, seen = new Set()) {
  if (seen.has(tier)) return [];
  seen.add(tier);
  const raw = TIER_FEATURES[tier] ?? TIER_FEATURES[TIER_ORDER[TIER_ORDER.length - 1]] ?? [];
  const resolved = [];
  for (const item of raw) {
    const match = /^Everything in (.+)$/.exec(item);
    if (match) resolved.push(...resolveTierFeatures(match[1], seen));
    else resolved.push(item);
  }
  return resolved;
}

// Superset of every concrete feature across all tiers, in tier order, used
// to render the "What they get" two-column checklist (checked for included,
// greyed out otherwise).
export const ALL_PLAN_FEATURES = [...new Set(TIER_ORDER.flatMap((t) => resolveTierFeatures(t)))];

// ─── Documents tab — Receipts ──────────────────────────────────────────────────
export const SUBSCRIPTION_RECEIPTS = {
  s1: [
    { date: "2026-06-12", number: "RCT-2026-0612", amount: "£79.00", status: "Paid" },
    { date: "2026-05-12", number: "RCT-2026-0512", amount: "£79.00", status: "Paid" },
  ],
  s2: [
    { date: "2026-06-01", number: "RCT-2026-0601", amount: "£39.00", status: "Paid" },
  ],
  s3: [
    { date: "2025-11-08", number: "RCT-2025-1108", amount: "£39.00", status: "Paid" },
  ],
  s4: [
    { date: "2026-01-07", number: "RCT-2026-0107", amount: "£948.00", status: "Paid" },
    { date: "2025-01-07", number: "RCT-2025-0107", amount: "£948.00", status: "Paid" },
  ],
  s5: [],
};

// ─── Documents tab — Terms Acceptance (the audit record) ─────────────────────
export const SUBSCRIPTION_TERMS_ACCEPTANCE = {
  s1: {
    documents: [
      { document: "Business Town Terms & Conditions", version: "v2.1", acceptedOn: "2025-09-12 10:14", },
      { document: "Subscription Terms", version: "v1.4", acceptedOn: "2026-03-12 09:02" },
    ],
    details: {
      businessName: "Bloom Florist",
      acceptedBy: "sarah@bloomflorist.co.uk",
      ipAddress: "82.132.14.201",
      userAgent: "Chrome on macOS",
      acceptanceMethod: "Checkbox on website",
      reference: "Account Registration",
    },
  },
  s2: {
    documents: [
      { document: "Business Town Terms & Conditions", version: "v2.0", acceptedOn: "2025-06-01 08:47" },
      { document: "Subscription Terms", version: "v1.3", acceptedOn: "2025-06-01 08:49" },
    ],
    details: {
      businessName: "James's Kitchen",
      acceptedBy: "james@jameskitchen.co.uk",
      ipAddress: "51.7.88.19",
      userAgent: "Safari on iOS",
      acceptanceMethod: "Checkbox on website",
      reference: "Account Registration",
    },
  },
  s3: {
    documents: [
      { document: "Business Town Terms & Conditions", version: "v1.9", acceptedOn: "2024-08-01 12:30" },
    ],
    details: {
      businessName: "Maidenhead Gifts",
      acceptedBy: "linda@maidenheadgifts.co.uk",
      ipAddress: "90.201.44.6",
      userAgent: "Edge on Windows",
      acceptanceMethod: "Checkbox on website",
      reference: "Account Registration",
    },
  },
  s4: {
    documents: [
      { document: "Business Town Terms & Conditions", version: "v2.1", acceptedOn: "2025-01-07 09:15" },
      { document: "Subscription Terms", version: "v1.4", acceptedOn: "2025-01-07 09:18" },
    ],
    details: {
      businessName: "The Clubhouse",
      acceptedBy: "patrick@theclubhouse.co.uk",
      ipAddress: "123.456.78.90",
      userAgent: "Chrome on Windows",
      acceptanceMethod: "Checkbox on website",
      reference: "Subscription Checkout",
    },
  },
  s5: {
    documents: [
      { document: "Business Town Terms & Conditions", version: "v2.1", acceptedOn: "2026-06-10 16:02" },
    ],
    details: {
      businessName: "Spice Garden",
      acceptedBy: "anita@spicegarden.co.uk",
      ipAddress: "31.55.201.9",
      userAgent: "Chrome on Android",
      acceptanceMethod: "Checkbox on website",
      reference: "Account Registration",
    },
  },
};
