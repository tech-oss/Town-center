// invite-content-manager — a business owner inviting their Content Manager
// by email.
//
// Why this has to be an Edge Function: creating the login needs the
// service-role key (inviteUserByEmail is an admin-only Auth API call), which
// must never reach the browser. Same shape as admin-create-business.
//
// Deploy with: supabase functions deploy invite-content-manager
//
// The owner has already approved this person by the act of inviting them —
// Maidenhead admin is not in this loop at all (see UsersPage.jsx /
// admin_pending_counts_2026_09.sql). What the invitee still owes is their own
// account: a password, and reading and accepting the Terms of Use and
// Privacy Policy for themselves (business_users.terms_accepted_at — see
// content_manager_flow_2026_09.sql), which the invite alone doesn't collect.
// The emailed link signs them in; the business portal then asks for both
// before letting them any further in (SetPasswordPage → AcceptTermsPage).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}

const RESERVED = new Set(["example.com", "example.org", "example.net", "example.co.uk", "test.com", "test.co.uk", "yourdomain.com", "fake.com", "noemail.com"]);

// Same rules as the portal's lib/emailCheck.js, checked here too because the
// browser's check can be skipped. Returns a reason, or null if it's fine.
async function undeliverable(email: string): Promise<string | null> {
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return "Please enter a valid email address.";
  const domain = email.split("@")[1];
  if (RESERVED.has(domain) || [".test", ".example", ".invalid", ".localhost", ".local"].some((t) => domain.endsWith(t))) {
    return "Please use a real email address.";
  }
  try {
    const mx = await Deno.resolveDns(domain, "MX");
    if (mx.length && mx.every((r) => r.exchange === "" || r.exchange === ".")) return `We can't deliver email to "${domain}".`;
    if (!mx.length) await Deno.resolveDns(domain, "A");
  } catch (e) {
    // NotFound = no such domain / no mail server. Anything else (a DNS
    // hiccup) lets the address through rather than blocking a real person.
    if (e instanceof Deno.errors.NotFound) return `We can't deliver email to "${domain}". Please check the address.`;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !caller) return json({ error: "Not signed in." }, 401);

  let body: { businessId?: string; email?: string; firstName?: string; lastName?: string; redirectTo?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const { businessId, email, firstName, lastName, redirectTo } = body;
  if (!businessId || !email?.trim() || !firstName?.trim() || !lastName?.trim()) {
    return json({ error: "Missing required field" }, 400);
  }

  // Only the business's own approved Owner may invite for it — checked with
  // the service-role client since the caller's own RLS-scoped read of
  // business_users is exactly the row being verified against.
  const { data: ownerRow } = await admin
    .from("business_users")
    .select("id")
    .eq("business_id", businessId)
    .eq("auth_user_id", caller.id)
    .eq("role", "Owner")
    .eq("status", "approved")
    .maybeSingle();
  if (!ownerRow) return json({ error: "Only this business's approved owner can invite a Content Manager." }, 403);

  const { data: slotTaken } = await admin.rpc("business_role_slot_taken", {
    target_business_id: businessId,
    target_role: "Content Manager",
  });
  if (slotTaken) return json({ error: "This business already has a Content Manager registered or awaiting approval." }, 400);

  // Refuse an address that can't receive mail before Supabase emails it:
  // bounces count against the whole project's sending.
  const emailProblem = await undeliverable(email.trim().toLowerCase());
  if (emailProblem) return json({ error: emailProblem }, 400);

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
    redirectTo: redirectTo || undefined,
    data: { first_name: firstName.trim(), last_name: lastName.trim() },
  });
  if (inviteError) {
    const message = /already registered|already exists/i.test(inviteError.message)
      ? "An account with this email already exists."
      : inviteError.message;
    return json({ error: message }, 400);
  }

  const { error: insertError } = await admin.from("business_users").insert({
    auth_user_id: invited.user.id,
    business_id: businessId,
    role: "Content Manager",
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    email: email.trim(),
    // Inviting IS the owner's approval — there is nothing left for anyone
    // else to approve. What's still outstanding (a password, and reading and
    // accepting the terms for themselves) is tracked separately and gates
    // the dashboard, not this status.
    status: "approved",
    approved_at: new Date().toISOString(),
    requested_at: new Date().toISOString(),
    terms_accepted_at: null,
    // Overrides the column's own "already has one" default — an invited
    // email has no password until they set one on the emailed link.
    password_set_at: null,
  });
  if (insertError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    return json({ error: insertError.message }, 400);
  }

  return json({ ok: true, userId: invited.user.id });
});
