// Articles resource (News & Offers / Journal).
import { allArticles, articleBySlug } from "../Data/pages";
import { allStayArticles, stayArticleBySlug } from "../Data/stay";
import { mock } from "./client";

const combinedArticles = [...allArticles, ...allStayArticles];
const combinedArticleBySlug = { ...articleBySlug, ...stayArticleBySlug };

export function getArticles() {
  return mock(combinedArticles);
}

export function getArticleBySlug(slug) {
  return mock(combinedArticleBySlug[slug] ?? null);
}
