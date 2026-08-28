import { mock } from "../client";

const PROPERTIES = [
  { id: "p1", address: "12 King Street, SL6 1DT", agent: "Whitfield Estates", type: "Flat", beds: 2, price: "£425,000", status: "Approved", source: "manual", listedAt: "2026-06-15" },
  { id: "p2", address: "5 Queen Street, SL6 1EY", agent: "Kapoor Properties", type: "House", beds: 4, price: "£875,000", status: "Auto-published", source: "xml", listedAt: "2026-06-21" },
  { id: "p3", address: "Flat 3, One Maidenhead", agent: "Whitfield Estates", type: "Flat", beds: 1, price: "£385,000", status: "Auto-published", source: "xml", listedAt: "2026-06-21" },
  { id: "p4", address: "22 Bray Road, SL6 2AP", agent: "Whitfield Estates", type: "House", beds: 3, price: "£650,000", status: "Auto-published", source: "xml", listedAt: "2026-06-21" },
  { id: "p5", address: "Apartment 12, Harvest Hill", agent: "Taylor Wimpey", type: "Flat", beds: 2, price: "£2,100/mo", status: "Auto-published", source: "xml", listedAt: "2026-06-20" },
  { id: "p6", address: "10 Castle Hill Ave, SL6 4AD", agent: null, type: "House", beds: 5, price: "£1,200,000", status: "Pending", source: "manual", listedAt: "2026-06-19" },
  { id: "p7", address: "Flat 8, Spring Hill", agent: "Berkeley Group", type: "Flat", beds: 2, price: "£1,850/mo", status: "Auto-published", source: "xml", listedAt: "2026-06-18" },
];

const FEEDS = [
  { id: "f1", name: "Whitfield Estates", url: "https://feeds.whitfieldestates.co.uk/maidenhead.xml", lastSync: "2026-06-21T06:00:00Z", imported: 18, skipped: 2, errors: 0, skipLog: ["Invalid postcode on ID #4512", "Missing price on ID #4498"] },
  { id: "f2", name: "Kapoor Properties", url: "https://data.kapoorproperties.com/export/sl6.xml", lastSync: "2026-06-21T06:00:00Z", imported: 7, skipped: 0, errors: 1, skipLog: ["Network timeout on retry #3 for ID #201"] },
  { id: "f3", name: "Berkeley Group", url: "https://api.berkeleygroup.co.uk/feeds/spring-hill.xml", lastSync: "2026-06-20T18:00:00Z", imported: 12, skipped: 1, errors: 0, skipLog: ["Duplicate listing ID #88 — already imported"] },
];

export function getAdminProperties({ source, status } = {}) {
  let list = PROPERTIES;
  if (source) list = list.filter((p) => p.source === source);
  if (status) list = list.filter((p) => p.status === status);
  return mock(list);
}

export function getFeeds() {
  return mock(FEEDS);
}
