// Checks an email address before anything asks Supabase to send to it.
//
// Every sign-up, claim and Content Manager invite makes Supabase Auth send an
// email. An address that can't receive mail bounces, and Supabase warns and
// then restricts sending for the whole project when too many do — at which
// point real businesses stop getting their emails. Most bounces are test
// addresses (test@test.com, anything@example.com) and typos (gmial.com), so
// those are caught here, before the email is ever sent:
//
//   1. the address has to be well formed
//   2. domains reserved for testing are refused outright — they can never
//      receive mail (RFC 2606 / 6761)
//   3. common typos of the big providers are caught, with the fix suggested
//   4. the domain has to have a mail server (an MX record, looked up over
//      DNS-over-HTTPS). If the lookup itself can't be done, the address is
//      let through rather than blocking a real person.

const FORMAT = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const RESERVED_DOMAINS = new Set([
  "example.com", "example.org", "example.net", "example.co.uk", "test.com", "test.co.uk",
  "yourdomain.com", "asd.com", "asdf.com", "qwerty.com", "fake.com", "noemail.com",
]);
const RESERVED_TLDS = [".test", ".example", ".invalid", ".localhost", ".local"];

const TYPOS = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com", "gamil.com": "gmail.com",
  "gmail.con": "gmail.com", "gnail.com": "gmail.com", "gmail.co.uk": "gmail.com", "gmaill.com": "gmail.com",
  "hotmial.com": "hotmail.com", "hotmail.co": "hotmail.com", "hotmai.com": "hotmail.com", "hotmal.com": "hotmail.com",
  "hotmail.con": "hotmail.com", "hotmial.co.uk": "hotmail.co.uk",
  "yahoo.co": "yahoo.com", "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.con": "yahoo.com",
  "outlok.com": "outlook.com", "outlook.co": "outlook.com", "outloo.com": "outlook.com", "outlook.con": "outlook.com",
  "iclod.com": "icloud.com", "icloud.co": "icloud.com", "icoud.com": "icloud.com",
  "btinternet.co": "btinternet.com", "btinternt.com": "btinternet.com",
};

const mxCache = new Map();

async function hasMailServer(domain) {
  if (mxCache.has(domain)) return mxCache.get(domain);
  let result = true; // unknown = let through
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, {
      headers: { accept: "application/dns-json" },
    });
    if (res.ok) {
      const body = await res.json();
      // Status 3 = the domain doesn't exist at all.
      if (body.Status === 3) result = false;
      else if (body.Status === 0) {
        const mx = (body.Answer ?? []).filter((a) => a.type === 15);
        // A "null MX" (RFC 7505: "0 .") says the domain accepts no mail.
        result = mx.length > 0 && !mx.every((a) => /^0\s+\.$/.test(String(a.data).trim()));
        if (!mx.length) {
          // No MX: mail falls back to the domain's own address record.
          const a = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
            headers: { accept: "application/dns-json" },
          }).then((r) => r.json()).catch(() => null);
          result = !a || (a.Answer ?? []).some((x) => x.type === 1);
        }
      }
    }
  } catch { /* offline or blocked: don't stop a real sign-up */ }
  mxCache.set(domain, result);
  return result;
}

// Returns null when the address is fine, or a sentence saying what's wrong.
export async function checkEmail(raw) {
  const email = String(raw ?? "").trim().toLowerCase();
  if (!FORMAT.test(email)) return "Please enter a valid email address.";
  const domain = email.split("@")[1];
  if (TYPOS[domain]) return `Did you mean ${email.split("@")[0]}@${TYPOS[domain]}? Please check the email address.`;
  if (RESERVED_DOMAINS.has(domain) || RESERVED_TLDS.some((t) => domain.endsWith(t))) {
    return "Please use a real email address — we'll send your account emails to it.";
  }
  if (!(await hasMailServer(domain))) {
    return `We can't deliver email to "${domain}". Please check the address, or use a different one.`;
  }
  return null;
}
