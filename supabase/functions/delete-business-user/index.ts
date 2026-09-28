// delete-business-user — removes a portal login for good: the business_users
// row AND the Supabase Auth account behind it.
//
// Why this has to be an Edge Function: deleting only the business_users row
// (all the browser can do) left the Auth account behind. That broke two
// things — the email could never be registered again ("An account with this
// email already exists"), and a Content Manager an owner "removed" was never
// removed at all. Deleting an Auth user needs the service-role key.
//
// Who may call it:
//   • Maidenhead admin (is_admin()) — any business user.
//   • A business's approved Owner — only that business's Content Manager.
//
// The Auth account is kept if the same login is also an admin or still
// belongs to another business — only this business_users row goes then.
//
// Deploy with: supabase functions deploy delete-business-user

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !caller) return json({ error: "Not signed in." }, 401);

  let body: { businessUserId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.businessUserId) return json({ error: "Missing businessUserId" }, 400);

  const { data: target } = await admin
    .from("business_users")
    .select("id, auth_user_id, business_id, role")
    .eq("id", body.businessUserId)
    .maybeSingle();
  if (!target) return json({ ok: true, alreadyGone: true });

  const { data: isAdmin } = await callerClient.rpc("is_admin");
  if (!isAdmin) {
    const { data: ownerRow } = await admin
      .from("business_users")
      .select("id")
      .eq("business_id", target.business_id)
      .eq("auth_user_id", caller.id)
      .eq("role", "Owner")
      .eq("status", "approved")
      .maybeSingle();
    if (!ownerRow || target.role !== "Content Manager") {
      return json({ error: "Only Maidenhead admin, or this business's owner removing its Content Manager, can do this." }, 403);
    }
  }

  const { error: deleteError } = await admin.from("business_users").delete().eq("id", target.id);
  if (deleteError) return json({ error: deleteError.message }, 400);

  if (target.auth_user_id) {
    const [{ count: otherRows }, { count: adminRows }] = await Promise.all([
      admin.from("business_users").select("id", { count: "exact", head: true }).eq("auth_user_id", target.auth_user_id),
      admin.from("admin_users").select("id", { count: "exact", head: true }).eq("auth_user_id", target.auth_user_id),
    ]);
    if (!otherRows && !adminRows) {
      // Also ends any session they have open: their refresh token dies with
      // the account, so a removed Content Manager is signed out too.
      const { error: authDeleteError } = await admin.auth.admin.deleteUser(target.auth_user_id);
      if (authDeleteError) return json({ error: authDeleteError.message }, 400);
    }
  }

  return json({ ok: true });
});
