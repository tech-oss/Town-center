import { mock } from "../client";

// ─── Mock business account store ───────────────────────────────────────────
// No real backend yet — accounts and the session token both live in memory +
// localStorage for the duration of the browser session. This will be
// replaced by Supabase auth once the backend is connected; nothing here is
// secure and none of it should be treated as production auth.
const SESSION_KEY = "tc_business_session";

export const SECTIONS = [
  { value: "see-do",    label: "See & Do" },
  { value: "eat-drink", label: "Eat & Drink" },
  { value: "shop",      label: "Shop" },
  { value: "services",  label: "Services" },
  { value: "live-stay", label: "Live & Stay" },
];

export const STAY_TYPES = [
  { value: "hotel",         label: "Hotel" },
  { value: "accommodation", label: "Accommodation" },
];

let ACCOUNTS = [];
let _counter = 1;

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveSession(account) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(account)); } catch { /* ignore */ }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

// Seed ACCOUNTS from any previously-registered session on reload, so a page
// refresh mid-session doesn't lose the demo account.
(function seedFromSession() {
  const s = loadSession();
  if (s && !ACCOUNTS.some((a) => a.id === s.id)) ACCOUNTS.push(s);
})();

export function registerBusinessAccount({ email, password, businessName, section, subType }) {
  const exists = ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (exists) return mock({ ok: false, error: "An account with that email already exists." });

  const account = {
    id: `biz_${_counter++}_${Date.now()}`,
    email,
    password, // mock only — never store plaintext passwords in production
    businessName,
    section,
    subType: subType || null,
    status: "Draft",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  ACCOUNTS.push(account);
  saveSession(account);
  return mock({ ok: true, account });
}

export function loginBusinessAccount({ email, password }) {
  const account = ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
  );
  if (!account) return mock({ ok: false, error: "Incorrect email or password." });
  saveSession(account);
  return mock({ ok: true, account });
}

export function getCurrentBusinessAccount() {
  const session = loadSession();
  if (!session) return mock(null);
  // Keep in-memory store in sync in case of a hot-reload losing state.
  if (!ACCOUNTS.some((a) => a.id === session.id)) ACCOUNTS.push(session);
  return mock(session);
}

export function logoutBusinessAccount() {
  clearSession();
  return mock({ ok: true });
}

export function updateBusinessAccount(id, patch) {
  ACCOUNTS = ACCOUNTS.map((a) => (a.id === id ? { ...a, ...patch } : a));
  const updated = ACCOUNTS.find((a) => a.id === id);
  if (updated) saveSession(updated);
  return mock(updated);
}
