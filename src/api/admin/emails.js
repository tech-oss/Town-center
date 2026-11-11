import { supabase } from "../../lib/supabaseClient";

// Asks the send-email function (Resend) to send one of Maidenhead's
// notification emails. Never throws: an email that couldn't be sent must not
// undo or block what admin just did. Resolves to
// { ok, sent, skipped?, error? } so the page can say whether it went.
export async function sendEmail(event, payload = {}) {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", { body: { event, ...payload } });
    if (error) {
      let message = error.message;
      try { message = (await error.context?.json())?.error ?? message; } catch { /* keep generic */ }
      return { ok: false, sent: 0, error: message };
    }
    if (data?.error) return { ok: false, sent: 0, error: data.error };
    return { ok: true, sent: data?.sent ?? 0, skipped: data?.skipped };
  } catch (e) {
    return { ok: false, sent: 0, error: e?.message ?? "The email couldn't be sent." };
  }
}

// A short line for a toast: "the business has been emailed" / why not.
export function emailNote(result, who = "the business") {
  if (!result) return "";
  if (result.ok && result.sent > 0) return ` ${who[0].toUpperCase()}${who.slice(1)} has been emailed.`;
  if (result.ok && result.skipped) return "";
  return ` (Email not sent: ${result.error})`;
}
