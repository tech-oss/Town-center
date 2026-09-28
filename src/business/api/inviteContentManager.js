import { supabase } from "../../lib/supabaseClient";
import { checkEmail } from "../../lib/emailCheck";

// Owner invites a Content Manager by email (supabase/functions/invite-content-manager).
// Inviting them IS the owner's approval — Maidenhead admin is not asked to
// approve this too, only notified (see src/admin/pages/UsersPage.jsx). What
// the invitee still owes, on the emailed link, is their own password and
// their own acceptance of the Terms of Use / Privacy Policy — SetPasswordPage
// and AcceptTermsPage gate the dashboard on both before letting them in.
export async function inviteContentManager({ businessId, firstName, lastName, email }) {
  // The invite is an email; don't send one that will bounce (lib/emailCheck).
  const emailProblem = await checkEmail(email);
  if (emailProblem) return { ok: false, error: emailProblem };
  const { data, error } = await supabase.functions.invoke("invite-content-manager", {
    body: {
      businessId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      redirectTo: `${window.location.origin}/business/set-password`,
    },
  });
  if (error) {
    let message = error.message;
    try { message = (await error.context?.json())?.error ?? message; } catch { /* keep generic */ }
    return { ok: false, error: message };
  }
  if (data?.error) return { ok: false, error: data.error };
  return { ok: true };
}
