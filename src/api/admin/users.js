import { mock } from "../client";

// Mutable in-memory store — survives HMR within a session.
let USERS = [
  { id: "u1",  name: "Sarah Mitchell", email: "sarah@bloomflorist.co.uk",       business: "Bloom Florist",       role: "Business Owner", status: "Approved",  tier: "Premium",  joined: "2025-03-12", lastLogin: "2026-06-20" },
  { id: "u2",  name: "James Okafor",   email: "james@jameskitchen.co.uk",        business: "James's Kitchen",     role: "Business Owner", status: "Approved",  tier: "Standard", joined: "2025-06-01", lastLogin: "2026-06-18" },
  { id: "u4",  name: "Tom Whitfield",  email: "tom@whitfieldestates.co.uk",      business: "Whitfield Estates",   role: "Estate Agent",   status: "Approved",  tier: "Agent",    joined: "2024-11-08", lastLogin: "2026-06-17" },
  { id: "u5",  name: "Anita Sharma",   email: "anita@gourmetkitchen.co.uk",      business: "Gourmet Kitchen",     role: "Business Owner", status: "Pending",   tier: "Standard", joined: "2026-06-10", lastLogin: "2026-06-10" },
  { id: "u6",  name: "Emma Clarke",    email: "emma@thamesvalleyyoga.co.uk",     business: "Thames Valley Yoga",  role: "Business Owner", status: "Pending",   tier: "Basic",    joined: "2026-06-22", lastLogin: "2026-06-22" },
  { id: "u7",  name: "Linda Forsythe", email: "linda@maidenheadgifts.co.uk",     business: "Maidenhead Gifts",    role: "Business Owner", status: "Suspended", tier: "Basic",    joined: "2024-08-01", lastLogin: "2025-12-01" },
  { id: "u8",  name: "Rajiv Kapoor",   email: "rajiv@kapoorproperties.com",      business: "Kapoor Properties",   role: "Estate Agent",   status: "Approved",  tier: "Agent",    joined: "2025-02-19", lastLogin: "2026-06-15" },
  { id: "u9",  name: "Marcus Bell",    email: "marcus@bellelectrics.co.uk",      business: "Bell Electrics",      role: "Business Owner", status: "Rejected",  tier: "Basic",    joined: "2026-05-30", lastLogin: "2026-05-30" },
  { id: "u10", name: "Patrick Dunn",   email: "patrick@theclubhouse.co.uk",      business: "The Clubhouse",       role: "Business Owner", status: "Approved",  tier: "Premium",  joined: "2025-01-07", lastLogin: "2026-06-19" },
];

// Audit log — append-only
let AUDIT_LOG = [
  { id: "log1", timestamp: "2026-06-24T14:32:00Z", action: "Approved",  targetName: "Sarah Mitchell", targetId: "u1",  note: "" },
  { id: "log2", timestamp: "2026-06-23T09:15:00Z", action: "Approved",  targetName: "James Okafor",   targetId: "u2",  note: "" },
  { id: "log3", timestamp: "2026-06-20T11:05:00Z", action: "Suspended", targetName: "Linda Forsythe", targetId: "u7",  note: "Payment issues" },
  { id: "log4", timestamp: "2026-06-19T16:44:00Z", action: "Rejected",  targetName: "Marcus Bell",    targetId: "u9",  note: "Incomplete registration" },
];

let _logCounter = AUDIT_LOG.length + 1;

function addLog(action, user, note = "") {
  AUDIT_LOG = [
    {
      id: `log${_logCounter++}`,
      timestamp: new Date().toISOString(),
      action,
      targetName: user.name,
      targetId: user.id,
      note,
    },
    ...AUDIT_LOG,
  ];
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function getUsers({ role, status } = {}) {
  let list = USERS;
  if (role)   list = list.filter((u) => u.role === role);
  if (status) list = list.filter((u) => u.status === status);
  return mock(list);
}

export function getUserById(id) {
  return mock(USERS.find((u) => u.id === id) ?? null);
}

export function getAdminLogs() {
  return mock(AUDIT_LOG);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function approveUser(id) {
  const u = USERS.find((x) => x.id === id);
  if (!u) return mock({ ok: false });
  u.status = "Approved";
  addLog("Approved", u);
  return mock({ ok: true });
}

export function rejectUser(id) {
  const u = USERS.find((x) => x.id === id);
  if (!u) return mock({ ok: false });
  u.status = "Rejected";
  addLog("Rejected", u);
  return mock({ ok: true });
}

export function suspendUser(id) {
  const u = USERS.find((x) => x.id === id);
  if (!u) return mock({ ok: false });
  u.status = "Suspended";
  addLog("Suspended", u);
  return mock({ ok: true });
}

export function deleteUser(id) {
  const u = USERS.find((x) => x.id === id);
  if (!u) return mock({ ok: false });
  addLog("Deleted account", u);
  USERS = USERS.filter((x) => x.id !== id);
  return mock({ ok: true });
}

export function getRecentActivity() {
  return mock([]);
}
