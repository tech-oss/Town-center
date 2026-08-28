import { mock } from "../client";

const APPROVALS = [
  {
    id: "a1",
    type: "Listing Edit",
    business: "Bloom Florist",
    submittedBy: "Sarah Mitchell",
    submittedAt: "2026-06-20T09:15:00Z",
    status: "Pending",
    source: "manual",
    summary: "Updated opening hours and added 2 new gallery images.",
    detail: {
      section: "Shop",
      category: "Flowers & Plants",
      // Changed fields shown as before → after
      changes: [
        {
          field: "Opening Hours",
          before: "Mon–Sat 9am–5pm, Sun Closed",
          after: "Mon–Sat 9am–6pm, Sun 10am–4pm",
          changed: true,
        },
        {
          field: "Gallery Images",
          before: "3 images",
          after: "5 images (2 added)",
          changed: true,
        },
        {
          field: "Business Name",
          before: "Bloom Florist",
          after: "Bloom Florist",
          changed: false,
        },
        {
          field: "Address",
          before: "14 King Street, Maidenhead SL6 1DT",
          after: "14 King Street, Maidenhead SL6 1DT",
          changed: false,
        },
        {
          field: "Phone",
          before: "01628 123456",
          after: "01628 123456",
          changed: false,
        },
      ],
      newImages: ["/images/events/market.jpg", "/images/events/popup.jpg"],
      currentListing: {
        name: "Bloom Florist",
        address: "14 King Street, Maidenhead SL6 1DT",
        phone: "01628 123456",
        website: "bloomflorist-maidenhead.co.uk",
        description: "Award-winning florist serving Maidenhead since 2008. Weddings, events, and everyday bouquets made to order.",
        image: "/images/events/market.jpg",
      },
    },
  },
  {
    id: "a2",
    type: "New Listing",
    business: "Spice Garden Restaurant",
    submittedBy: "Anita Sharma",
    submittedAt: "2026-06-20T11:30:00Z",
    status: "Pending",
    source: "manual",
    summary: "New business listing for an Indian restaurant on King Street.",
    detail: {
      section: "Eat & Drink",
      category: "Restaurant",
      listing: {
        name: "Spice Garden Restaurant",
        address: "42 King Street, Maidenhead SL6 1EY",
        phone: "01628 789012",
        website: "spicegardenrestaurant.co.uk",
        email: "bookings@spicegarden.co.uk",
        description: "Authentic North Indian cuisine in the heart of Maidenhead town centre. Our chefs bring recipes from Rajasthan and Punjab, using freshly ground spices and locally sourced produce. Dine-in, takeaway, and private event catering available.",
        hours: "Mon–Thu 12pm–2:30pm, 5:30pm–10:30pm | Fri–Sat 12pm–3pm, 5pm–11pm | Sun 12pm–10pm",
        image: "/images/events/popup.jpg",
        gallery: ["/images/events/popup.jpg", "/images/events/market.jpg"],
        tags: ["Halal", "Vegetarian options", "Takeaway", "Private dining"],
        tier: "Standard",
      },
    },
  },
  {
    id: "a3",
    type: "Offer / Promotion",
    business: "James's Kitchen",
    submittedBy: "James Okafor",
    submittedAt: "2026-06-19T14:00:00Z",
    status: "Pending",
    source: "manual",
    summary: "20% off lunch Monday–Friday, valid until 31 July 2026.",
    detail: {
      section: "Eat & Drink",
      category: "Café",
      offer: {
        title: "20% Off Weekday Lunch",
        headline: "Treat yourself to a great lunch deal at James's Kitchen",
        description: "Enjoy 20% off your entire food order when dining in Monday to Friday, 12pm–3pm. Applies to our full lunch menu including sandwiches, hot dishes, and specials. Not valid with other offers or on bank holidays.",
        discount: "20% off food orders",
        validFrom: "2026-06-23",
        validUntil: "2026-07-31",
        days: "Monday – Friday",
        time: "12pm – 3pm",
        conditions: "Dine-in only. Not combinable with other offers. Excludes bank holidays.",
        code: "LUNCH20",
        image: "/images/events/popup.jpg",
      },
      currentListing: {
        name: "James's Kitchen",
        address: "8 High Street, Maidenhead SL6 1QJ",
        phone: "01628 445566",
        image: "/images/events/market.jpg",
      },
    },
  },
  {
    id: "a4",
    type: "Property Import",
    business: "Whitfield Estates",
    submittedBy: "XML Feed",
    submittedAt: "2026-06-21T06:00:00Z",
    status: "Auto-published",
    source: "xml",
    summary: "4 new properties imported from Whitfield Estates XML feed. Auto-published per feed agreement.",
    detail: {
      feedName: "Whitfield Estates",
      feedUrl: "https://feeds.whitfieldestates.co.uk/maidenhead.xml",
      syncedAt: "2026-06-21T06:00:00Z",
      imported: 4,
      skipped: 0,
      properties: [
        { id: "WE-4501", address: "12 King Street, SL6 1DT", type: "Flat", beds: 2, price: "£425,000", status: "For Sale" },
        { id: "WE-4502", address: "22 Bray Road, SL6 2AP", type: "House", beds: 3, price: "£650,000", status: "For Sale" },
        { id: "WE-4503", address: "Flat 3, One Maidenhead", type: "Flat", beds: 1, price: "£385,000", status: "For Sale" },
        { id: "WE-4504", address: "7 Castle Hill Ave, SL6 4AD", type: "House", beds: 4, price: "£2,200/mo", status: "To Let" },
      ],
    },
  },
  {
    id: "a5",
    type: "Listing Edit",
    business: "The Clubhouse",
    submittedBy: "Patrick Dunn",
    submittedAt: "2026-06-18T10:00:00Z",
    status: "Approved",
    source: "manual",
    summary: "Changed business description and phone number.",
    detail: {
      section: "See & Do",
      category: "Sports & Leisure",
      changes: [
        { field: "Description", before: "Maidenhead's premier sports and social club.", after: "Maidenhead's premier sports and social club — now open for non-members on weekends. Golf, tennis, gym and bar facilities.", changed: true },
        { field: "Phone", before: "01628 334455", after: "01628 334400", changed: true },
        { field: "Business Name", before: "The Clubhouse", after: "The Clubhouse", changed: false },
        { field: "Address", before: "Boulters Lane, Maidenhead SL6 8JD", after: "Boulters Lane, Maidenhead SL6 8JD", changed: false },
      ],
      currentListing: {
        name: "The Clubhouse",
        address: "Boulters Lane, Maidenhead SL6 8JD",
        phone: "01628 334400",
        image: "/images/events/duck-derby.jpg",
      },
    },
  },
  {
    id: "a6",
    type: "New Listing",
    business: "Maidenhead Gifts",
    submittedBy: "Linda Forsythe",
    submittedAt: "2026-06-17T16:00:00Z",
    status: "Rejected",
    source: "manual",
    summary: "New gift shop listing — rejected: duplicate of existing entry.",
    rejectionReason: "Duplicate of existing entry for 'Maidenhead Gifts & Cards'.",
    detail: {
      section: "Shop",
      category: "Gifts & Cards",
      listing: {
        name: "Maidenhead Gifts",
        address: "3 Queen Street, Maidenhead SL6 1HZ",
        phone: "01628 221133",
        website: "maidenheadgifts.co.uk",
        email: "hello@maidenheadgifts.co.uk",
        description: "Unique gifts, cards and homeware for every occasion. Stocking local artists and independent brands.",
        hours: "Mon–Sat 9:30am–5:30pm",
        image: "/images/events/market.jpg",
        gallery: ["/images/events/market.jpg"],
        tags: ["Local artists", "Cards", "Homeware"],
        tier: "Basic",
      },
    },
  },
  {
    id: "a7",
    type: "Property Import",
    business: "Kapoor Properties",
    submittedBy: "XML Feed",
    submittedAt: "2026-06-21T06:00:00Z",
    status: "Auto-published",
    source: "xml",
    summary: "7 properties imported from Kapoor Properties XML feed.",
    detail: {
      feedName: "Kapoor Properties",
      feedUrl: "https://data.kapoorproperties.com/export/sl6.xml",
      syncedAt: "2026-06-21T06:00:00Z",
      imported: 7,
      skipped: 0,
      properties: [
        { id: "KP-201", address: "5 Queen Street, SL6 1EY", type: "House", beds: 4, price: "£875,000", status: "For Sale" },
        { id: "KP-202", address: "18 Ray Mill Road, SL6 8SP", type: "Flat", beds: 2, price: "£310,000", status: "For Sale" },
        { id: "KP-203", address: "Apt 9, Harvest Hill, SL6", type: "Flat", beds: 1, price: "£1,400/mo", status: "To Let" },
        { id: "KP-204", address: "31 Braywick Rd, SL6 1DA", type: "House", beds: 3, price: "£595,000", status: "For Sale" },
        { id: "KP-205", address: "2 Castle Hill Ave, SL6 4AD", type: "Flat", beds: 2, price: "£1,750/mo", status: "To Let" },
        { id: "KP-206", address: "14 Bridge Rd, SL6 8JA", type: "House", beds: 5, price: "£1,100,000", status: "For Sale" },
        { id: "KP-207", address: "Flat 2, Spring Hill, SL6", type: "Flat", beds: 2, price: "£1,950/mo", status: "To Let" },
      ],
    },
  },
];

export function getApprovals({ status } = {}) {
  let list = APPROVALS;
  if (status) list = list.filter((a) => a.status === status);
  return mock(list);
}

export function getApprovalById(id) {
  return mock(APPROVALS.find((a) => a.id === id) ?? null);
}

export function approveItem(id) {
  return mock({ id, status: "Approved" });
}

export function rejectItem(id, reason) {
  return mock({ id, status: "Rejected", rejectionReason: reason });
}

export function deleteItem(id) {
  return mock({ id, deleted: true });
}

export function deleteItems(ids) {
  return mock({ ids, deleted: true });
}
