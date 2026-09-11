// One-time seed: moves the hardcoded src/Data/gettingHere.js content into the
// public.site_content row the admin "Getting Here & Good to Know" editor reads
// and writes, so the live page can be edited without touching code.
//
// Run once from the admin panel's browser console while signed in as an admin
// (site_content writes are gated on is_admin()):
//
//   const { seedGettingHere } = await import("/supabase/seed/seed_getting_here.js");
//   await seedGettingHere();
//
// Safe to re-run: upserts the single row keyed "getting-here".
import { travelSections, travelStats, goodToKnow, carParks } from "../../src/Data/gettingHere";
import { supabase } from "../../src/lib/supabaseClient";

export const GETTING_HERE_CONTENT = {
  heroEyebrow: "Plan Your Visit",
  heroTitle: "Getting Here & Good to Know",
  heroIntro:
    "By rail, road, bus or bicycle, getting to and around Maidenhead is easy — with the Elizabeth Line putting central London just 25 minutes away.",
  heroImage: "/images/getting-here.jpg",
  stats: travelStats,
  sections: travelSections,
  carParks,
  goodToKnowEyebrow: "Good to Know",
  goodToKnowHeading: "Before You Visit",
  goodToKnowIntro: "A few practical things worth knowing before you head into the town centre.",
  goodToKnow,
};

export async function seedGettingHere() {
  const { error } = await supabase.from("site_content").upsert({
    key: "getting-here",
    label: "Getting Here & Good to Know",
    kind: "getting-here",
    content: GETTING_HERE_CONTENT,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return { ok: true };
}
