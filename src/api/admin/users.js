import { mock } from "../client";

const USERS = [
  { id: "u1", name: "Sarah Mitchell", email: "sarah@bloomflorist.co.uk", role: "Business Owner", status: "Active", tier: "Premium", joined: "2025-03-12", lastLogin: "2026-06-20" },
  { id: "u2", name: "James Okafor", email: "james@jameskitchen.co.uk", role: "Business Owner", status: "Active", tier: "Standard", joined: "2025-06-01", lastLogin: "2026-06-18" },
  { id: "u3", name: "Priya Nair", email: "priya.nair@gmail.com", role: "Public", status: "Active", tier: null, joined: "2026-01-15", lastLogin: "2026-06-19" },
  { id: "u4", name: "Tom Whitfield", email: "tom@whitfieldestates.co.uk", role: "Estate Agent", status: "Active", tier: "Agent", joined: "2024-11-08", lastLogin: "2026-06-17" },
  { id: "u5", name: "Anita Sharma", email: "anita@gourmetkitchen.co.uk", role: "Business Owner", status: "Pending", tier: "Standard", joined: "2026-06-10", lastLogin: "2026-06-10" },
  { id: "u6", name: "Marcus Bell", email: "marcus.bell@gmail.com", role: "Public", status: "Active", tier: null, joined: "2025-09-22", lastLogin: "2026-05-30" },
  { id: "u7", name: "Linda Forsythe", email: "linda@maidenheadgifts.co.uk", role: "Business Owner", status: "Lapsed", tier: "Basic", joined: "2024-08-01", lastLogin: "2025-12-01" },
  { id: "u8", name: "Rajiv Kapoor", email: "rajiv@kapoorproperties.com", role: "Estate Agent", status: "Active", tier: "Agent", joined: "2025-02-19", lastLogin: "2026-06-15" },
  { id: "u9", name: "Emma Clarke", email: "emma.clarke@gmail.com", role: "Public", status: "Active", tier: null, joined: "2026-04-03", lastLogin: "2026-06-20" },
  { id: "u10", name: "Patrick Dunn", email: "patrick@theclubhouse.co.uk", role: "Business Owner", status: "Active", tier: "Premium", joined: "2025-01-07", lastLogin: "2026-06-19" },
];

const ACTIVITY_LOG = [
  { id: "u2", action: "Updated business profile", time: "2 hours ago" },
  { id: "u5", action: "Submitted listing for approval", time: "5 hours ago" },
  { id: "u3", action: "Registered as Public user", time: "8 hours ago" },
  { id: "u1", action: "Upgraded to Premium tier", time: "1 day ago" },
  { id: "u8", action: "Added 3 new property listings", time: "1 day ago" },
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
