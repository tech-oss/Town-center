import { mock } from "../client";

const USERS = [
  { id: "u1", name: "Sarah Mitchell", email: "sarah@bloomflorist.co.uk", business: "Bloom Florist", role: "Business Owner", status: "Active", tier: "Premium", joined: "2025-03-12", lastLogin: "2026-06-20" },
  { id: "u2", name: "James Okafor", email: "james@jameskitchen.co.uk", business: "James's Kitchen", role: "Business Owner", status: "Active", tier: "Standard", joined: "2025-06-01", lastLogin: "2026-06-18" },
  { id: "u4", name: "Tom Whitfield", email: "tom@whitfieldestates.co.uk", business: "Whitfield Estates", role: "Estate Agent", status: "Active", tier: "Agent", joined: "2024-11-08", lastLogin: "2026-06-17" },
  { id: "u5", name: "Anita Sharma", email: "anita@gourmetkitchen.co.uk", business: "Gourmet Kitchen", role: "Business Owner", status: "Pending", tier: "Standard", joined: "2026-06-10", lastLogin: "2026-06-10" },
  { id: "u7", name: "Linda Forsythe", email: "linda@maidenheadgifts.co.uk", business: "Maidenhead Gifts", role: "Business Owner", status: "Lapsed", tier: "Basic", joined: "2024-08-01", lastLogin: "2025-12-01" },
  { id: "u8", name: "Rajiv Kapoor", email: "rajiv@kapoorproperties.com", business: "Kapoor Properties", role: "Estate Agent", status: "Active", tier: "Agent", joined: "2025-02-19", lastLogin: "2026-06-15" },
  { id: "u10", name: "Patrick Dunn", email: "patrick@theclubhouse.co.uk", business: "The Clubhouse", role: "Business Owner", status: "Active", tier: "Premium", joined: "2025-01-07", lastLogin: "2026-06-19" },
];

const ACTIVITY_LOG = [
  { id: "u2", action: "Updated business profile", time: "2 hours ago" },
  { id: "u5", action: "Submitted listing for approval", time: "5 hours ago" },
  { id: "u1", action: "Upgraded to Premium tier", time: "1 day ago" },
  { id: "u8", action: "Added 3 new property listings", time: "1 day ago" },
  { id: "u7", action: "Subscription lapsed", time: "2 days ago" },
];

export function getUsers({ role, status } = {}) {
  let list = USERS;
  if (role) list = list.filter((u) => u.role === role);
  if (status) list = list.filter((u) => u.status === status);
  return mock(list);
}

export function getUserById(id) {
  return mock(USERS.find((u) => u.id === id) ?? null);
}

export function getRecentActivity() {
  return mock(ACTIVITY_LOG.map((a) => ({ ...a, user: USERS.find((u) => u.id === a.id) })));
}
