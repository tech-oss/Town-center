import { mock } from "../client";

const APPROVALS = [
  { id: "a1", type: "Listing Edit", business: "Bloom Florist", submittedBy: "Sarah Mitchell", submittedAt: "2026-06-20T09:15:00Z", status: "Pending", source: "manual", summary: "Updated opening hours and added 2 new gallery images.", preview: { name: "Bloom Florist", category: "Shop", change: "Hours + gallery" } },
  { id: "a2", type: "New Listing", business: "Spice Garden Restaurant", submittedBy: "Anita Sharma", submittedAt: "2026-06-20T11:30:00Z", status: "Pending", source: "manual", summary: "New business listing for an Indian restaurant on King Street.", preview: { name: "Spice Garden", category: "Eat & Drink", change: "New listing" } },
  { id: "a3", type: "Offer / Promotion", business: "James's Kitchen", submittedBy: "James Okafor", submittedAt: "2026-06-19T14:00:00Z", status: "Pending", source: "manual", summary: "20% off lunch Monday–Friday, valid until 31 July 2026.", preview: { name: "James's Kitchen", category: "Promotion", change: "New offer" } },
  { id: "a4", type: "Property", business: "Whitfield Estates", submittedBy: "XML Feed", submittedAt: "2026-06-21T06:00:00Z", status: "Auto-published", source: "xml", summary: "4 new properties imported from Whitfield Estates XML feed. Auto-published per feed agreement.", preview: { name: "Whitfield Estates Feed", category: "Property", change: "4 listings" } },
  { id: "a5", type: "Listing Edit", business: "The Clubhouse", submittedBy: "Patrick Dunn", submittedAt: "2026-06-18T10:00:00Z", status: "Approved", source: "manual", summary: "Changed business description and phone number.", preview: { name: "The Clubhouse", category: "See & Do", change: "Description + phone" } },
  { id: "a6", type: "New Listing", business: "Maidenhead Gifts", submittedBy: "Linda Forsythe", submittedAt: "2026-06-17T16:00:00Z", status: "Rejected", source: "manual", summary: "New gift shop listing — rejected: duplicate of existing entry.", preview: { name: "Maidenhead Gifts", category: "Shop", change: "New listing" }, rejectionReason: "Duplicate of existing entry for 'Maidenhead Gifts & Cards'." },
  { id: "a7", type: "Property", business: "Kapoor Properties", submittedBy: "XML Feed", submittedAt: "2026-06-21T06:00:00Z", status: "Auto-published", source: "xml", summary: "7 properties imported from Kapoor Properties XML feed.", preview: { name: "Kapoor Properties Feed", category: "Property", change: "7 listings" } },
];

export function getApprovals({ status } = {}) {
  let list = APPROVALS;
  if (status) list = list.filter((a) => a.status === status);
  return mock(list);
}

export function approveItem(id) {
  return mock({ id, status: "Approved" });
}

export function rejectItem(id, reason) {
  return mock({ id, status: "Rejected", rejectionReason: reason });
}
