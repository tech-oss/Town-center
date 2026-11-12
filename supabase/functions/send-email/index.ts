// send-email — Maidenhead's own notification emails, sent through Resend.
//
// Each email is one named event; the function looks up who it goes to and
// writes the wording itself, so it can never be used to send arbitrary mail
// to arbitrary addresses. Admins only.
//
//   ticket_reply         { ticketId }        admin replied to a support ticket
//   ticket_new           { ticketId }        admin started a conversation
//   renewal_reminder     { businessId }      the Visibility Plan renews soon
//   account_approved     { businessId, businessUserId? }
//                        the business (and the person) can now sign in;
//                        sent only once both are approved
//   registration_rejected{ businessId }      with admin's reason
//   account_invite       { businessUserId }  "set your password" link for a
//                        login admin created
//   test                 {}                  a test to the admin who asked
//                        (Settings → Email), to check Resend is set up
//
// Supabase's own emails (sign-up confirmation, password reset, Content
// Manager invites) are not sent from here: they go through Resend as
// Supabase's SMTP server (Authentication → SMTP Settings).
//
// Every send is written to email_log (supabase/sql/email_log_2026_11.sql).
//
// Deploy:  supabase functions deploy send-email --project-ref vnnmzppjswiazzrnkjtq
// Secrets: RESEND_API_KEY, EMAIL_FROM (e.g. "Maidenhead <hello@your-domain>"),
//          optional EMAIL_REPLY_TO, PORTAL_URL (the business portal's address)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const PORTAL = (Deno.env.get("PORTAL_URL") ?? "https://town-center-git-business-d-3e69dd-muhammad-abuzar-s46-projects1.vercel.app").replace(/\/+$/, "");

// ── The email itself ────────────────────────────────────────────────────────

const esc = (s: unknown) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Mail = { subject: string; heading: string; paragraphs: string[]; quote?: string; button?: { label: string; url: string } };

// Plain, table-based HTML that renders the same in Gmail, Outlook and Apple
// Mail. Everything passed in is text and is escaped here.
function html(m: Mail) {
  const p = m.paragraphs.map((t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#1E293B">${esc(t)}</p>`).join("");
  const quote = m.quote
    ? `<div style="margin:6px 0 18px;padding:14px 16px;border-left:3px solid #2F8C8C;background:#F3F8F8;font-size:14px;line-height:1.55;color:#1E293B;white-space:pre-line">${esc(m.quote)}</div>`
    : "";
  const button = m.button
    ? `<p style="margin:22px 0 6px"><a href="${esc(m.button.url)}" style="display:inline-block;background:#1C2E38;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px">${esc(m.button.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F5F7FB">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FB;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<tr><td style="background:#1C2E38;padding:18px 26px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.06em">MAIDENHEAD</td></tr>
<tr><td style="padding:26px">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#0F172A">${esc(m.heading)}</h1>
${p}${quote}${button}
</td></tr>
<tr><td style="padding:16px 26px 22px;border-top:1px solid #EEF1F6;font-size:12px;line-height:1.5;color:#64748B">
You're receiving this because you have a business account on Maidenhead.com.
</td></tr>
</table></td></tr></table></body></html>`;
}

function text(m: Mail) {
  return [m.heading, "", ...m.paragraphs, ...(m.quote ? ["", m.quote] : []), ...(m.button ? ["", `${m.button.label}: ${m.button.url}`] : [])].join("\n");
}

async function send(event: string, to: string[], m: Mail, ref: string | null) {
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");
  if (!key || !from) throw new Error("Email isn't set up yet (RESEND_API_KEY / EMAIL_FROM).");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to, subject: m.subject, html: html(m), text: text(m),
      ...(Deno.env.get("EMAIL_REPLY_TO") ? { reply_to: Deno.env.get("EMAIL_REPLY_TO") } : {}),
    }),
  });
  const body = await res.json().catch(() => ({}));
  await admin.from("email_log").insert({
    event, recipients: to, subject: m.subject, ref, ok: res.ok,
    error: res.ok ? null : String(body?.message ?? res.status).slice(0, 300), resend_id: body?.id ?? null,
  });
  if (!res.ok) throw new Error(body?.message ?? `Resend refused the email (${res.status}).`);
  return body?.id as string;
}

// ── Who it goes to ──────────────────────────────────────────────────────────

async function businessName(id: string) {
  const { data } = await admin.from("businesses").select("name, status").eq("id", id).maybeSingle();
  return data;
}

// Approved people on the business: owners only, or everyone (owners and
// Content Managers) for things they'd both act on.
async function members(businessId: string, { ownersOnly = false } = {}) {
  let q = admin.from("business_users").select("id, email, first_name, role, status").eq("business_id", businessId).eq("status", "approved");
  if (ownersOnly) q = q.eq("role", "Owner");
  const { data } = await q;
  return (data ?? []).filter((u) => u.email);
}

const firstName = (u: { first_name?: string | null }) => (u.first_name?.trim() ? `Hi ${u.first_name.trim()},` : "Hello,");
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });

// ── Events ──────────────────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
type Body = Record<string, any>;
type Result = { sent: number; skipped?: string };

const EVENTS: Record<string, (b: Body) => Promise<Result>> = {
  // Goes only to the signed-in admin's own address (set by the caller below).
  async test({ callerEmail }) {
    if (!callerEmail) return { sent: 0, skipped: "your admin account has no email address" };
    await send("test", [callerEmail], {
      subject: "Maidenhead test email",
      heading: "Email is working",
      paragraphs: ["This is a test from Maidenhead admin → Settings → Email.", "If you're reading this, emails sent through Resend are reaching inboxes."],
    }, null);
    return { sent: 1 };
  },

  async ticket_reply({ ticketId }) {
    const { data: t } = await admin.from("business_tickets").select("id, business_id, subject, thread").eq("id", ticketId).maybeSingle();
    if (!t) return { sent: 0, skipped: "ticket not found" };
    const last = [...(t.thread ?? [])].reverse().find((m: Body) => m.from === "admin");
    const to = await members(t.business_id);
    if (!to.length) return { sent: 0, skipped: "no approved account on this business" };
    await send("ticket_reply", to.map((u) => u.email), {
      subject: `Re: ${t.subject}`,
      heading: "Maidenhead has replied to your message",
      paragraphs: [firstName(to[0]), `There's a new reply on "${t.subject}".`],
      quote: last?.body ? String(last.body).slice(0, 1200) : undefined,
      button: { label: "View and reply", url: `${PORTAL}/business/support` },
    }, String(t.id));
    return { sent: to.length };
  },

  async ticket_new({ ticketId }) {
    const { data: t } = await admin.from("business_tickets").select("id, business_id, subject, thread").eq("id", ticketId).maybeSingle();
    if (!t) return { sent: 0, skipped: "ticket not found" };
    const to = await members(t.business_id);
    if (!to.length) return { sent: 0, skipped: "no approved account on this business" };
    await send("ticket_new", to.map((u) => u.email), {
      subject: t.subject,
      heading: "A message from Maidenhead",
      paragraphs: [firstName(to[0]), `Maidenhead has sent you a message: "${t.subject}".`],
      quote: t.thread?.[0]?.body ? String(t.thread[0].body).slice(0, 1200) : undefined,
      button: { label: "View and reply", url: `${PORTAL}/business/support` },
    }, String(t.id));
    return { sent: to.length };
  },

  async renewal_reminder({ businessId }) {
    const biz = await businessName(businessId);
    const { data: sub } = await admin.from("business_subscriptions")
      .select("plan, renewal_date, current_period_end, cancel_at_period_end, billing_interval, price_amount").eq("business_id", businessId).maybeSingle();
    if (!sub || sub.plan !== "premium") return { sent: 0, skipped: "not on the Visibility Plan" };
    const when = sub.current_period_end ?? sub.renewal_date;
    const to = await members(businessId, { ownersOnly: true });
    if (!to.length) return { sent: 0, skipped: "no approved owner" };
    const price = sub.price_amount ? `£${Number(sub.price_amount).toFixed(2).replace(/\.00$/, "")}` : null;
    await send("renewal_reminder", to.map((u) => u.email), {
      subject: sub.cancel_at_period_end ? "Your Visibility Plan is ending" : "Your Visibility Plan renews soon",
      heading: sub.cancel_at_period_end ? "Your Visibility Plan is ending" : "Your Visibility Plan renews soon",
      paragraphs: [
        firstName(to[0]),
        sub.cancel_at_period_end
          ? `${biz?.name ?? "Your business"}'s Visibility Plan ends${when ? ` on ${fmtDate(when)}` : " soon"}. After that your listing moves to the Free plan. You can keep it by resubscribing.`
          : `${biz?.name ?? "Your business"}'s Visibility Plan renews${when ? ` on ${fmtDate(when)}` : " soon"}${price ? ` at ${price}${sub.billing_interval === "year" ? " a year" : " a month"}` : ""}. There's nothing you need to do.`,
        "You can update your card or change your plan any time from Subscriptions & Billing.",
      ],
      button: { label: "Subscriptions & Billing", url: `${PORTAL}/business/billing` },
    }, businessId);
    return { sent: to.length };
  },

  async account_approved({ businessId, businessUserId }) {
    const biz = await businessName(businessId);
    if (biz?.status !== "Approved") return { sent: 0, skipped: "business not approved yet" };
    let to = await members(businessId);
    if (businessUserId) to = to.filter((u) => u.id === businessUserId);
    if (!to.length) return { sent: 0, skipped: "no approved account yet" };
    await send("account_approved", to.map((u) => u.email), {
      subject: `${biz.name} is approved on Maidenhead`,
      heading: "You're approved",
      paragraphs: [
        firstName(to[0]),
        `${biz.name} has been approved on Maidenhead.com and The Maidenhead App. You can now sign in to your business dashboard to complete your listing.`,
      ],
      button: { label: "Sign in", url: `${PORTAL}/business/login` },
    }, businessId);
    return { sent: to.length };
  },

  async registration_rejected({ businessId }) {
    const { data: biz } = await admin.from("businesses").select("name, status, admin_note").eq("id", businessId).maybeSingle();
    if (biz?.status !== "Rejected") return { sent: 0, skipped: "not rejected" };
    const { data: people } = await admin.from("business_users").select("email, first_name").eq("business_id", businessId).eq("role", "Owner");
    const to = (people ?? []).filter((u) => u.email);
    if (!to.length) return { sent: 0, skipped: "no owner email" };
    await send("registration_rejected", to.map((u) => u.email), {
      subject: `Your Maidenhead registration for ${biz.name}`,
      heading: "We couldn't approve your registration",
      paragraphs: [firstName(to[0]), `We weren't able to approve ${biz.name} on Maidenhead.com at this time.`,
        "If you think this is a mistake, reply to this email and we'll take another look."],
      quote: biz.admin_note || undefined,
    }, businessId);
    return { sent: to.length };
  },

  async account_invite({ businessUserId }) {
    const { data: u } = await admin.from("business_users").select("id, email, first_name, role, business_id, businesses(name)").eq("id", businessUserId).maybeSingle();
    if (!u?.email) return { sent: 0, skipped: "no such account" };
    const { data: link, error } = await admin.auth.admin.generateLink({
      type: "recovery", email: u.email, options: { redirectTo: `${PORTAL}/business/reset-password` },
    });
    if (error || !link?.properties?.action_link) throw new Error(error?.message ?? "Couldn't make the sign-in link.");
    // deno-lint-ignore no-explicit-any
    const name = (u as any).businesses?.name ?? "your business";
    await send("account_invite", [u.email], {
      subject: `Your Maidenhead business account for ${name}`,
      heading: "Your business account is ready",
      paragraphs: [firstName(u), `An account has been set up for you to manage ${name} on Maidenhead.com${u.role === "Content Manager" ? " as its Content Manager" : ""}.`,
        "Choose your password to sign in. The link works once and expires after 24 hours."],
      button: { label: "Choose my password", url: link.properties.action_link },
    }, String(u.id));
    return { sent: 1 };
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const caller = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Please sign in again." }, 401);
    const { data: isAdmin } = await caller.rpc("is_admin");
    if (!isAdmin) return json({ error: "Admins only." }, 403);

    const body = await req.json().catch(() => ({}));
    const handler = EVENTS[String(body.event ?? "")];
    if (!handler) return json({ error: "Unknown email." }, 400);
    // callerEmail is only ever the signed-in admin's own, never from the request.
    return json({ ok: true, ...(await handler({ ...body, callerEmail: user.email })) });
  } catch (e) {
    console.error("send-email failed:", e);
    return json({ error: (e as Error).message ?? "The email couldn't be sent." }, 500);
  }
});
