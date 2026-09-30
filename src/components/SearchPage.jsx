import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { buildSearchIndex, searchAll } from "../lib/searchIndex";

// The website's search results (/search?q=…): businesses, events, news and
// offers, featured stories, guides, hotels and practical info — the same
// index the app searches.
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const [text, setText] = useState(query);
  const [group, setGroup] = useState("All");
  const { data: index, loading } = useFetch(() => buildSearchIndex("web"), []);

  useEffect(() => { setText(query); setGroup("All"); window.scrollTo(0, 0); }, [query]);

  const all = useMemo(() => searchAll(index ?? [], query), [index, query]);
  const groups = useMemo(() => ["All", ...new Set(all.map((r) => r.group))], [all]);
  const results = group === "All" ? all : all.filter((r) => r.group === group);

  function submit(e) {
    e.preventDefault();
    const q = text.trim();
    setParams(q ? { q } : {});
  }

  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "70vh" }}>
      <section className="pt-10 pb-16 md:pt-14 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <nav className="mb-5 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>Search</span>
          </nav>
          <h1 className="hero-title uppercase text-3xl md:text-5xl mb-6" style={{ color: "#000000" }}>Search</h1>

          <form onSubmit={submit} role="search" className="flex gap-2 mb-6">
            <input
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search businesses, events, offers, guides…"
              aria-label="Search the site"
              autoFocus
              className="flex-1 rounded-full px-5 py-3 text-sm bg-white focus:outline-none"
              style={{ boxShadow: "0 4px 18px -6px rgba(13,42,51,0.25)" }}
            />
            <button type="submit" className="px-6 py-3 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: "var(--forest)" }}>
              Search
            </button>
          </form>

          {query && groups.length > 2 && (
            <div className="flex gap-2 flex-wrap mb-6" role="tablist">
              {groups.map((g) => (
                <button key={g} type="button" role="tab" aria-selected={group === g} onClick={() => setGroup(g)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold"
                  style={group === g ? { backgroundColor: "var(--forest)", color: "#fff" } : { backgroundColor: "rgba(28,46,56,0.06)", color: "#000000" }}>
                  {g}{g === "All" ? ` (${all.length})` : ""}
                </button>
              ))}
            </div>
          )}

          {!query ? (
            <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>Type what you're looking for — a business, an event, an offer or a place.</p>
          ) : loading && !index ? (
            <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>No results for “{query}”. Try a different word.</p>
          ) : (
            <>
              <p className="text-sm mb-4" style={{ color: "rgba(0,0,0,0.6)" }}>
                {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
              </p>
              <ul className="flex flex-col gap-3">
                {results.map((r) => (
                  <li key={r.id}>
                    <Link to={r.to} className="flex items-center gap-4 p-3 bg-white transition-shadow hover:shadow-md"
                      style={{ boxShadow: "0 2px 10px -4px rgba(13,42,51,0.2)" }}>
                      {r.image
                        ? <img src={r.image} alt="" loading="lazy" className="w-20 h-16 object-cover shrink-0" />
                        : <span className="w-20 h-16 shrink-0" style={{ backgroundColor: "var(--mint)" }} />}
                      <span className="flex-1 min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{r.group}</span>
                        <span className="block text-base font-semibold truncate" style={{ color: "#000000" }}>{r.title}</span>
                        {r.subtitle && <span className="block text-xs truncate" style={{ color: "rgba(0,0,0,0.6)" }}>{r.subtitle}</span>}
                      </span>
                      <span aria-hidden="true" className="text-sm font-semibold" style={{ color: "#000000" }}>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
