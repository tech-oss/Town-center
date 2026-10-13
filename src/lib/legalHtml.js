// Cleans the HTML of a legal page (Privacy Policy, Terms of Use) down to the
// few things those pages are made of: headings, paragraphs, lists, bold,
// italic, underline and links. Everything else is unwrapped to its text or
// dropped.
//
// Used three ways: on paste into the admin editor (so a document copied from
// Word or Google Docs keeps its structure but not its fonts and colours), on
// save, and again when the public page shows it.

const BLOCKS = {
  H1: "h2", H2: "h2", H3: "h3", H4: "h3", H5: "h3", H6: "h3",
  P: "p", DIV: "p", BLOCKQUOTE: "p", UL: "ul", OL: "ol", LI: "li",
};
const INLINES = { B: "b", STRONG: "b", I: "i", EM: "i", U: "u", A: "a", BR: "br" };
const DROP = new Set([
  "SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "TEMPLATE", "HEAD", "META", "LINK",
  "TITLE", "NOSCRIPT", "SVG", "IMG", "PICTURE", "VIDEO", "AUDIO", "CANVAS", "FORM",
  "INPUT", "BUTTON", "SELECT", "TEXTAREA", "TABLE",
]);
const TEXT_BLOCKS = new Set(["p", "h2", "h3"]);
const INLINE_OUT = new Set(["b", "i", "u", "a", "br"]);

function safeHref(href) {
  const h = String(href ?? "").trim();
  if (/^(https?:|mailto:|tel:)/i.test(h) || /^[/#]/.test(h)) return h;
  if (/^www\./i.test(h)) return `https://${h}`;
  return null;
}

// What an element becomes, from its tag and (for pasted Word / Google Docs
// text, which styles spans rather than using <b>) its inline style.
function target(el) {
  const style = (el.getAttribute("style") || "").toLowerCase();
  // Word's own list bullets and numbers ("·", "1.") — the list is rebuilt.
  if (/mso-list:\s*ignore/.test(style)) return "drop";
  if (el.tagName === "P" && /mso-list:/.test(style)) return "li";
  // Google Docs wraps the whole paste in <b style="font-weight:normal">.
  if (el.tagName === "B" && /font-weight:\s*(normal|400)/.test(style)) return null;
  const mapped = BLOCKS[el.tagName] || INLINES[el.tagName];
  if (mapped) return mapped;
  if (el.tagName === "SPAN") {
    if (/font-weight:\s*(bold|[6-9]00)/.test(style)) return "b";
    if (/font-style:\s*italic/.test(style)) return "i";
    if (/text-decoration:[^;]*underline/.test(style)) return "u";
  }
  return null;
}

function walk(src, dest, doc) {
  for (const node of Array.from(src.childNodes)) {
    if (node.nodeType === 3) { dest.append(doc.createTextNode(node.nodeValue.replace(/\u00a0/g, " "))); continue; }
    if (node.nodeType !== 1 || DROP.has(node.tagName)) continue;
    let tag = target(node);
    if (tag === "drop") continue;
    const into = dest.tagName?.toLowerCase();
    // No blocks inside a paragraph or heading: keep their words, on a new line.
    if (tag && !INLINE_OUT.has(tag) && TEXT_BLOCKS.has(into)) {
      if (dest.textContent.trim()) dest.append(doc.createElement("br"));
      tag = null;
    }
    if (tag === "a") {
      const href = safeHref(node.getAttribute("href"));
      if (!href) tag = null;
      else {
        const a = doc.createElement("a");
        a.setAttribute("href", href);
        if (/^https?:/i.test(href)) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener noreferrer"); }
        walk(node, a, doc);
        dest.append(a);
        continue;
      }
    }
    if (tag === "br") { dest.append(doc.createElement("br")); continue; }
    if (!tag) { walk(node, dest, doc); continue; }
    const el = doc.createElement(tag);
    walk(node, el, doc);
    dest.append(el);
  }
}

function isEmpty(el) {
  return !el.textContent.replace(/\s+/g, "");
}

// Loose words at the top level go into paragraphs, stray list items into a
// list, and empty blocks are removed.
function tidy(root, doc) {
  const out = doc.createElement("div");
  let para = null;
  let list = null;
  for (const node of Array.from(root.childNodes)) {
    const tag = node.nodeType === 1 ? node.tagName.toLowerCase() : "#text";
    if (tag === "#text" || INLINE_OUT.has(tag)) {
      list = null;
      if (!para) { para = doc.createElement("p"); out.append(para); }
      para.append(node);
      continue;
    }
    para = null;
    if (tag === "li") {
      if (!list) { list = doc.createElement("ul"); out.append(list); }
      list.append(node);
      continue;
    }
    list = null;
    out.append(node);
  }
  // Inside lists: anything that is not an item becomes one.
  for (const l of Array.from(out.querySelectorAll("ul, ol"))) {
    for (const child of Array.from(l.childNodes)) {
      if (child.nodeType === 1 && child.tagName === "LI") continue;
      if (child.nodeType === 3 && !child.nodeValue.trim()) { child.remove(); continue; }
      const li = doc.createElement("li");
      l.insertBefore(li, child);
      li.append(child);
    }
  }
  // Empty blocks and empty formatting, innermost first.
  for (const el of Array.from(out.querySelectorAll("b, i, u, a, li, p, h2, h3, ul, ol")).reverse()) {
    if (isEmpty(el)) el.remove();
  }
  // Line breaks that only pad the end of a block.
  for (const br of Array.from(out.querySelectorAll("br"))) {
    if (!br.nextSibling && br.parentElement !== out) br.remove();
  }
  return out;
}

export function cleanLegalHtml(html) {
  if (!html || typeof DOMParser === "undefined") return html || "";
  const doc = new DOMParser().parseFromString(`<!doctype html><body>${html}</body>`, "text/html");
  const root = doc.createElement("div");
  walk(doc.body, root, doc);
  return tidy(root, doc).innerHTML.trim();
}

// Plain text pasted into the editor: a blank line starts a new paragraph.
export function textToLegalHtml(text) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// How a legal document's text is styled. Shared with the admin editor
// (Site Content → Privacy Policy / Terms of Use) so what admin types looks
// the same as the published page.
export function legalDocumentClass(compact = false) {
  return [
    "legal-document",
    compact ? "text-sm" : "text-[15px] md:text-base",
    "leading-relaxed text-black",
    "[&_h2]:font-bold [&_h2]:text-black [&_h2]:mt-8 [&_h2]:mb-3",
    compact ? "[&_h2]:text-base" : "[&_h2]:text-xl md:[&_h2]:text-2xl",
    "[&_h3]:font-bold [&_h3]:text-black [&_h3]:mt-6 [&_h3]:mb-2",
    compact ? "[&_h3]:text-sm" : "[&_h3]:text-lg",
    "[&_p]:my-3 [&_ul]:my-3 [&_ul]:pl-5 [&_ul]:list-disc [&_ol]:my-3 [&_ol]:pl-5 [&_ol]:list-decimal [&_li]:my-1.5",
    "[&_b]:font-semibold [&_strong]:font-semibold [&_i]:italic [&_em]:italic [&_u]:underline",
    "[&_a]:underline [&_a]:text-[var(--teal-deep)]",
  ].join(" ");
}
