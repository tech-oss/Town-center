import { supabase } from "../../lib/supabaseClient";

// Support tickets raised by businesses from their own dashboard. The
// conversation is a jsonb array on the row (same pattern the business portal
// writes), each entry { from: "business" | "admin", author, date, body }.

function fromRow(row) {
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: row.businesses?.name ?? row.business_id,
    contactEmail: row.contact_email ?? "",
    subject: row.subject,
    category: row.category,
    status: row.status,
    submitted: row.submitted,
    thread: row.thread ?? [],
  };
}

export async function getTickets({ status } = {}) {
  let q = supabase
    .from("business_tickets")
    .select("*, businesses(name)")
    .order("submitted", { ascending: false });
  if (status && status !== "All") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getTicketById(id) {
  const { data, error } = await supabase
    .from("business_tickets")
    .select("*, businesses(name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

// Appending rather than replacing, so a reply can't clobber a message the
// business posted while the admin was typing.
export async function replyToTicket(id, { body, author = "Admin", status }) {
  const { data: row, error: readError } = await supabase
    .from("business_tickets").select("thread").eq("id", id).maybeSingle();
  if (readError) throw readError;

  const thread = [...(row?.thread ?? []), {
    from: "admin",
    author,
    date: new Date().toISOString().slice(0, 16).replace("T", " "),
    body,
  }];

  const patch = { thread };
  if (status) patch.status = status;
  const { error } = await supabase.from("business_tickets").update(patch).eq("id", id);
  if (error) throw error;
  return { ok: true };
}

export async function setTicketStatus(id, status) {
  const { error } = await supabase.from("business_tickets").update({ status }).eq("id", id);
  if (error) throw error;
  return { ok: true };
}

// Admin opening a ticket on a business's behalf (e.g. after a phone call).
export async function createTicketForBusiness(businessId, { subject, category, message, author = "Admin" }) {
  const thread = [{ from: "admin", author, date: new Date().toISOString().slice(0, 16).replace("T", " "), body: message }];
  const { data, error } = await supabase
    .from("business_tickets")
    .insert({ business_id: businessId, subject, category, thread })
    .select("*, businesses(name)")
    .single();
  if (error) throw error;
  return fromRow(data);
}
