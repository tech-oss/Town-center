import { supabase } from "../../lib/supabaseClient";

// business_reviews: customer reviews + owner replies. Shared by ReviewsPage
// and MyListingPage's Reviews tab so both read/write the same data.

function fromRow(row) {
  return {
    id: row.id,
    reviewer: row.reviewer,
    rating: row.rating,
    date: row.date,
    text: row.text,
    reply: row.reply,
  };
}

export async function listReviews(businessId) {
  const { data, error } = await supabase
    .from("business_reviews")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function addReview(businessId, form) {
  const { data, error } = await supabase
    .from("business_reviews")
    .insert({ business_id: businessId, reviewer: form.reviewer, rating: form.rating, date: form.date, text: form.text })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateReview(id, form) {
  const { error } = await supabase
    .from("business_reviews")
    .update({ reviewer: form.reviewer, rating: form.rating, date: form.date, text: form.text })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteReview(id) {
  const { error } = await supabase.from("business_reviews").delete().eq("id", id);
  if (error) throw error;
}

export async function replyToReview(id, text) {
  const { error } = await supabase
    .from("business_reviews")
    .update({ reply: { text, status: "Pending Approval" } })
    .eq("id", id);
  if (error) throw error;
}
