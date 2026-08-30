import { useState } from "react";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Field, Inp, TextArea, Select, Toast, useToast, FOREST, SAGE, MUTED, BORDER, CARD, INPUT } from "../components/FormKit";
import { BUSINESS_SUPPORT_TICKETS, TICKET_CATEGORIES } from "../../Data/businessPortalMock";

function StatusBadge({ status }) {
  const map = {
    Open: { bg: "rgba(220,38,38,0.1)", fg: "#991B1B" },
    "In Progress": { bg: "rgba(232,163,61,0.16)", fg: "#92400E" },
    Resolved: { bg: "rgba(82,199,182,0.16)", fg: "#0F766E" },
  };
  const c = map[status] ?? map.Open;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: c.bg, color: c.fg }}>{status}</span>;
}

function TicketDetail({ ticket, onBack, onUpdate, notify }) {
  const [reply, setReply] = useState("");

  function handleSend() {
    if (!reply.trim()) return;
    const msg = { from: "business", author: "You", date: new Date().toISOString().slice(0, 16).replace("T", " "), body: reply.trim() };
    onUpdate({ ...ticket, thread: [...ticket.thread, msg] });
    setReply("");
    notify("Message sent.");
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <button onClick={onBack} className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: FOREST }}>← My Tickets</button>

      <div className="bg-white rounded-2xl p-5" style={CARD}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-lg font-bold" style={{ color: FOREST }}>{ticket.subject}</h1>
          <StatusBadge status={ticket.status} />
        </div>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{ticket.category} · Submitted {ticket.submitted}</p>
      </div>

      <div className="flex flex-col gap-3">
        {ticket.thread.map((m, i) => (
          <div key={i} className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.from === "business" ? "self-end" : "self-start"}`}
            style={m.from === "business" ? { backgroundColor: SAGE, color: "#fff" } : { backgroundColor: "#fff", color: FOREST, border: `1px solid ${BORDER}` }}>
            <p className="text-[11px] font-semibold mb-1 opacity-80">{m.author} · {m.date}</p>
            <p className="text-sm leading-relaxed">{m.body}</p>
          </div>
        ))}
      </div>

      {ticket.status !== "Resolved" && (
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
          <p className="text-sm font-bold" style={{ color: FOREST }}>Send a follow-up message</p>
          <TextArea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your message…" />
          <button onClick={handleSend} disabled={!reply.trim()} className="self-start px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}

function NewTicketTab({ notify }) {
  const [category, setCategory] = useState(TICKET_CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);

  function handleSubmit() {
    if (!subject.trim() || !message.trim()) return;
    // TODO: create Supabase ticket record and trigger admin notification email
    notify("Your support request has been submitted. We'll respond within 1-2 business days.");
    setSubject(""); setMessage(""); setAttachment(null); setCategory(TICKET_CATEGORIES[0]);
  }

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-4 max-w-2xl" style={CARD}>
      <Field label="Category">
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          {TICKET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </Select>
      </Field>
      <Field label="Subject"><Inp value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary…" /></Field>
      <Field label="Message"><TextArea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue or question…" /></Field>
      <Field label="Attach a screenshot if helpful" hint="Optional">
        <input type="file" accept="image/*" onChange={(e) => setAttachment(e.target.files?.[0]?.name ?? null)}
          className="text-sm" style={{ color: MUTED }} />
        {attachment && <span className="text-xs" style={{ color: "#0F766E" }}>{attachment}</span>}
      </Field>
      <button onClick={handleSubmit} disabled={!subject.trim() || !message.trim()}
        className="self-start px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
        Submit
      </button>
    </div>
  );
}

export default function SupportPage() {
  const { user } = useBusinessAuth();
  const [tickets, setTickets] = useState(() => [...(BUSINESS_SUPPORT_TICKETS[user.id] ?? [])]);
  const [tab, setTab] = useState("mine");
  const [viewing, setViewing] = useState(null);
  const [toast, setToast] = useToast();

  function notify(msg) { setToast(msg); }
  function updateTicket(updated) {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setViewing(updated);
  }

  if (viewing) {
    return (
      <BusinessLayout>
        <Toast message={toast} />
        <TicketDetail ticket={viewing} onBack={() => setViewing(null)} onUpdate={updateTicket} notify={notify} />
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout>
      <Toast message={toast} />
      <div className="flex flex-col gap-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Support</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Get help from our team.</p>
        </div>

        <div className="flex gap-1 border-b" style={{ borderColor: BORDER }}>
          {[["mine", "My Tickets"], ["new", "New Ticket"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-5 py-2.5 text-sm font-medium transition-all"
              style={{ color: tab === key ? "#0F766E" : MUTED, borderBottom: tab === key ? `2px solid ${SAGE}` : "2px solid transparent", marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "mine" ? (
          tickets.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>No support tickets yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {tickets.map((t) => (
                <button key={t.id} onClick={() => setViewing(t)} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-4 text-left transition-shadow hover:shadow-md" style={CARD}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: FOREST }}>{t.subject}</p>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>{t.category} · Submitted {t.submitted}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </button>
              ))}
            </div>
          )
        ) : (
          <NewTicketTab notify={notify} />
        )}
      </div>
    </BusinessLayout>
  );
}
