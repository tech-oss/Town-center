import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { withDefaults } from "../Data/siteSections";

// The admin-edited words and pictures for one page.
//
// Every page that Site Content can edit reads through here, so what admin
// saves is what the page shows. Until now only Getting Here and The Future
// read from site_content at all: the rest of the screen wrote rows nobody
// ever read, which is why editing a headline appeared to do nothing.
//
// It never returns nothing. Where admin has not written a value the page gets
// the wording already in the component, so an untouched page is unchanged and
// a failed fetch is invisible rather than a page with no title.

// One read per key per page load, shared between the components that want it
// (a listing page and its app screen ask for the same key).
const cache = new Map();

function load(key) {
  if (!cache.has(key)) {
    cache.set(
      key,
      supabase
        .from("site_content")
        .select("content")
        .eq("key", key)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.warn(`Site content for "${key}" unavailable:`, error.message);
            // Don't remember a failure — the next page asks again.
            cache.delete(key);
            return {};
          }
          return data?.content ?? {};
        })
        .catch(() => {
          cache.delete(key);
          return {};
        })
    );
  }
  return cache.get(key);
}

// Forget everything, so a save in the admin panel shows on the next view
// without a full reload.
export function clearSiteSectionCache() {
  cache.clear();
}

export default function useSiteSection(key) {
  // Starts on the component's own wording, so nothing flashes empty.
  const [content, setContent] = useState(() => withDefaults(key, null));

  useEffect(() => {
    let cancelled = false;
    setContent(withDefaults(key, null));
    load(key).then((saved) => {
      if (!cancelled) setContent(withDefaults(key, saved));
    });
    return () => { cancelled = true; };
  }, [key]);

  return content;
}
