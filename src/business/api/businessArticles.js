import { supabase } from "../../lib/supabaseClient";

// business_articles: News & Offers, max 3 per business (app-level check).

function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    date: row.date,
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    thumbnail: row.thumbnail,
    heroImage: row.hero_image,
    body: row.body,
    rejectionReason: row.rejection_reason,
  };
}

export async function listArticles(businessId) {
  const { data, error } = await supabase
    .from("business_articles")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getArticle(id) {
  const { data, error } = await supabase.from("business_articles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

export async function createArticle(businessId, form) {
  const { data, error } = await supabase
    .from("business_articles")
    .insert({
      business_id: businessId,
      title: form.title,
      type: form.type,
      status: form.status,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      thumbnail: form.heroImage,
      hero_image: form.heroImage,
      body: form.body,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateArticle(id, form) {
  const { error } = await supabase
    .from("business_articles")
    .update({
      title: form.title,
      type: form.type,
      status: form.status,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      thumbnail: form.heroImage,
      hero_image: form.heroImage,
      body: form.body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function setArticleStatus(id, status) {
  const { error } = await supabase.from("business_articles").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteArticle(id) {
  const { error } = await supabase.from("business_articles").delete().eq("id", id);
  if (error) throw error;
}
