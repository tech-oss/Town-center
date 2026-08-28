import { mock } from "../client";

const EVENTS = [
  { id: "e1", title: "Duck Derby & Fun Day", category: "Family", date: "2026-06-14", status: "Published", featured: false, author: "Admin" },
  { id: "e2", title: "Maidenhead Farmers' Market", category: "Market", date: "Recurring", status: "Published", featured: true, author: "Admin" },
  { id: "e3", title: "Norden Farm Summer Gala", category: "Theatre", date: "2026-07-19", status: "Published", featured: false, author: "Admin" },
  { id: "e4", title: "Thames Riverside 5K", category: "Sport", date: "2026-08-02", status: "Draft", featured: false, author: "Admin" },
  { id: "e5", title: "Maidenhead Festival Opening Night", category: "Music", date: "2026-07-04", status: "Published", featured: true, author: "Admin" },
];

const NEWS = [
  { id: "n1", title: "Elizabeth Line ridership hits record high", category: "Transport", published: "2026-06-01", status: "Published", featured: true, author: "Admin" },
  { id: "n2", title: "New independent café opens on High Street", category: "Business", published: "2026-05-20", status: "Published", featured: false, author: "Admin" },
  { id: "n3", title: "Maidenhead FC Youth Academy launches", category: "Sport", published: "2026-05-10", status: "Draft", featured: false, author: "Admin" },
  { id: "n4", title: "Town centre footfall up 18% year-on-year", category: "Retail", published: "2026-04-28", status: "Published", featured: false, author: "Admin" },
];

export function getAdminEvents() { return mock(EVENTS); }
export function saveEvent(event) { return mock({ ...event, id: event.id || `e${Date.now()}` }); }
export function deleteEvent(id) { return mock({ id, deleted: true }); }

export function getAdminNews() { return mock(NEWS); }
export function saveNews(item) { return mock({ ...item, id: item.id || `n${Date.now()}` }); }
export function deleteNews(id) { return mock({ id, deleted: true }); }
