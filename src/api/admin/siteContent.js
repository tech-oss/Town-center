import { supabase } from "../../lib/supabaseClient";

// Site-owned content: the town's own events and news, projects, homepage
// spotlight and featured stories, editorial articles and area guides, plus the
// section copy and platform settings. All admin-written — none of it goes
// through the business approval flow.

function slugify(text) {
  return String(text ?? "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Every editor form posts a partial row; `touch` stamps updated_at and fills a
// slug from the title when the form left it blank.
function touch(row, { slugFrom } = {}) {
  const out = { ...row, updated_at: new Date().toISOString() };
  if (slugFrom && !out.slug) out.slug = slugify(row[slugFrom]);
  return out;
}

// ─── Site events (curated "What's On") ────────────────────────────────────

function eventFromRow(r) {
  return {
    id: r.id, slug: r.slug, title: r.title, category: r.category,
    // A recurring event has no single date — date_label carries what to show.
    date: r.date_label || r.event_date || "",
    eventDate: r.event_date, dateLabel: r.date_label,
    venue: r.venue, excerpt: r.excerpt, body: r.body,
    heroImage: r.hero_image, thumbnail: r.thumbnail,
    status: r.status, featured: r.featured, author: r.author ?? "Admin",
  };
}

export async function getAdminEvents() {
  const { data, error } = await supabase.from("site_events").select("*").order("event_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(eventFromRow);
}

export async function saveEvent(event) {
  const row = touch({
    id: event.id || undefined,
    slug: event.slug,
    title: event.title,
    category: event.category,
    event_date: event.eventDate || null,
    date_label: event.dateLabel || (event.date && !/^\d{4}-\d{2}-\d{2}$/.test(event.date) ? event.date : null),
    venue: event.venue ?? null,
    excerpt: event.excerpt ?? null,
    body: event.body ?? null,
    hero_image: event.heroImage ?? null,
    thumbnail: event.thumbnail ?? null,
    status: event.status ?? "Draft",
    featured: !!event.featured,
    author: event.author ?? "Admin",
  }, { slugFrom: "title" });

  const { data, error } = await supabase.from("site_events").upsert(row).select().single();
  if (error) throw error;
  return eventFromRow(data);
}

export async function deleteEvent(id) {
  const { error } = await supabase.from("site_events").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

// ─── Site news ─────────────────────────────────────────────────────────────

function newsFromRow(r) {
  return {
    id: r.id, slug: r.slug, title: r.title, category: r.category,
    published: r.published_at, excerpt: r.excerpt, body: r.body,
    heroImage: r.hero_image, thumbnail: r.thumbnail,
    status: r.status, featured: r.featured, author: r.author ?? "Admin",
  };
}

export async function getAdminNews() {
  const { data, error } = await supabase.from("site_news").select("*").order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(newsFromRow);
}

export async function saveNews(item) {
  const row = touch({
    id: item.id || undefined,
    slug: item.slug,
    title: item.title,
    category: item.category,
    excerpt: item.excerpt ?? null,
    body: item.body ?? null,
    hero_image: item.heroImage ?? null,
    thumbnail: item.thumbnail ?? null,
    status: item.status ?? "Draft",
    featured: !!item.featured,
    author: item.author ?? "Admin",
    published_at: item.published || null,
  }, { slugFrom: "title" });

  const { data, error } = await supabase.from("site_news").upsert(row).select().single();
  if (error) throw error;
  return newsFromRow(data);
}

export async function deleteNews(id) {
  const { error } = await supabase.from("site_news").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

// ─── Projects (Explore) ────────────────────────────────────────────────────

function projectFromRow(r) {
  return {
    id: r.id, slug: r.slug, title: r.title, description: r.description,
    body: r.body, image: r.image, gallery: r.gallery ?? [],
    published: r.published, updatedAt: (r.updated_at ?? "").slice(0, 10),
  };
}

export async function getProjects() {
  const { data, error } = await supabase.from("projects").select("*").order("sort_order").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(projectFromRow);
}

export async function saveProject(project) {
  const row = touch({
    id: project.id || undefined,
    slug: project.slug,
    title: project.title,
    description: project.description ?? null,
    body: project.body ?? null,
    image: project.image ?? null,
    gallery: project.gallery ?? [],
    published: !!project.published,
    sort_order: project.sortOrder ?? 0,
  }, { slugFrom: "title" });

  const { data, error } = await supabase.from("projects").upsert(row).select().single();
  if (error) throw error;
  return projectFromRow(data);
}

export async function deleteProject(id) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

// ─── Featured stories (homepage carousel) ──────────────────────────────────

function storyFromRow(r) {
  return {
    id: r.id, category: r.category, title: r.title, excerpt: r.excerpt,
    image: r.image, href: r.href, order: r.sort_order, status: r.status,
  };
}

export async function getFeaturedStories() {
  const { data, error } = await supabase.from("featured_stories").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map(storyFromRow);
}

export async function saveFeaturedStory(story) {
  const row = touch({
    id: story.id || undefined,
    category: story.category ?? null,
    title: story.title,
    excerpt: story.excerpt ?? null,
    image: story.image ?? null,
    href: story.href ?? null,
    status: story.status ?? "Draft",
    sort_order: story.order ?? 0,
  });
  const { data, error } = await supabase.from("featured_stories").upsert(row).select().single();
  if (error) throw error;
  return storyFromRow(data);
}

export async function deleteFeaturedStory(id) {
  const { error } = await supabase.from("featured_stories").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

// Drag-to-reorder writes the whole visible order back at once.
export async function reorderFeaturedStories(orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase.from("featured_stories").update({ sort_order: i + 1 }).eq("id", orderedIds[i]);
    if (error) throw error;
  }
  return { ok: true };
}

// ─── Articles & neighbourhood guides ───────────────────────────────────────

function articleFromRow(r) {
  return {
    id: r.id, slug: r.slug, title: r.title, category: r.category,
    author: r.author, businessId: r.business_id, body: r.body,
    thumbnail: r.thumbnail, heroImage: r.hero_image, tags: r.tags ?? [],
    metaTitle: r.meta_title, metaDescription: r.meta_description,
    status: r.status, published: r.published_at,
  };
}

export async function getArticles() {
  const { data, error } = await supabase.from("articles").select("*").order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(articleFromRow);
}

export async function getArticleById(id) {
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? articleFromRow(data) : null;
}

export async function saveArticle(article) {
  const row = touch({
    id: article.id || undefined,
    slug: article.slug,
    title: article.title,
    category: article.category ?? null,
    author: article.author ?? null,
    business_id: article.businessId ?? null,
    body: article.body ?? null,
    thumbnail: article.thumbnail ?? null,
    hero_image: article.heroImage ?? null,
    tags: article.tags ?? [],
    meta_title: article.metaTitle ?? null,
    meta_description: article.metaDescription ?? null,
    status: article.status ?? "Draft",
    published_at: article.published || null,
  }, { slugFrom: "title" });

  const { data, error } = await supabase.from("articles").upsert(row).select().single();
  if (error) throw error;
  return articleFromRow(data);
}

export async function deleteArticle(id) {
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

function guideFromRow(r) {
  return {
    id: r.id, slug: r.slug, title: r.title, area: r.area, body: r.body,
    thumbnail: r.thumbnail, heroImage: r.hero_image, status: r.status,
    showOnHomepage: r.show_on_homepage, showOnPlatform: r.show_on_platform,
    sortOrder: r.sort_order,
    // The nested page document the public guide page renders.
    content: r.content ?? {},
  };
}

export async function getGuides() {
  const { data, error } = await supabase.from("neighbourhood_guides").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map(guideFromRow);
}

export async function getGuideById(id) {
  const { data, error } = await supabase.from("neighbourhood_guides").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? guideFromRow(data) : null;
}

export async function saveGuide(guide) {
  const row = touch({
    id: guide.id || undefined,
    slug: guide.slug,
    title: guide.title,
    area: guide.area ?? null,
    body: guide.body ?? null,
    thumbnail: guide.thumbnail ?? null,
    hero_image: guide.heroImage ?? null,
    status: guide.status ?? "Draft",
    show_on_homepage: !!guide.showOnHomepage,
    show_on_platform: guide.showOnPlatform !== false,
    sort_order: guide.sortOrder ?? 0,
    content: guide.content ?? {},
  }, { slugFrom: "title" });

  const { data, error } = await supabase.from("neighbourhood_guides").upsert(row).select().single();
  if (error) throw error;
  return guideFromRow(data);
}

export async function deleteGuide(id) {
  const { error } = await supabase.from("neighbourhood_guides").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

// ─── Site content (hero copy / section headers) ────────────────────────────
// The editable fields differ per section, so they live in a jsonb blob that is
// spread onto the row here — the admin form keeps working in flat fields.

function sectionFromRow(r) {
  return { key: r.key, label: r.label, kind: r.kind, ...(r.content ?? {}) };
}

export async function getSiteContent() {
  const { data, error } = await supabase.from("site_content").select("*").order("key");
  if (error) throw error;
  return (data ?? []).map(sectionFromRow);
}

export async function saveSiteSection(section) {
  const { key, label, kind, ...content } = section;
  const { data, error } = await supabase
    .from("site_content")
    .upsert({ key, label, kind, content, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return sectionFromRow(data);
}

export async function deleteSiteSection(key) {
  const { error } = await supabase.from("site_content").delete().eq("key", key);
  if (error) throw error;
  return { key, deleted: true };
}

// Seeds the section rows the admin screen expects, so the editor has something
// to edit on a fresh database. Seeds per key rather than only when the table is
// empty, so a section added later still appears for existing installs.
export async function ensureSiteSections(defaults) {
  const existing = await getSiteContent();
  const have = new Set(existing.map((s) => s.key));
  const missing = defaults.filter((s) => !have.has(s.key));
  if (!missing.length) return existing;
  for (const section of missing) await saveSiteSection(section);
  return getSiteContent();
}

// ─── Platform settings ─────────────────────────────────────────────────────

export async function getSettings() {
  const { data, error } = await supabase.from("platform_settings").select("*").eq("id", true).maybeSingle();
  if (error) throw error;
  return {
    platform: {
      siteName: data?.site_name ?? "",
      supportEmail: data?.support_email ?? "",
      approvalRequired: data?.approval_required ?? true,
      xmlSyncHour: data?.xml_sync_hour ?? 6,
      maxGalleryImages: data?.max_gallery_images ?? 8,
      featuredListingsMax: data?.featured_listings_max ?? 3,
    },
  };
}

export async function saveSettings(settings) {
  const p = settings.platform ?? {};
  const { error } = await supabase.from("platform_settings").update({
    site_name: p.siteName,
    support_email: p.supportEmail,
    approval_required: p.approvalRequired,
    xml_sync_hour: p.xmlSyncHour,
    max_gallery_images: p.maxGalleryImages,
    featured_listings_max: p.featuredListingsMax,
    updated_at: new Date().toISOString(),
  }).eq("id", true);
  if (error) throw error;
  return { ...settings, savedAt: new Date().toISOString() };
}

// ─── Push notifications ────────────────────────────────────────────────────

function pushFromRow(r) {
  return {
    id: r.id, title: r.title, body: r.body, url: r.url,
    audience: r.audience,
    channels: r.channels ?? [],
    notifType: r.notif_type,
    attachedArticle: r.article_id
      ? { id: r.article_id, title: r.article_title, thumbnail: r.article_image, link: r.article_link }
      : null,
    reach: r.reach,
    sentAt: (r.sent_at ?? "").slice(0, 16).replace("T", " "),
  };
}

export async function getPushHistory() {
  const { data, error } = await supabase.from("push_notifications").select("*").order("sent_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(pushFromRow);
}

// Records the send, then asks the send-push Edge Function to actually deliver
// it (supabase/functions/send-push). The function isn't deployed until the
// project owner runs the one-time CLI steps in that file's header comment —
// until then this call 404s, which is swallowed so the history always records
// correctly regardless of whether delivery is live yet.
export async function sendPush(form) {
  const channels = [form.web && "Web", form.mobile && "Mobile"].filter(Boolean);
  const article = form.attachedArticle;
  const { data, error } = await supabase.from("push_notifications").insert({
    title: form.title,
    body: form.body ?? null,
    url: form.url || null,
    audience: form.audience ?? "all",
    channels,
    notif_type: form.notifType ?? "simple",
    article_id: article?.id ?? null,
    article_title: article?.title ?? null,
    article_image: article?.thumbnail ?? null,
    article_link: article?.link ?? null,
  }).select().single();
  if (error) throw error;

  let delivery = null;
  try {
    const { data: result, error: fnError } = await supabase.functions.invoke("send-push", {
      body: { title: form.title, body: form.body, url: form.url, audience: form.audience ?? "all" },
    });
    delivery = fnError ? { error: fnError.message } : result;
  } catch (e) {
    delivery = { error: e.message };
  }

  return { ...pushFromRow(data), delivery };
}
