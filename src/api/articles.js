// Articles resource (News & Offers / Journal).
import { allArticles, articleBySlug } from "../Data/pages";
import { mock } from "./client";

export function getArticles() {
  return mock(allArticles);
}

export function getArticleBySlug(slug) {
  return mock(articleBySlug[slug] ?? null);
}
