// How complete a business's public page is, worked out from its real listing.
// A Free listing can only show its name, picture, address, phone and email,
// so it's scored on those; a Visibility Plan listing on everything its page
// can show.

const filled = (v) => {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.values(v).some(filled);
  return true;
};

const BASICS = [
  ["name", "Add your business name"],
  ["heroImage", "Add a main picture"],
  ["address", "Add your address"],
  ["phone", "Add a phone number"],
  ["email", "Add a contact email"],
];

const VISIBILITY = [
  ["description", "Write a description of your business"],
  ["tagline", "Add a headline"],
  ["logo", "Upload your logo"],
  ["hours", "Add your opening hours"],
  ["website", "Add your website link"],
  ["social", "Link your social media"],
  ["faqs", "Answer a few FAQs"],
];

export function profileCompleteness(listing, premium) {
  const checks = premium ? [...BASICS, ...VISIBILITY] : BASICS;
  const results = checks.map(([field, tip]) => ({ ok: filled(listing?.[field]), tip }));
  if (premium) {
    const photos = (listing?.gallery ?? []).filter(Boolean).length;
    results.push({ ok: photos >= 3, tip: `Add ${photos ? `${3 - photos} more` : "3"} gallery photo${3 - photos === 1 ? "" : "s"}` });
  }
  const done = results.filter((r) => r.ok).length;
  return {
    percent: Math.round((done / results.length) * 100),
    missing: results.filter((r) => !r.ok).map((r) => r.tip),
  };
}
