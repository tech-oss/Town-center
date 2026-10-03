import { supabase } from "./supabaseClient";

// Records a sign-in for Maidenhead admin's User Activity chart.
//
// Typing a password records one every time (`always`). Someone who stays
// signed in and simply comes back — the usual case on the business dashboard
// — never types a password again, so they used to be invisible on the chart;
// coming back is now recorded too, once a day per person per browser.
//
// Fire and forget: a failure to record must never get in anyone's way.
const today = () => new Date().toISOString().slice(0, 10);

export function recordLogin(portal, authUserId, businessId = null, { always = false } = {}) {
  if (!authUserId) return;
  const key = `login-recorded:${portal}:${authUserId}`;
  try {
    if (!always && localStorage.getItem(key) === today()) return;
    localStorage.setItem(key, today());
  } catch { /* storage unavailable: record anyway */ }
  supabase.rpc("record_login", { p_portal: portal, p_business_id: businessId })
    .then(({ error }) => { if (error) console.warn("Login not recorded:", error.message); });
}
