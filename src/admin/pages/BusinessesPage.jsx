import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import {
  getBusinesses, registerBusiness, approveBusiness, rejectBusiness,
  suspendBusiness, reinstateBusiness, deleteBusiness,
  SECTION_OPTIONS, SUBCATEGORIES, CUISINE_OPTIONS, BUSINESS_PLANS,
} from "../../api/admin";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { BUSINESS_TEAM_MEMBERS, TEAM_ROLES } from "../../Data/adminMissingScreensMock";

// ─── Theme ────────────────────────────────────────────────────────────────────
const NAVY  = "#1E293B";
const BLUE  = "#2563EB";
const MUTED = "#64748B";
const BORDER = "rgba(16,24,40,0.12)";
const CARD = { backgroundColor: "#fff", border: "1px solid #eef1f6", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };
const FIELD_STYLE = { border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" };

const STATUS_FILTERS = ["All", "Pending", "Approved", "Suspended", "Rejected"];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg flex items-center gap-3 max-w-sm"
      style={{ backgroundColor: BLUE, color: "#fff" }}>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-lg leading-none">✕</button>
    </div>
  );
}

// ─── Section label helper ─────────────────────────────────────────────────────
function sectionLabel(val) {
  return SECTION_OPTIONS.find((s) => s.value === val)?.label ?? val;
}

// ─── Multi-checkbox group ─────────────────────────────────────────────────────
function CheckGroup({ options, selected, onChange, grouped }) {
  function toggle(val) {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  }
  if (grouped) {
    const groups = [...new Set(options.map((o) => o.group))];
    return (
      <div className="flex flex-col gap-3">
        {groups.map((g) => (
          <div key={g}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: MUTED }}>{g}</p>
            <div className="flex flex-wrap gap-2">
              {options.filter((o) => o.group === g).map((o) => (
                <Chip key={o.value} label={o.label} checked={selected.includes(o.value)} onClick={() => toggle(o.value)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o.value} label={o.label} checked={selected.includes(o.value)} onClick={() => toggle(o.value)} />
      ))}
    </div>
  );
}

function Chip({ label, checked, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={checked
        ? { backgroundColor: BLUE, color: "#fff", border: `1.5px solid ${BLUE}` }
        : { backgroundColor: "#f8fafc", color: MUTED, border: `1.5px solid ${BORDER}` }
      }
    >
      {label}
    </button>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function FormField({ label, required, children, hint, span2 }) {
  return (
    <label className={`flex flex-col gap-1${span2 ? " sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold" style={{ color: MUTED }}>
        {label}{required && <span style={{ color: "#DC2626" }}> *</span>}
      </span>
      {children}
      {hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{hint}</span>}
    </label>
  );
}

// ─── Register form ────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  // Business
  name: "",
  section: "",
  subcategories: [],
  cuisines: [],
  newToMaidenhead: false,
  address: "",
  phone: "",
  website: "",
  plan: "Basic",
  // Location
  lat: "",
  lng: "",
  // Logo
  logo: null,        // base64 data URL
  logoName: "",
  // Optional user
  contactName: "",
  email: "",
  userRole: "Business Owner",
  createUser: false,
};

function RegisterBusinessForm({ onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileRef = useRef(null);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      set("logo", ev.target.result);
      set("logoName", file.name);
      setLogoPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleSectionChange(val) {
    setForm((f) => ({ ...f, section: val, subcategories: [], cuisines: [], newToMaidenhead: false }));
  }

  const subcats = form.section ? SUBCATEGORIES[form.section] ?? [] : [];
  const isShop  = form.section === "shop";
  const isEat   = form.section === "eat-drink";
  const isValid = form.name.trim() && form.section && form.subcategories.length > 0;

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-6"
      style={{ border: `1.5px solid ${BORDER}`, boxShadow: "0 4px 24px rgba(16,24,40,0.08)" }}>

      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-bold" style={{ color: NAVY }}>Register New Business</h3>
        <button onClick={onCancel} className="opacity-40 hover:opacity-70 text-xl leading-none" style={{ color: NAVY }}>✕</button>
      </div>

      {/* ── Section 1: Core details ── */}
      <Section title="Business Details">
        <div className="grid sm:grid-cols-2 gap-4">

          <FormField label="Business Name" required span2>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Coppa Club" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>

          <FormField label="Main Section" required>
            <select value={form.section} onChange={(e) => handleSectionChange(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ ...FIELD_STYLE }}>
              <option value="">— Select section —</option>
              {SECTION_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </FormField>

          <FormField label="Subscription Plan">
            <select value={form.plan} onChange={(e) => set("plan", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ ...FIELD_STYLE }}>
              {BUSINESS_PLANS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </FormField>

          <FormField label="Address" span2>
            <input value={form.address} onChange={(e) => set("address", e.target.value)}
              placeholder="High Street, Maidenhead SL6 1JF" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>

          <FormField label="Phone">
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
              placeholder="01628 555 000" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>

          <FormField label="Website">
            <input value={form.website} onChange={(e) => set("website", e.target.value)}
              placeholder="https://example.co.uk" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>
        </div>
      </Section>

      {/* ── Section 2: Sub-categories ── */}
      {form.section && (
        <Section title="Sub-categories" note="Select all that apply (multi-select)">
          <CheckGroup
            options={subcats}
            selected={form.subcategories}
            onChange={(v) => set("subcategories", v)}
            grouped={isShop}
          />
          {form.subcategories.length === 0 && (
            <p className="text-xs mt-1" style={{ color: "#DC2626" }}>Please select at least one sub-category.</p>
          )}
        </Section>
      )}

      {/* ── Section 3: Eat & Drink extras ── */}
      {isEat && (
        <Section title="Eat & Drink Options">
          <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>Cuisine Types (multi-select)</p>
          <CheckGroup options={CUISINE_OPTIONS} selected={form.cuisines} onChange={(v) => set("cuisines", v)} />

          <label className="flex items-center gap-3 mt-4 cursor-pointer w-fit">
            <div
              onClick={() => set("newToMaidenhead", !form.newToMaidenhead)}
              className="w-10 h-5 rounded-full transition-colors flex items-center px-0.5"
              style={{ backgroundColor: form.newToMaidenhead ? BLUE : "#D1D5DB" }}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: form.newToMaidenhead ? "translateX(20px)" : "translateX(0)" }} />
            </div>
            <span className="text-sm font-medium" style={{ color: NAVY }}>New to Maidenhead</span>
            <span className="text-xs" style={{ color: MUTED }}>— flags this business in the "New to Maidenhead" section</span>
          </label>
        </Section>
      )}

      {/* ── Section 4: Location ── */}
      <Section title="Location (for Map)" note="Used to pin this business on the interactive homepage map">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Latitude" hint="e.g. 51.5220">
            <input type="number" step="any" value={form.lat} onChange={(e) => set("lat", e.target.value)}
              placeholder="51.5220" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>
          <FormField label="Longitude" hint="e.g. -0.7198">
            <input type="number" step="any" value={form.lng} onChange={(e) => set("lng", e.target.value)}
              placeholder="-0.7198" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>
        </div>
      </Section>

      {/* ── Section 5: Logo ── */}
      <Section title="Business Logo">
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <img src={logoPreview} alt="logo preview" className="w-16 h-16 rounded-xl object-cover shrink-0"
              style={{ border: `1.5px solid ${BORDER}` }} />
          ) : (
            <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#f1f5f9", border: `1.5px dashed ${BORDER}` }}>
              <span style={{ fontSize: 24 }}>🏢</span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
              {logoPreview ? "Change Logo" : "Upload Logo"}
            </button>
            {form.logoName && <p className="text-xs" style={{ color: MUTED }}>{form.logoName}</p>}
            <p className="text-[10px]" style={{ color: "#9CA3AF" }}>PNG, JPG or SVG · max 2 MB</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
        </div>
      </Section>

      {/* ── Section 6: Optional user ── */}
      <Section title="User Account" note="Optional — add a user who will manage this business">
        <label className="flex items-center gap-3 cursor-pointer w-fit mb-4">
          <div
            onClick={() => set("createUser", !form.createUser)}
            className="w-10 h-5 rounded-full transition-colors flex items-center px-0.5"
            style={{ backgroundColor: form.createUser ? BLUE : "#D1D5DB" }}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: form.createUser ? "translateX(20px)" : "translateX(0)" }} />
          </div>
          <span className="text-sm font-medium" style={{ color: NAVY }}>Create a user account for this business</span>
        </label>

        {form.createUser && (
          <div className="grid sm:grid-cols-2 gap-4 rounded-xl p-4" style={{ backgroundColor: "rgba(37,99,235,0.04)", border: `1px solid rgba(37,99,235,0.15)` }}>
            <FormField label="Contact Name" required={form.createUser}>
              <input value={form.contactName} onChange={(e) => set("contactName", e.target.value)}
                placeholder="e.g. Olivia Grant" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
            </FormField>
            <FormField label="Email" required={form.createUser}>
              <input value={form.email} onChange={(e) => set("email", e.target.value)}
                placeholder="owner@business.co.uk" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
            </FormField>
            <FormField label="Role">
              <select value={form.userRole} onChange={(e) => set("userRole", e.target.value)}
                className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ ...FIELD_STYLE }}>
                <option>Business Owner</option>
                <option>Estate Agent</option>
                <option>Manager</option>
              </select>
            </FormField>
            <p className="sm:col-span-2 text-[11px] self-end" style={{ color: MUTED }}>
              The user will be created with <strong>Pending</strong> status and must be approved separately in the Users tab.
            </p>
          </div>
        )}
      </Section>

      {/* ── Footer ── */}
      <div className="flex gap-3 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button
          onClick={() => onSave(form)}
          disabled={!isValid || (form.createUser && (!form.contactName.trim() || !form.email.trim()))}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-90"
          style={{ backgroundColor: BLUE }}
        >
          Register Business
        </button>
        <button onClick={onCancel}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: MUTED, border: `1.5px solid #D1D5DB` }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// Builds the deep link into the universal Business Content Editor, carrying
// enough info (id, name, section) for it to pre-select this business — or
// synthesise a blank draft entry for it if no content record exists yet.
function contentEditorPath(biz) {
  // The registration form's "Live" section value doesn't match the content
  // editor's "live-stay" section key — normalise it for the deep link.
  const section = biz.section === "live" ? "live-stay" : biz.section;
  const params = new URLSearchParams({ businessId: biz.id, name: biz.name, section });
  return `/admin/business-content?${params.toString()}`;
}

// ─── Post-registration success panel ──────────────────────────────────────────
function RegistrationSuccess({ biz, onAddContent, onLater }) {
  return (
    <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center gap-4"
      style={{ border: `1.5px solid ${BORDER}`, boxShadow: "0 4px 24px rgba(16,24,40,0.08)" }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
        style={{ backgroundColor: "rgba(16,163,74,0.12)", color: "#15803D" }}>
        ✓
      </div>
      <div>
        <p className="text-base font-bold" style={{ color: NAVY }}>Business registered successfully</p>
        <p className="text-sm mt-1" style={{ color: MUTED }}>{biz.name}</p>
      </div>
      <p className="text-xs max-w-sm" style={{ color: MUTED }}>
        This business has no page content yet. Add it now so its public page is ready to publish, or come back to it later.
      </p>
      <div className="flex gap-3 mt-2">
        <button onClick={onAddContent}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: BLUE }}>
          Add Content Now
        </button>
        <button onClick={onLater}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: MUTED, border: `1.5px solid #D1D5DB` }}>
          Do This Later
        </button>
      </div>
    </div>
  );
}

// ─── Team section (multi-user per business) ───────────────────────────────────
const ROLE_COLOURS = { Owner: { bg: "rgba(37,99,235,0.1)", fg: "#1D4ED8" }, Manager: { bg: "rgba(22,163,74,0.12)", fg: "#15803D" }, Staff: { bg: "rgba(107,114,128,0.13)", fg: "#374151" } };

function TeamSection({ bizId }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState(() => BUSINESS_TEAM_MEMBERS[bizId] ?? []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Staff" });

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleInvite() {
    if (!form.name.trim() || !form.email.trim()) return;
    // TODO: create user account and send invite email via Resend
    setMembers((prev) => [...prev, { id: `tm${Date.now()}`, ...form }]);
    setForm({ name: "", email: "", role: "Staff" });
    setAdding(false);
  }

  function handleRemove(id) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="px-5 pb-5 pt-1">
      <button onClick={() => setOpen((o) => !o)} className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: BLUE }}>
        {open ? "▾" : "▸"} View Team ({members.length})
      </button>
      {open && (
        <div className="mt-3 rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: "#f8fafc", border: `1px solid ${BORDER}` }}>
          {members.length === 0 && <p className="text-xs" style={{ color: MUTED }}>No team members yet.</p>}
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 flex-wrap">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: BLUE }}>{m.name[0]}</div>
              <div className="flex-1 min-w-[140px]">
                <p className="text-sm font-semibold" style={{ color: NAVY }}>{m.name}</p>
                <p className="text-xs" style={{ color: MUTED }}>{m.email}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: ROLE_COLOURS[m.role]?.bg, color: ROLE_COLOURS[m.role]?.fg }}>{m.role}</span>
              <button onClick={() => handleRemove(m.id)} className="text-xs font-semibold" style={{ color: "#991B1B" }}>Remove</button>
            </div>
          ))}

          {adding ? (
            <div className="grid sm:grid-cols-3 gap-2 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Name"
                className="rounded-lg px-3 py-2 text-xs outline-none" style={FIELD_STYLE} />
              <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Email"
                className="rounded-lg px-3 py-2 text-xs outline-none" style={FIELD_STYLE} />
              <select value={form.role} onChange={(e) => set("role", e.target.value)}
                className="rounded-lg px-3 py-2 text-xs outline-none" style={FIELD_STYLE}>
                {TEAM_ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
              <div className="flex gap-2 sm:col-span-3">
                <button onClick={handleInvite} disabled={!form.name.trim() || !form.email.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40" style={{ backgroundColor: BLUE }}>Send Invite</button>
                <button onClick={() => setAdding(false)} className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)}
              className="self-start px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
              + Add Team Member
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, note, children }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-bold" style={{ color: NAVY }}>{title}</p>
        {note && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{note}</p>}
      </div>
      <div style={{ borderLeft: `3px solid rgba(37,99,235,0.2)`, paddingLeft: 16 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Business card ────────────────────────────────────────────────────────────
function BusinessRow({ biz, pendingAction, actionNote, onActionNote, onApprove, onOpenReject, onOpenSuspend, onSubmitAction, onCancelAction, onDelete, deletingId, onConfirmDelete, onCancelDelete, busy, onAddContent }) {
  const secLabel = sectionLabel(biz.section);
  const subcatLabels = (biz.subcategories ?? []).map((v) => {
    const all = Object.values(SUBCATEGORIES).flat();
    return all.find((o) => o.value === v)?.label ?? v;
  });

  const isActive   = pendingAction?.id === biz.id;
  const actionType = isActive ? pendingAction.type : null;
  const isDeleting = deletingId === biz.id;
  const isBusy     = busy === biz.id;

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden" style={CARD}>
      <div className="bg-white p-5 flex items-start gap-4 flex-wrap">
        {/* Logo / initial */}
        {biz.logo ? (
          <img src={biz.logo} alt={biz.name} className="w-12 h-12 rounded-xl object-cover shrink-0"
            style={{ border: `1px solid ${BORDER}` }} />
        ) : (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
            style={{ backgroundColor: "rgba(37,99,235,0.1)", color: BLUE }}>
            {biz.name[0]}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold" style={{ color: NAVY }}>{biz.name}</span>
            <StatusTag status={biz.status} />
            {!biz.hasContent && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(217,119,6,0.15)", color: "#92400E" }}>Content Pending</span>
            )}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE }}>{biz.plan}</span>
            {biz.newToMaidenhead && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "#92400E" }}>New to Maidenhead</span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {secLabel && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded"
                style={{ backgroundColor: "rgba(16,24,40,0.06)", color: NAVY }}>{secLabel}</span>
            )}
            {subcatLabels.map((l) => (
              <span key={l} className="text-[11px] px-2 py-0.5 rounded"
                style={{ backgroundColor: "rgba(37,99,235,0.06)", color: MUTED }}>{l}</span>
            ))}
          </div>

          {/* Show reason note if suspended or rejected */}
          {biz.status === "Suspended" && biz.suspendNote && (
            <p className="text-xs mb-1.5 italic" style={{ color: "#92400E" }}>Suspend reason: {biz.suspendNote}</p>
          )}
          {biz.status === "Rejected" && biz.rejectionNote && (
            <p className="text-xs mb-1.5 italic" style={{ color: "#991B1B" }}>Rejection reason: {biz.rejectionNote}</p>
          )}

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs" style={{ color: MUTED }}>
            {biz.contactName && <span>👤 {biz.contactName}</span>}
            {biz.email      && <span>✉️ {biz.email}</span>}
            {biz.phone      && <span>📞 {biz.phone}</span>}
            {biz.address    && <span className="truncate">📍 {biz.address}</span>}
            {biz.lat && biz.lng && <span>🗺 {Number(biz.lat).toFixed(4)}, {Number(biz.lng).toFixed(4)}</span>}
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: "#9CA3AF" }}>Submitted {biz.submitted}</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          {biz.status === "Pending" && (
            <>
              <BizBtn color="#16A34A" disabled={isBusy} onClick={() => onApprove(biz)}>✓ Approve</BizBtn>
              <BizBtn color="#DC2626" disabled={isBusy} onClick={() => onOpenReject(biz)}>Reject</BizBtn>
            </>
          )}
          {biz.status === "Approved" && (
            <BizBtn color="#D97706" disabled={isBusy} onClick={() => onOpenSuspend(biz)}>Suspend</BizBtn>
          )}
          {biz.status === "Suspended" && (
            <BizBtn color="#16A34A" disabled={isBusy} onClick={() => onApprove(biz)}>Reinstate</BizBtn>
          )}
          {biz.status === "Rejected" && (
            <BizBtn color="#16A34A" disabled={isBusy} onClick={() => onApprove(biz)}>Re-approve</BizBtn>
          )}

          <BizBtn color={BLUE} disabled={isBusy} onClick={() => onAddContent(biz)}>
            {biz.hasContent ? "Edit Content" : "Add Content"}
          </BizBtn>

          {/* Delete */}
          {!isDeleting ? (
            <BizBtn color="#991B1B" disabled={isBusy} onClick={() => onDelete(biz.id)}>Delete</BizBtn>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold text-center" style={{ color: "#991B1B" }}>Confirm?</p>
              <div className="flex gap-1">
                <button disabled={isBusy} onClick={() => onConfirmDelete(biz)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                  style={{ backgroundColor: "#DC2626" }}>Yes</button>
                <button onClick={onCancelDelete}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: "rgba(16,24,40,0.07)", color: NAVY }}>No</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TeamSection bizId={biz.id} />

      {/* Inline reason panel */}
      {isActive && (
        <div className="px-5 pb-5 pt-1">
          <div className="rounded-xl p-4 flex flex-col gap-3"
            style={{
              backgroundColor: actionType === "reject" ? "rgba(220,38,38,0.04)" : "rgba(217,119,6,0.04)",
              border: actionType === "reject" ? "1px solid rgba(220,38,38,0.2)" : "1px solid rgba(217,119,6,0.25)",
            }}>
            <p className="text-xs font-semibold" style={{ color: actionType === "reject" ? "#B91C1C" : "#92400E" }}>
              {actionType === "reject" ? "Rejection reason" : "Suspension reason"} for <strong>{biz.name}</strong> (required)
            </p>
            <textarea
              autoFocus
              rows={2}
              placeholder={actionType === "reject"
                ? "e.g. Incomplete information, unable to verify business details…"
                : "e.g. Violation of listing guidelines, payment dispute…"}
              value={actionNote}
              onChange={(e) => onActionNote(e.target.value)}
              className="w-full text-sm rounded-lg px-3 py-2 resize-none outline-none"
              style={{
                border: actionType === "reject" ? "1px solid rgba(220,38,38,0.35)" : "1px solid rgba(217,119,6,0.4)",
                color: NAVY, backgroundColor: "#fff",
              }}
            />
            <div className="flex gap-2">
              <button
                disabled={isBusy || !actionNote.trim()}
                onClick={() => onSubmitAction(biz)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-80"
                style={{ backgroundColor: actionType === "reject" ? "#DC2626" : "#D97706" }}
              >
                {actionType === "reject" ? "Confirm Rejection" : "Confirm Suspension"}
              </button>
              <button onClick={onCancelAction}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ backgroundColor: "rgba(16,24,40,0.07)", color: NAVY }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BizBtn({ color, children, disabled, onClick }) {
  return (
    <button disabled={disabled} onClick={onClick}
      className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 whitespace-nowrap"
      style={{ backgroundColor: `${color}18`, color, border: `1.5px solid ${color}40` }}>
      {children}
    </button>
  );
}

const SORT_OPTIONS = [
  { value: "name-asc",       label: "Name A → Z" },
  { value: "name-desc",      label: "Name Z → A" },
  { value: "submitted-desc", label: "Newest first" },
  { value: "submitted-asc",  label: "Oldest first" },
  { value: "section-asc",    label: "Section A → Z" },
  { value: "plan-asc",       label: "Plan A → Z" },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BusinessesPage() {
  const navigate = useNavigate();
  const { data: fetched, loading } = useFetch(getBusinesses, []);
  const [local, setLocal]       = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [registeredBiz, setRegisteredBiz] = useState(null); // shows the post-register success panel in place of the form
  const [toast, setToast]       = useState(null);
  const [search, setSearch]     = useState("");
  const [sortVal, setSortVal]   = useState("submitted-desc");
  // Inline action panel (reject / suspend)
  const [pendingAction, setPendingAction] = useState(null); // { id, type: "reject"|"suspend" }
  const [actionNote, setActionNote]       = useState("");
  // Delete confirm
  const [deletingId, setDeletingId] = useState(null);
  const [busy, setBusy]             = useState(null);

  const list = local ?? fetched ?? [];

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 4000); }
  function patch(id, changes) { setLocal((prev) => (prev ?? fetched ?? []).map((b) => b.id === id ? { ...b, ...changes } : b)); }

  function handleRegister(form) {
    registerBusiness(form).then((saved) => {
      setLocal((prev) => [saved, ...(prev ?? fetched ?? [])]);
      // Keep the panel open, but swap the form for the success state so
      // admin can jump straight into adding content — or defer it.
      setRegisteredBiz(saved);
    });
  }

  function handleAddContent(biz) {
    navigate(contentEditorPath(biz));
  }

  function handleDismissRegistration() {
    setShowForm(false);
    setRegisteredBiz(null);
    notify(`"${registeredBiz?.name}" registered — pending approval.`);
  }

  function handleApprove(biz) {
    setBusy(biz.id);
    approveBusiness(biz.id).then(() => {
      patch(biz.id, { status: "Approved", suspendNote: "" });
      setBusy(null);
      notify(`"${biz.name}" approved.`);
    });
  }

  function openReject(biz)  { setPendingAction({ id: biz.id, type: "reject" });  setActionNote(""); }
  function openSuspend(biz) { setPendingAction({ id: biz.id, type: "suspend" }); setActionNote(""); }
  function cancelAction()   { setPendingAction(null); setActionNote(""); }

  function submitAction(biz) {
    if (!actionNote.trim()) return;
    const note = actionNote.trim();
    setBusy(biz.id);
    const fn = pendingAction.type === "reject" ? rejectBusiness : suspendBusiness;
    const newStatus = pendingAction.type === "reject" ? "Rejected" : "Suspended";
    const noteKey   = pendingAction.type === "reject" ? "rejectionNote" : "suspendNote";
    fn(biz.id, note).then(() => {
      patch(biz.id, { status: newStatus, [noteKey]: note });
      setBusy(null);
      setPendingAction(null);
      setActionNote("");
      notify(`"${biz.name}" ${newStatus.toLowerCase()}.`);
    });
  }

  function handleDeleteStart(id)  { setDeletingId(id); }
  function handleDeleteCancel()   { setDeletingId(null); }
  function handleDeleteConfirm(biz) {
    setBusy(biz.id);
    deleteBusiness(biz.id).then(() => {
      setLocal((prev) => (prev ?? fetched ?? []).filter((b) => b.id !== biz.id));
      setBusy(null);
      setDeletingId(null);
      notify(`"${biz.name}" permanently deleted and recorded in Admin Logs.`);
    });
  }

  const counts = {
    Pending:   list.filter((b) => b.status === "Pending").length,
    Approved:  list.filter((b) => b.status === "Approved").length,
    Suspended: list.filter((b) => b.status === "Suspended").length,
    Rejected:  list.filter((b) => b.status === "Rejected").length,
  };

  const filtered = useMemo(() => {
    let result = statusFilter === "All" ? list : list.filter((b) => b.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((b) => b.name?.toLowerCase().includes(q));
    const [col, dir] = sortVal.split("-");
    result = [...result].sort((a, b) => {
      const av = (a[col] ?? "").toString().toLowerCase();
      const bv = (b[col] ?? "").toString().toLowerCase();
      return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return result;
  }, [list, statusFilter, search, sortVal]);

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Business Registrations</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Register businesses across Eat & Drink, See & Do, Shop and Live sections.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
            style={{ backgroundColor: BLUE }}>
            + Register Business
          </button>
        )}
      </div>

      {showForm && (
        registeredBiz ? (
          <RegistrationSuccess
            biz={registeredBiz}
            onAddContent={() => handleAddContent(registeredBiz)}
            onLater={handleDismissRegistration}
          />
        ) : (
          <RegisterBusinessForm onSave={handleRegister} onCancel={() => setShowForm(false)} />
        )
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pending",   value: counts.Pending,   accent: "#D97706" },
          { label: "Approved",  value: counts.Approved,  accent: "#16A34A" },
          { label: "Suspended", value: counts.Suspended, accent: "#B45309" },
          { label: "Rejected",  value: counts.Rejected,  accent: "#991B1B" },
        ].map(({ label, value, accent }) => (
          <div key={label} className="bg-white rounded-2xl p-4 flex flex-col gap-1" style={CARD}>
            <span className="text-2xl font-bold" style={{ color: accent }}>{value}</span>
            <span className="text-xs" style={{ color: MUTED }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search by business name…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none"
            style={{ border: "1.5px solid rgba(16,24,40,0.15)", color: NAVY, backgroundColor: "#fff" }} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: MUTED }}>✕</button>
          )}
        </div>
        <select value={sortVal} onChange={(e) => setSortVal(e.target.value)}
          className="py-2 pl-3 pr-8 text-sm rounded-xl outline-none shrink-0"
          style={{ border: "1.5px solid rgba(16,24,40,0.15)", color: NAVY, backgroundColor: "#fff" }}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {search && (
          <p className="text-xs shrink-0" style={{ color: MUTED }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
          </p>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={statusFilter === s
              ? { backgroundColor: BLUE, color: "#fff" }
              : { backgroundColor: "#fff", color: NAVY, border: `1.5px solid ${BORDER}` }}>
            {s}{s !== "All" && counts[s] != null ? ` (${counts[s]})` : ""}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState title="No businesses found"
          message={search ? `No results for "${search}". Try a different name or clear the search.` : "Register a business or change the filter."}
          icon="🏢" />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((biz) => (
            <BusinessRow
              key={biz.id}
              biz={biz}
              pendingAction={pendingAction}
              actionNote={actionNote}
              onActionNote={setActionNote}
              onApprove={handleApprove}
              onOpenReject={openReject}
              onOpenSuspend={openSuspend}
              onSubmitAction={submitAction}
              onCancelAction={cancelAction}
              onDelete={handleDeleteStart}
              deletingId={deletingId}
              onConfirmDelete={handleDeleteConfirm}
              onCancelDelete={handleDeleteCancel}
              busy={busy}
              onAddContent={handleAddContent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
