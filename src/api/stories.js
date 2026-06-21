// Stories resource (Featured articles / long-form features).
import { features, featureBySlug } from "../Data/features";
import { mock } from "./client";

export function getStories() {
  return mock(features);
}

export function getStoryBySlug(slug) {
  return mock(featureBySlug[slug] ?? null);
}
