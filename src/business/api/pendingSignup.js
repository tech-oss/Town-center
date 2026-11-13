import { supabase } from "../../lib/supabaseClient";

// Signing up to the portal (registering a business, a Content Manager, or a
// claim) asks the person to confirm their email address first: Supabase →
// Authentication → Sign In / Providers → Email → "Confirm email". Until they
// click the link in that email there's no signed-in session, and the database
// only lets a signed-in person create their own records, so what they filled
// in is kept with the new login (its user metadata, never the password) and
// the records are created once they're signed in (completeSignup.js):
//   - on the page the link opens, /business/confirmed, or
//   - at their first log-in, if the link opened in a different browser.
// With "Confirm email" off, Supabase signs them in straight away and the
// records are created there and then, as before.

const KEY = "pending_signup";
export const CONFIRM_PATH = "/business/confirmed";
const redirectTo = () => `${window.location.origin}${CONFIRM_PATH}`;

// { kind: "business" | "content_manager" | "claim", details } or null.
export function pendingSignupOf(user) {
  return user?.user_metadata?.[KEY] ?? null;
}

export async function signUpPending(email, password, kind, details) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: redirectTo(), data: { [KEY]: { kind, details } } },
  });
  if (error) return { error };
  // With confirmation on, Supabase answers an address that already has an
  // account with a stand-in user (no identities) rather than an error, so it
  // doesn't reveal who has signed up. Said plainly here, as before.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { error: { message: "User already registered" } };
  }
  return { user: data.user, session: data.session };
}

// Done with: the details are in the database now.
export async function clearPendingSignup() {
  await supabase.auth.updateUser({ data: { [KEY]: null } }).catch(() => {});
}

export async function resendConfirmation(email) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo: redirectTo() },
  });
  if (error) {
    if (/rate|seconds|too many/i.test(error.message)) {
      return { ok: false, error: "An email was sent very recently. Give it a minute, and check your spam folder." };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// "Email not confirmed" from a log-in attempt.
export const isUnconfirmedError = (error) => /email not confirmed/i.test(String(error?.message ?? error ?? ""));
