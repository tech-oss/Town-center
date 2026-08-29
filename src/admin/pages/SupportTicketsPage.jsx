import { useState } from "react";
import { SUPPORT_TICKETS, TICKET_CATEGORIES } from "../../Data/adminMissingScreensMock";
import { getBusinesses } from "../../api/admin";
import useFetch from "../../hooks/useFetch";
import StatusTag from "../components/StatusTag";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";

const NAVY = "#1E293B", BLUE = "#2563EB", MUTED = "#6B7280", BORDER = "rgba(16,24,40,0.12)";
const CARD = { backgroundColor: "#fff", border: "1px solid #eef1f6", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };
const INPUT = { border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" };
const STATUS_FILTERS = ["All", "Open", "In Progress", "Resolved"];

function Toast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg flex items-center gap-3 max-w-sm" style={{ backgroundColor: NAVY, color: "#fff" }}>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-lg leading-none">✕</button>
    </div>
  );
}

// ─── Ticket detail / thread panel ─────────────────────────────────────────────
function TicketDetail({ ticket, onBack, onUpdate, notify }) {
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState(ticket.status);
  const [sending, setSending] = useState(false);

  function handleSendReply() {
    if (!reply.trim()) return;
    setSending(true);
    // TODO: trigger Resend email notification to business on reply
    setTimeout(() => {
      const msg = { from: "admin", author: "Admin Support", date: new Date().toISOString().slice(0, 16).replace("T", " "), body: reply.trim() };
      onUpdate({ ...ticket, thread: [...ticket.thread, msg] });
      setReply("");
      setSending(false);
      notify("Reply sent.");
    }, 400);
  }

  function handleUpdateStatus() {
    onUpdate({ ...ticket, status });
    notify(`Status updated to ${status}.`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <button onClick={onBack} className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: NAVY }}>← Inbox</button>

      <div className="bg-white rounded-2xl p-6" style={CARD}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
          <div>
            <h1 className="text-lg font-bold" style={{ color: NAVY }}>{ticket.subject}</h1>
            <p className="text-sm mt-0.5" style={{ color: MUTED }}>{ticket.businessName} · {ticket.contactEmail}</p>
          </div>
          <StatusTag status={ticket.status} />
        </div>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{ticket.category} · Submitted {ticket.submitted}</p>
      </div>

      {/* Thread */}
      <div className="flex flex-col gap-3">
        {ticket.thread.map((m, i) => (
          <div key={i} className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.from === "admin" ? "self-end" : "self-start"}`}
            style={m.from === "admin"
              ? { backgroundColor: BLUE, color: "#fff" }
              : { backgroundColor: "#fff", color: NAVY, border: `1px solid ${BORDER}` }}>
            <p className="text-[11px] font-semibold mb-1 opacity-80">{m.author} · {m.date}</p>
            <p className="text-sm leading-relaxed">{m.body}</p>
          </div>
        ))}
      </div>

      {/* Reply composer */}
      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
        <p className="text-sm font-bold" style={{ color: NAVY }}>Reply</p>
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4}
          placeholder="Type your reply to the business…"
          className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={INPUT} />
        <button onClick={handleSendReply} disabled={sending || !reply.trim()}
          className="self-start px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
          style={{ backgroundColor: BLUE }}>
          {sending ? "Sending…" : "Send Reply"}
        </button>
      </div>

      {/* Status update */}
      <div className="bg-white rounded-2xl p-5 flex items-center gap-3 flex-wrap" style={CARD}>
        <p className="text-sm font-bold" style={{ color: NAVY }}>Status</p>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm outline-none" style={INPUT}>
          <option>Open</option><option>In Progress</option><option>Resolved</option>
        </select>
        <button onClick={handleUpdateStatus}
          className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
          Update Status
        </button>
      </div>
    </div>
  );
}

// ─── New Message tab ──────────────────────────────────────────────────────────
function NewMessageTab({ businesses, notify }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(TICKET_CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const matches = query.trim() && !selected
    ? (businesses ?? []).filter((b) =>
        b.name.toLowerCase().includes(query.toLowerCase()) || (b.email ?? "").toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6)
    : [];

  function handleSend() {
    if (!selected || !subject.trim() || !message.trim()) return;
    setSending(true);
    // TODO: create ticket record in Supabase and trigger email
    setTimeout(() => {
      setSending(false);
      notify(`Message sent to ${selected.name}`);
      setSelected(null); setQuery(""); setSubject(""); setMessage(""); setCategory(TICKET_CATEGORIES[0]);
    }, 400);
  }

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-4 max-w-2xl" style={CARD}>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold" style={{ color: MUTED }}>Business</span>
        {selected ? (
          <div className="flex items-center gap-2 w-fit px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(37,99,235,0.08)", border: `1.5px solid rgba(37,99,235,0.25)` }}>
            <span className="text-sm font-semibold" style={{ color: BLUE }}>{selected.name}</span>
            <button onClick={() => setSelected(null)} className="text-xs font-bold" style={{ color: BLUE }}>✕</button>
          </div>
        ) : (
          <div className="relative">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by business name or email…"
              className="rounded-xl px-3 py-2.5 text-sm outline-none w-full" style={INPUT} />
            {matches.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-xl overflow-hidden bg-white" style={{ border: `1.5px solid ${BORDER}`, boxShadow: "0 8px 24px rgba(16,24,40,0.12)" }}>
                {matches.map((b) => (
                  <button key={b.id} onClick={() => { setSelected(b); setQuery(""); }}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: NAVY, borderBottom: `1px solid ${BORDER}` }}>
                    <span className="font-semibold">{b.name}</span>
                    <span className="block text-xs" style={{ color: MUTED }}>{b.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold" style={{ color: MUTED }}>Subject</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Update on your listing"
          className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold" style={{ color: MUTED }}>Category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl px-3 py-2.5 text-sm outline-none w-fit" style={INPUT}>
          {TICKET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold" style={{ color: MUTED }}>Message</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Write your message…"
          className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={INPUT} />
      </label>

      <button onClick={handleSend} disabled={sending || !selected || !subject.trim() || !message.trim()}
        className="self-start px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
        style={{ backgroundColor: BLUE }}>
        {sending ? "Sending…" : "Send"}
      </button>
    </div>
  );
}

// ─── Inbox tab ─────────────────────────────────────────────────────────────────
function InboxTab({ tickets, onView, onResolve }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    if (search.trim() && !t.businessName.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={statusFilter === s ? { backgroundColor: BLUE, color: "#fff" } : { backgroundColor: "#fff", color: NAVY, border: `1.5px solid ${BORDER}` }}>
              {s}
            </button>
          ))}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search business name…"
          className="ml-auto w-56 rounded-xl px-3 py-2 text-sm outline-none" style={INPUT} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No tickets yet" message="Support tickets from businesses will appear here." icon="🎫" />
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={{ ...CARD }}>
          <table className="w-full min-w-[700px] text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: "rgba(16,24,40,0.05)", borderBottom: `1px solid ${BORDER}` }}>
                {["Business", "Subject", "Category", "Submitted", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-[11px] uppercase tracking-wider" style={{ color: NAVY }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: NAVY }}>{t.businessName}</td>
                  <td className="px-4 py-3" style={{ color: NAVY }}>{t.subject}</td>
                  <td className="px-4 py-3" style={{ color: MUTED }}>{t.category}</td>
                  <td className="px-4 py-3" style={{ color: MUTED }}>{t.submitted}</td>
                  <td className="px-4 py-3"><StatusTag status={t.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onView(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>View</button>
                      {t.status !== "Resolved" && (
                        <button onClick={() => onResolve(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: "1.5px solid rgba(22,163,74,0.3)", color: "#15803D" }}>Resolve</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState(SUPPORT_TICKETS);
  const [tab, setTab] = useState("inbox");
  const [viewing, setViewing] = useState(null);
  const [toast, setToast] = useState(null);
  const { data: businesses, loading } = useFetch(getBusinesses, []);

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 3500); }

  function updateTicket(updated) {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setViewing(updated);
  }

  if (viewing) {
    return (
      <>
        <Toast message={toast} onDismiss={() => setToast(null)} />
        <TicketDetail ticket={viewing} onBack={() => setViewing(null)} onUpdate={updateTicket} notify={notify} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Support Tickets</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Respond to business support requests or start a new conversation.</p>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: BORDER }}>
        {[["inbox", "Inbox"], ["new", "New Message"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="px-5 py-2.5 text-sm font-medium transition-all"
            style={{ color: tab === key ? BLUE : MUTED, borderBottom: tab === key ? `2px solid ${BLUE}` : "2px solid transparent", marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "inbox" ? (
        <InboxTab tickets={tickets} onView={setViewing}
          onResolve={(t) => { updateTicket({ ...t, status: "Resolved" }); notify(`"${t.subject}" marked resolved.`); }} />
      ) : loading ? <LoadingState /> : (
        <NewMessageTab businesses={businesses} notify={notify} />
      )}
    </div>
  );
}
