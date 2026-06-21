// Events resource (What's On).
import { events, eventBySlug } from "../Data/events";
import { mock } from "./client";

export function getEvents() {
  return mock(events);
}

export function getEventBySlug(slug) {
  return mock(eventBySlug[slug] ?? null);
}
