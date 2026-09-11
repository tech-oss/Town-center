// Public reads of admin-editable page content held in public.site_content.
// Each row is { key, label, kind, content jsonb } — the jsonb keeps the shape
// each page needs without a bespoke table per page.
import { supabase } from "../lib/supabaseClient";

export async function getSiteSection(key) {
  const { data, error } = await supabase
    .from("site_content")
    .select("content")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return data?.content ?? null;
}

// The Getting Here & Good to Know page (/getting-here) and the mobile
// Transport and Parking screens all render from this one row.
export function getGettingHere() {
  return getSiteSection("getting-here");
}
