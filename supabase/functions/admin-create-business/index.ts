// admin-create-business — creates the owner's real login account when admin
// registers a business on someone's behalf.
//
// Why this has to be an Edge Function rather than a plain client call: the
// browser-side supabase.auth.signUp() both creates the account AND signs the
// calling browser into it (this project has email confirmation off), which
// would silently switch the admin's own session to the new owner's mid-form.
// This runs server-side with the service-role key instead — creating the
// auth user via the admin API doesn't touch the caller's session at all.
//
// Deploy with: supabase functions deploy admin-create-business
//
// Verifies the caller is a real admin (via their own JWT, forwarded in the
// Authorization header) before doing anything — this endpoint can create
// logins, so it must not be callable by an arbitrary anon request.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Service-role client — bypasses RLS, used only after the caller is verified.
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Verify the caller is a signed-in admin — using their own JWT (not the
  // service-role key) against a normal client, so RLS still applies to this
  // check: is_admin() only returns true for a real admin_users row.
  const authHeader = req.headers.get("Authorization") ?? "";
  const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: isAdminResult, error: authCheckError } = await callerClient.rpc("is_admin");
  if (authCheckError || !isAdminResult) {
    return json({ error: "Not authorized — admin session required." }, 403);
  }

  let body: {
    businessId?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string; // "Owner" | "Content Manager"
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { businessId, email, password, firstName, lastName, phone, role } = body;
  if (!businessId || !email || !password || !firstName || !lastName) {
    return json({ error: "Missing required field" }, 400);
  }

  // Creates the account already confirmed — same effect as the self-serve
  // signup flow, just performed on the business's behalf by admin.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) return json({ error: createError.message }, 400);

  const { error: insertError } = await admin.from("business_users").insert({
    auth_user_id: created.user.id,
    business_id: businessId,
    role: role === "Content Manager" ? "Content Manager" : "Owner",
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone ?? null,
    // Admin is creating this directly, not reviewing a self-signup request —
    // approved immediately rather than sitting in the Pending queue.
    status: "approved",
    approved_at: new Date().toISOString(),
  });
  if (insertError) {
    // Roll back the orphaned auth account rather than leaving a login with
    // no business attached.
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: insertError.message }, 400);
  }

  return json({ ok: true, userId: created.user.id });
});
