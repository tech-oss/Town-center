import { supabase } from "../../lib/supabaseClient";

// business_tickets: support tickets + threaded messages (thread stored as a
// jsonb array on the row, same pattern as faqs/hours in business_listings).

function fromRow(row) {
  return {
    id: row.id,
    subject: row.subject,
    category: row.category,
    status: row.status,
    submitted: row.submitted,
    thread: row.thread ?? [],
  };
}

export async function listTickets(businessId) {
  const { data, error } = await supabase
    .from("business_tickets")
    .select("*")
    .eq("business_id", businessId)
    .order("submitted", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function createTicket(businessId, { subject, category, message, author }) {
  const thread = [{ from: "business", author, date: new Date().toISOString().slice(0, 16).replace("T", " "), body: message }];
  const { data, error } = await supabase
    .from("business_tickets")
    .insert({ business_id: businessId, subject, category, thread })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function addTicketMessage(id, thread) {
  const { error } = await supabase.from("business_tickets").update({ thread }).eq("id", id);
  if (error) throw error;
}
