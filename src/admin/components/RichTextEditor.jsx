import { useEffect, useRef, useState } from "react";
import { cleanLegalHtml, textToLegalHtml } from "../../lib/legalHtml";
import { BLUE, BORDER, MUTED, NAVY } from "../theme";

// A free-form document editor: type, format with the toolbar, paste from Word
// or Google Docs. Holds headings, paragraphs, bulleted and numbered lists,
// bold, italic, underline and links — the same things the public page shows
// (lib/legalHtml.js), so pasted fonts, colours and tables are cleaned away.
//
// `value` is read when the editor mounts; give it a new `key` to load
// different text (e.g. after "Restore original"). `onChange` gets the HTML on
// every edit. `className` styles the text area like the page it publishes to.

const BLOCK_OPTIONS = [
  { value: "p", label: "Paragraph" },
  { value: "h2", label: "Heading" },
  { value: "h3", label: "Subheading" },
];

function exec(command, arg) {
  document.execCommand(command, false, arg);
}

function ToolButton({ label, title, active, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active ?? undefined}
      // Keep the text selection: a normal click would move focus off the editor.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="min-w-8 h-8 px-2 rounded-lg text-sm transition-colors hover:bg-black/5"
      style={{ color: active ? BLUE : NAVY, backgroundColor: active ? "rgba(37,99,235,0.1)" : undefined }}
    >
      {children ?? label}
    </button>
  );
}

const Divider = () => <span className="w-px h-5 mx-1" style={{ backgroundColor: BORDER }} />;

export default function RichTextEditor({ value, onChange, className = "", placeholder = "Start typing…" }) {
  const ref = useRef(null);
  const [state, setState] = useState({ block: "p", bold: false, italic: false, underline: false, ul: false, ol: false });
  const [empty, setEmpty] = useState(!value);

  // Load the starting text once; after that the editor owns its content.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toolbar buttons light up for the formatting under the cursor.
  useEffect(() => {
    function onSelection() {
      const sel = document.getSelection();
      if (!ref.current || !sel?.anchorNode || !ref.current.contains(sel.anchorNode)) return;
      let block = "p";
      for (let n = sel.anchorNode; n && n !== ref.current; n = n.parentNode) {
        if (n.nodeType === 1 && /^H[23]$/.test(n.tagName)) { block = n.tagName.toLowerCase(); break; }
      }
      setState({
        block,
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
      });
    }
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
  }, []);

  function changed() {
    const html = ref.current?.innerHTML ?? "";
    setEmpty(!ref.current?.textContent.trim());
    onChange(html);
  }

  function run(command, arg) {
    ref.current?.focus();
    exec(command, arg);
    changed();
  }

  function setBlock(tag) {
    run("formatBlock", `<${tag}>`);
    setState((s) => ({ ...s, block: tag }));
  }

  function addLink() {
    const sel = document.getSelection();
    if (!sel || sel.isCollapsed) {
      alert("Select the words to turn into a link first.");
      return;
    }
    const range = sel.getRangeAt(0);
    const url = prompt("Link address (https://…, mailto:… or a page such as /terms)", "https://");
    if (!url || url === "https://") return;
    sel.removeAllRanges();
    sel.addRange(range);
    run("createLink", url.trim());
  }

  function onPaste(e) {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const clean = html ? cleanLegalHtml(html) : textToLegalHtml(e.clipboardData.getData("text/plain"));
    if (clean) run("insertHTML", clean);
  }

  return (
    <div className="rounded-2xl bg-white" style={{ border: `1.5px solid ${BORDER}` }}>
      <div
        className="sticky top-0 z-10 flex items-center flex-wrap gap-0.5 px-2 py-1.5 rounded-t-2xl bg-white"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <select
          value={state.block}
          onChange={(e) => setBlock(e.target.value)}
          className="h-8 rounded-lg px-2 text-sm outline-none bg-transparent"
          style={{ color: NAVY, border: `1px solid ${BORDER}` }}
          aria-label="Text style"
        >
          {BLOCK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Divider />
        <ToolButton title="Bold" active={state.bold} onClick={() => run("bold")}><b>B</b></ToolButton>
        <ToolButton title="Italic" active={state.italic} onClick={() => run("italic")}><i className="font-serif">I</i></ToolButton>
        <ToolButton title="Underline" active={state.underline} onClick={() => run("underline")}><u>U</u></ToolButton>
        <Divider />
        <ToolButton title="Bulleted list" active={state.ul} onClick={() => run("insertUnorderedList")}>• List</ToolButton>
        <ToolButton title="Numbered list" active={state.ol} onClick={() => run("insertOrderedList")}>1. List</ToolButton>
        <Divider />
        <ToolButton title="Add link" onClick={addLink}>Link</ToolButton>
        <ToolButton title="Remove link" onClick={() => run("unlink")}>Unlink</ToolButton>
        <ToolButton title="Clear formatting" onClick={() => run("removeFormat")}>Clear</ToolButton>
        <Divider />
        <ToolButton title="Undo" onClick={() => run("undo")}>↶</ToolButton>
        <ToolButton title="Redo" onClick={() => run("redo")}>↷</ToolButton>
      </div>
      <div className="relative">
        {empty && (
          <p className="absolute top-5 left-6 text-sm pointer-events-none" style={{ color: MUTED }}>{placeholder}</p>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onFocus={() => exec("defaultParagraphSeparator", "p")}
          onInput={changed}
          onPaste={onPaste}
          className={`px-6 py-4 min-h-[420px] max-h-[70vh] overflow-y-auto outline-none ${className}`}
        />
      </div>
    </div>
  );
}
