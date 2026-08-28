import { mock } from "../client";

// ─── Registered businesses (UI-only mock) ─────────────────────────────────────
// status: "Pending" (awaiting admin approval), "Approved" (users can log in),
//         "Rejected" (declined)
let BUSINESSES = [
  {
    id: "b1",
    name: "The Velvet Lounge",
    category: "Eat & Drink",
    contactName: "Olivia Grant",
    email: "olivia@velvetlounge.co.uk",
    phone: "01628 555 102",
    address: "14 High Street, Maidenhead SL6 1JF",
    plan: "Premium",
    submitted: "2026-06-20",
    status: "Pending",
  },
  {
    id: "b2",
    name: "Riverside Yoga Studio",
    category: "Fitness & Wellbeing",
    contactName: "Daniel Reeves",
    email: "hello@riversideyoga.co.uk",
    phone: "01628 555 233",
    address: "3 Bridge Road, Maidenhead SL6 8DX",
    plan: "Standard",
    submitted: "2026-06-19",
    status: "Pending",
  },
  {
    id: "b3",
    name: "Maidenhead Book Nook",
    category: "Shopping",
    contactName: "Priya Anand",
    email: "priya@booknook.co.uk",
    phone: "01628 555 419",
    address: "27 King Street, Maidenhead SL6 1EF",
    plan: "Basic",
    submitted: "2026-06-17",
    status: "Approved",
  },
  {
    id: "b4",
    name: "Castle Hill Dental",
    category: "Health & Services",
    contactName: "Dr. Mark Ellison",
    email: "admin@castlehilldental.co.uk",
    phone: "01628 555 870",
    address: "5 Castle Hill, Maidenhead SL6 4AA",
    plan: "Standard",
    submitted: "2026-06-15",
    status: "Approved",
  },
  {
    id: "b5",
    name: "Quickfix Phone Repairs",
    category: "Services",
    contactName: "Sam Drake",
    email: "sam@quickfixrepairs.co.uk",
    phone: "01628 555 661",
    address: "9 Queen Street, Maidenhead SL6 1HZ",
    plan: "Basic",
    submitted: "2026-06-12",
    status: "Rejected",
  },
];

export const BUSINESS_CATEGORIES = [
  "Eat & Drink",
  "Shopping",
  "Fitness & Wellbeing",
  "Arts & Culture",
  "Health & Services",
  "Services",
  "Property",
  "Other",
];

export const BUSINESS_PLANS = ["Basic", "Standard", "Premium"];

export function getBusinesses({ status } = {}) {
  let list = [...BUSINESSES];
  if (status) list = list.filter((b) => b.status === status);
  return mock(list);
}

export function getBusinessById(id) {
  return mock(BUSINESSES.find((b) => b.id === id) ?? null);
}

export function registerBusiness(data) {
  const saved = {
    ...data,
    id: data.id || `b${Date.now()}`,
    submitted: data.submitted || new Date().toISOString().slice(0, 10),
    status: data.status || "Pending",
  };
  if (data.id) {
    BUSINESSES = BUSINESSES.map((b) => (b.id === data.id ? saved : b));
  } else {
    BUSINESSES = [saved, ...BUSINESSES];
  }
  return mock(saved);
}

export function approveBusiness(id) {
  BUSINESSES = BUSINESSES.map((b) => (b.id === id ? { ...b, status: "Approved" } : b));
  return mock({ id, status: "Approved" });
}

export function rejectBusiness(id) {
  BUSINESSES = BUSINESSES.map((b) => (b.id === id ? { ...b, status: "Rejected" } : b));
  return mock({ id, status: "Rejected" });
}
