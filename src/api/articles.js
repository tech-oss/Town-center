// Articles resource (News & Offers / Journal).
//
// Live news & offers from Premium businesses (Supabase) are included alongside
// the static demo articles, so a card on a real business page opens a real
// article page.
import { allArticles, articleBySlug } from "../Data/pages";
import { allStayArticles, stayArticleBySlug } from "../Data/stay";
import { loadLiveBusinesses } from "./liveBusinesses";

const combinedArticles = [...allArticles, ...allStayArticles];
const combinedArticleBySlug = { ...articleBySlug, ...stayArticleBySlug };

async function liveArticles() {
  const live = await loadLiveBusinesses();
  return live.flatMap((b) => b.news ?? []);
}

export async function getArticles() {
  return [...(await liveArticles()), ...combinedArticles];
}

export async function getArticleBySlug(slug) {
  if (combinedArticleBySlug[slug]) return combinedArticleBySlug[slug];
  return (await liveArticles()).find((a) => a.slug === slug) ?? null;
}
