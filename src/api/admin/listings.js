import { mock } from "../client";

const LISTINGS = [
  { id: "l1", name: "Bloom Florist", section: "Shop", category: "Flowers", owner: "Sarah Mitchell", status: "Active", tier: "Premium", lastUpdated: "2026-06-20" },
  { id: "l2", name: "James's Kitchen", section: "Eat & Drink", category: "Cafe", owner: "James Okafor", status: "Active", tier: "Standard", lastUpdated: "2026-06-18" },
  { id: "l3", name: "The Clubhouse", section: "See & Do", category: "Sports", owner: "Patrick Dunn", status: "Active", tier: "Premium", lastUpdated: "2026-06-19" },
  { id: "l4", name: "Maidenhead Gifts", section: "Shop", category: "Gifts", owner: "Linda Forsythe", status: "Lapsed", tier: "Basic", lastUpdated: "2025-12-01" },
  { id: "l5", name: "Spice Garden", section: "Eat & Drink", category: "Restaurant", owner: "Anita Sharma", status: "Pending", tier: "Standard", lastUpdated: "2026-06-10" },
  { id: "l6", name: "ODEON Luxe Maidenhead", section: "See & Do", category: "Film", owner: "Admin", status: "Active", tier: "Premium", lastUpdated: "2026-06-01" },
  { id: "l7", name: "Gourmet Kitchen", section: "Eat & Drink", category: "Restaurant", owner: "Anita Sharma", status: "Active", tier: "Standard", lastUpdated: "2026-05-15" },
  { id: "l8", name: "Thames Valley Yoga", section: "See & Do", category: "Wellness", owner: "Emma Clarke", status: "Active", tier: "Basic", lastUpdated: "2026-04-20" },
];

export function getListings({ section, status } = {}) {
  let list = LISTINGS;
  if (section) list = list.filter((l) => l.section === section);
  if (status) list = list.filter((l) => l.status === status);
  return mock(list);
}

export function getListingById(id) {
  return mock(LISTINGS.find((l) => l.id === id) ?? null);
}

export function removeListing(id) {
  return mock({ id, removed: true });
}
