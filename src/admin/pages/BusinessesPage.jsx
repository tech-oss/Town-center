import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import {
  getBusinesses, registerBusiness, approveBusiness, rejectBusiness,
  suspendBusiness, reinstateBusiness, deleteBusiness,
} from "../../api/admin";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { BUSINESS_TEAM_MEMBERS, TEAM_ROLES } from "../../Data/adminMissingScreensMock";
import {
  BUSINESS_TYPES, FREELANCER_KINDS, FREELANCER_KIND_CATEGORIES, HOTEL_KINDS,
  CUISINE_TYPES, VENUE_TYPES, SHOP_CATEGORIES, SEE_DO_CATEGORIES, SUBSCRIPTION_PLANS, labelFor,
} from "../../Data/businessRegistrationTaxonomy";
import { BLUE, BORDER, CARD, FIELD_STYLE, MUTED, NAVY } from "../theme";

// ─── Theme ────────────────────────────────────────────────────────────────────

const STATUS_FILTERS = ["All", "Pending", "Approved", "Suspended", "Rejected"];

function exportCsv(rows) {
  const headers = ["Name", "Section", "Plan", "Status", "Contact Name", "Email", "Phone", "Address", "Submitted"];
  const esc = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [headers.join(","), ...rows.map((b) =>
    [b.name, b.section, b.plan, b.status, b.contactName, b.email, b.phone, b.address, b.submitted].map(esc).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: `businesses-${new Date().toISOString().slice(0, 10)}.csv` });
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

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
// Uses the same BUSINESS_TYPES taxonomy the real signup form offers, so a
// section shows the exact label the business itself picked rather than
// admin's own older/divergent section list.
function sectionLabel(val) {
  return labelFor(BUSINESS_TYPES, val);
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

// ─── Single-select "pick one" chips — same shape as CheckGroup's Chip ────────
function RadioGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => <Chip key={o.value} label={o.label} checked={value === o.value} onClick={() => onChange(o.value)} />)}
    </div>
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
// Deliberately collects exactly the fields the business's own 5-step signup
// form does (see BusinessDetailModal's comment) — admin registering on
// someone's behalf is the same data entry, just done by admin instead of the
// business, so the two paths must produce identical records.
const EMPTY_FORM = {
  // "Your Details" — the owner's own account
  firstName: "", lastName: "", ownerEmail: "", ownerPhone: "",
  autoPassword: true, password: "",
  // "Business Details"
  name: "", section: "", website: "", businessEmail: "", businessPhone: "", address: "",
  freelancerKind: "", freelancerCategories: [], hotelKind: "hotel",
  cuisineTypes: [], venueTypes: [], shopCategories: [], seeDoCategories: [],
  newToMaidenhead: false,
  lat: "", lng: "",
  logo: null, logoName: "",
  // "Plan"
  planKey: "standard",
};

function RegisterBusinessForm({ onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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
    setForm((f) => ({
      ...f, section: val,
      freelancerKind: "", freelancerCategories: [], hotelKind: "hotel",
      cuisineTypes: [], venueTypes: [], shopCategories: [], seeDoCategories: [],
      newToMaidenhead: false,
    }));
  }

  const isFreelancer = form.section === "freelancer";
  const isHotel = form.section === "hotel";
  const isEat = form.section === "eat-drink";
  const isShop = form.section === "shop";
  const isSeeDo = form.section === "see-do";

  const typeValid =
    (!isFreelancer || (form.freelancerKind && form.freelancerCategories.length > 0)) &&
    (!isEat || (form.cuisineTypes.length > 0 && form.venueTypes.length > 0)) &&
    (!isShop || form.shopCategories.length > 0) &&
    (!isSeeDo || form.seeDoCategories.length > 0);

  const isValid = form.firstName.trim() && form.lastName.trim() && form.ownerEmail.trim()
    && (form.autoPassword || form.password)
    && form.name.trim() && form.section && form.address.trim() && typeValid;

  async function handleSubmit() {
    if (!isValid) return;
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch (e) {
      setError(e.message ?? "Something went wrong.");
    }
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-6"
      style={{ border: `1.5px solid ${BORDER}`, boxShadow: "0 4px 24px rgba(16,24,40,0.08)" }}>

      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-bold" style={{ color: NAVY }}>Register New Business</h3>
        <button onClick={onCancel} className="opacity-40 hover:opacity-70 text-xl leading-none" style={{ color: NAVY }}>✕</button>
      </div>

      {/* ── Your Details (owner account) ── */}
      <Section title="Your Details" note="The business owner's own login">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="First Name" required>
            <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>
          <FormField label="Last Name" required>
            <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>
          <FormField label="Email Address" required hint="This is the owner's login.">
            <input type="email" value={form.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>
          <FormField label="Phone Number">
            <input value={form.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>
        </div>
        <div className="rounded-xl p-3 mt-3 flex flex-col gap-2" style={{ backgroundColor: "#f8fafc", border: "1px solid rgba(16,24,40,0.1)" }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.autoPassword} onChange={(e) => set("autoPassword", e.target.checked)} className="w-4 h-4" />
            <span className="text-sm font-medium" style={{ color: NAVY }}>Auto-generate password</span>
          </label>
          {form.autoPassword ? (
            <p className="text-xs" style={{ color: MUTED }}>A temporary password will be sent to their email.</p>
          ) : (
            <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Set a password"
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          )}
        </div>
      </Section>

      {/* ── Business Details ── */}
      <Section title="Business Details">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Business Name" required span2>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Coppa Club" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>

          <FormField label="Business Type" required>
            <select value={form.section} onChange={(e) => handleSectionChange(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE}>
              <option value="">— Select a type —</option>
              {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </FormField>

          <FormField label="Website">
            <input value={form.website} onChange={(e) => set("website", e.target.value)}
              placeholder="https://…" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>
          <FormField label="Business Email" hint="Shown publicly on the business profile.">
            <input value={form.businessEmail} onChange={(e) => set("businessEmail", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>
          <FormField label="Business Phone" hint="Shown publicly on the business profile.">
            <input value={form.businessPhone} onChange={(e) => set("businessPhone", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>
          <FormField label="Business Address" required span2>
            <input value={form.address} onChange={(e) => set("address", e.target.value)}
              placeholder="High Street, Maidenhead SL6 1JF" className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
          </FormField>

          {isFreelancer && (
            <>
              <FormField label="Which best describes them?" required span2>
                <RadioGroup options={FREELANCER_KINDS} value={form.freelancerKind}
                  onChange={(v) => setForm((f) => ({ ...f, freelancerKind: v, freelancerCategories: [] }))} />
              </FormField>
              {form.freelancerKind && (
                <FormField label="Category" required span2 hint="Select up to 2">
                  <CheckGroup options={FREELANCER_KIND_CATEGORIES[form.freelancerKind]} selected={form.freelancerCategories} onChange={(v) => set("freelancerCategories", v.slice(0, 2))} />
                </FormField>
              )}
            </>
          )}

          {isHotel && (
            <FormField label="Hotel or accommodation?" required span2>
              <RadioGroup options={HOTEL_KINDS} value={form.hotelKind} onChange={(v) => set("hotelKind", v)} />
            </FormField>
          )}

          {isEat && (
            <>
              <FormField label="Venue Type" required span2 hint="Select up to 2">
                <CheckGroup options={VENUE_TYPES} selected={form.venueTypes} onChange={(v) => set("venueTypes", v.slice(0, 2))} />
              </FormField>
              <FormField label="Cuisine Type" required span2 hint="Select up to 2">
                <CheckGroup options={CUISINE_TYPES} selected={form.cuisineTypes} onChange={(v) => set("cuisineTypes", v.slice(0, 2))} />
              </FormField>
              <label className="flex items-center gap-3 cursor-pointer w-fit sm:col-span-2">
                <div onClick={() => set("newToMaidenhead", !form.newToMaidenhead)}
                  className="w-10 h-5 rounded-full transition-colors flex items-center px-0.5"
                  style={{ backgroundColor: form.newToMaidenhead ? BLUE : "#D1D5DB" }}>
                  <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: form.newToMaidenhead ? "translateX(20px)" : "translateX(0)" }} />
                </div>
                <span className="text-sm font-medium" style={{ color: NAVY }}>New to Maidenhead</span>
              </label>
            </>
          )}

          {isShop && (
            <FormField label="Shop Category" required span2 hint="Select up to 2">
              <CheckGroup options={SHOP_CATEGORIES} selected={form.shopCategories} onChange={(v) => set("shopCategories", v.slice(0, 2))} grouped />
            </FormField>
          )}

          {isSeeDo && (
            <FormField label="Category" required span2 hint="Select up to 2">
              <CheckGroup options={SEE_DO_CATEGORIES} selected={form.seeDoCategories} onChange={(v) => set("seeDoCategories", v.slice(0, 2))} />
            </FormField>
          )}
        </div>
      </Section>

      {/* ── Location ── */}
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

      {/* ── Logo ── */}
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

      {/* ── Plan ── */}
      <Section title="Plan">
        <div className="grid sm:grid-cols-3 gap-3">
          {SUBSCRIPTION_PLANS.map((p) => (
            <button key={p.key} type="button" onClick={() => set("planKey", p.key)}
              className="text-left rounded-2xl p-4 flex flex-col gap-1 transition-all"
              style={form.planKey === p.key ? { border: `2px solid ${BLUE}`, backgroundColor: "rgba(37,99,235,0.06)" } : { border: `1.5px solid ${BORDER}`, backgroundColor: "#fff" }}>
              <span className="text-sm font-bold" style={{ color: NAVY }}>{p.name}</span>
              <span className="text-base font-bold" style={{ color: NAVY }}>{p.price === 0 ? "Free" : `£${p.price}/mo`}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] mt-2" style={{ color: "#9CA3AF" }}>Registering on the business's behalf counts as accepting the Terms of Use and Privacy Policy for them.</p>
      </Section>

      {error && <p className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</p>}

      {/* ── Footer ── */}
      <div className="flex gap-3 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button
          onClick={handleSubmit}
          disabled={!isValid || saving}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-90"
          style={{ backgroundColor: BLUE }}
        >
          {saving ? "Registering…" : "Register Business"}
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
// ─── Logo upload modal ─────────────────────────────────────────────────────────
// TODO: upload to Supabase storage
function LogoUploadModal({ biz, onSave, onCancel }) {
  const [preview, setPreview] = useState(biz.logo ?? null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(16,24,40,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div className="flex items-center justify-between">
          <p className="text-base font-bold" style={{ color: NAVY }}>Upload Logo — {biz.name}</p>
          <button onClick={onCancel} className="opacity-40 hover:opacity-70 text-xl leading-none" style={{ color: NAVY }}>✕</button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className="relative overflow-hidden rounded-2xl aspect-video flex items-center justify-center"
          style={{ border: dragOver ? `2px dashed ${BLUE}` : `1.5px dashed ${BORDER}`, backgroundColor: "#f8fafc" }}
        >
          {preview ? (
            <img src={preview} alt="Logo preview" className="w-full h-full object-contain p-3" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl" style={{ color: "#9CA3AF" }}>+</span>
              <span className="text-xs" style={{ color: "#9CA3AF" }}>Drop an image here</span>
            </div>
          )}
        </div>

        <label className="w-fit px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
          {preview ? "Replace Image" : "Choose File"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </label>

        <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "rgba(16,24,40,0.1)" }}>
          <button onClick={() => onSave(preview)} disabled={!preview}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ backgroundColor: BLUE }}>
            Save
          </button>
          <button onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Business detail modal — everything submitted at registration ────────────
// Renders label/value rows for whatever this business type actually collected
// (a freelancer's Skills, a hotel's Amenities, a shop's category picks, etc.)
// rather than a fixed layout — every field is optional and simply omitted
// when empty, so the modal never shows a wall of blank rows.
// A handful of these fields (working_with_me, stats, etc.) come through as
// small objects/records rather than plain strings — render whatever text they
// actually hold instead of the useless "[object Object]" a bare String() call
// on an object produces.
function displayValue(v) {
  if (v == null) return "";
  if (typeof v !== "object") return String(v);
  if (Array.isArray(v)) return v.map(displayValue).filter(Boolean).join(", ");
  if (Object.keys(v).length === 0) return ""; // {} means "not filled in", not a real value
  return v.text ?? v.body ?? v.label ?? v.name ?? v.value ?? JSON.stringify(v);
}

function DetailRow({ label, value }) {
  const text = displayValue(value);
  if (!text || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      <span className="text-sm" style={{ color: NAVY, wordBreak: "break-word" }}>{text}</span>
    </div>
  );
}

function DetailSection({ title, children }) {
  const hasContent = Array.isArray(children) ? children.some(Boolean) : !!children;
  if (!hasContent) return null;
  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>{title}</p>
      <div>{children}</div>
    </div>
  );
}

// Mirrors exactly the 4 data-bearing steps of the business's own signup form
// (business-dashboard's SignUpPage.jsx: Your Details / Business Details /
// Plan / Terms — Review adds no new fields) so what admin sees here is
// provably the same information the business submitted, not a different set.
function typeSpecificRows(biz) {
  switch (biz.section) {
    case "freelancer":
      return (
        <>
          <DetailRow label="Which best describes you" value={labelFor(FREELANCER_KINDS, biz.freelancerKind)} />
          {biz.freelancerKind && (
            <DetailRow label="Category" value={(biz.freelancerCategories ?? []).map((v) => labelFor(FREELANCER_KIND_CATEGORIES[biz.freelancerKind] ?? [], v))} />
          )}
        </>
      );
    case "hotel":
      return <DetailRow label="Hotel or Accommodation" value={labelFor(HOTEL_KINDS, biz.hotelKind)} />;
    case "eat-drink":
      return (
        <>
          <DetailRow label="Venue Type" value={(biz.venueTypes ?? []).map((v) => labelFor(VENUE_TYPES, v))} />
          <DetailRow label="Cuisine Type" value={(biz.cuisineTypes ?? []).map((v) => labelFor(CUISINE_TYPES, v))} />
        </>
      );
    case "shop":
      return <DetailRow label="Shop Category" value={(biz.subcategories ?? []).map((v) => labelFor(SHOP_CATEGORIES, v))} />;
    case "see-do":
      return <DetailRow label="Category" value={(biz.subcategories ?? []).map((v) => labelFor(SEE_DO_CATEGORIES, v))} />;
    default:
      return null;
  }
}

function BusinessDetailModal({ biz, onClose }) {
  const navigate = useNavigate();
  const plan = SUBSCRIPTION_PLANS.find((p) => p.name.toLowerCase() === (biz.plan ?? "").toLowerCase());
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(16,24,40,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto flex flex-col gap-1" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-lg font-bold" style={{ color: NAVY }}>{biz.name}</p>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>Everything submitted at registration — same as the business's own 5-step signup form.</p>
          </div>
          <button onClick={onClose} className="opacity-40 hover:opacity-70 text-xl leading-none" style={{ color: NAVY }}>✕</button>
        </div>

        <DetailSection title="Your Details (Owner)">
          <DetailRow label="Name" value={[biz.firstName, biz.lastName].filter(Boolean).join(" ")} />
          <DetailRow label="Login Email" value={biz.userEmail} />
          <DetailRow label="Phone" value={biz.ownerPhone} />
          <DetailRow label="Account Status" value={biz.ownerStatus ? biz.ownerStatus[0].toUpperCase() + biz.ownerStatus.slice(1) : "No account yet"} />
        </DetailSection>

        <DetailSection title="Business Details">
          <DetailRow label="Business Name" value={biz.name} />
          <DetailRow label="Business Type" value={labelFor(BUSINESS_TYPES, biz.section)} />
          {typeSpecificRows(biz)}
          <DetailRow label="Website" value={biz.website} />
          <DetailRow label="Business Email" value={biz.businessEmail} />
          <DetailRow label="Business Phone" value={biz.businessPhone} />
          <DetailRow label="Business Address" value={biz.address} />
          <DetailRow label="New to Maidenhead" value={biz.newToMaidenhead ? "Yes" : null} />
        </DetailSection>

        <DetailSection title="Location (for Map)">
          <DetailRow label="Coordinates" value={biz.lat && biz.lng ? `${biz.lat}, ${biz.lng}` : null} />
        </DetailSection>

        <DetailSection title="Current Plan">
          <DetailRow label="Current Plan" value={plan ? `${plan.name} — ${plan.price === 0 ? "Free" : `£${plan.price}/mo`}` : biz.plan} />
        </DetailSection>

        <DetailSection title="Terms">
          <DetailRow label="Terms & Privacy" value={biz.termsAcceptedAt ? `Agreed ${new Date(biz.termsAcceptedAt).toLocaleDateString("en-GB")}` : "Not recorded"} />
        </DetailSection>

        <div className="flex gap-3 justify-between items-center pt-2 border-t" style={{ borderColor: "rgba(16,24,40,0.1)" }}>
          <button onClick={() => navigate("/admin/users")}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: BLUE }}>
            Approve the User →
          </button>
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete business modal (type-to-confirm) ──────────────────────────────────
function DeleteBusinessModal({ biz, onConfirm, onCancel, deleting }) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === biz.name;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(16,24,40,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <p className="text-base font-bold" style={{ color: NAVY }}>Delete business?</p>
        <p className="text-sm" style={{ color: MUTED }}>
          This will permanently remove <strong>{biz.name}</strong> and all associated content. This cannot be undone.
        </p>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: MUTED }}>Type <strong>{biz.name}</strong> to confirm</span>
          <input value={typed} onChange={(e) => setTyped(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none" style={FIELD_STYLE} />
        </label>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
          <button onClick={onConfirm} disabled={!matches || deleting}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ backgroundColor: "#DC2626" }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Every section's category + sub-category picks, labelled against the same
// taxonomy the real signup form uses — one consistent chip row regardless of
// which business type this is, instead of shop/see-do getting chips and
// every other type getting a plain sentence.
function categoryChips(biz) {
  switch (biz.section) {
    case "freelancer":
      return [
        biz.freelancerKind && labelFor(FREELANCER_KINDS, biz.freelancerKind),
        ...(biz.freelancerCategories ?? []).map((v) => labelFor(FREELANCER_KIND_CATEGORIES[biz.freelancerKind] ?? [], v)),
      ].filter(Boolean);
    case "hotel":
      return [biz.hotelKind && labelFor(HOTEL_KINDS, biz.hotelKind)].filter(Boolean);
    case "eat-drink":
      return [
        ...(biz.venueTypes ?? []).map((v) => labelFor(VENUE_TYPES, v)),
        ...(biz.cuisineTypes ?? []).map((v) => labelFor(CUISINE_TYPES, v)),
      ];
    case "shop":
      return (biz.subcategories ?? []).map((v) => labelFor(SHOP_CATEGORIES, v));
    case "see-do":
      return (biz.subcategories ?? []).map((v) => labelFor(SEE_DO_CATEGORIES, v));
    default:
      return [];
  }
}

// A small labelled fact, used for the business-facing contact fields —
// "Business Email: hello@…" rather than an emoji standing in for the label.
function InfoField({ label, value, mono }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "#9CA3AF" }}>{label}</span>
      <span className="text-xs font-medium truncate block" style={{ color: NAVY, fontFamily: mono ? "monospace" : undefined }}>{value}</span>
    </div>
  );
}

function BusinessRow({ biz, pendingAction, actionNote, onActionNote, onApprove, onOpenReject, onOpenSuspend, onSubmitAction, onCancelAction, onDelete, onUploadLogo, busy, onAddContent }) {
  const navigate = useNavigate();
  const secLabel = sectionLabel(biz.section);
  const chips = categoryChips(biz);

  const isActive   = pendingAction?.id === biz.id;
  const actionType = isActive ? pendingAction.type : null;
  const isBusy     = busy === biz.id;
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden" style={CARD}>
      <div className="bg-white p-5 flex items-start gap-5 flex-wrap">
        {/* Logo / initial — click to replace, no separate label row taking up space */}
        <button onClick={() => setUploadingLogo(true)} className="relative shrink-0 group" title={biz.logo ? "Replace logo" : "Upload logo"}>
          {biz.logo ? (
            <img src={biz.logo} alt={biz.name} className="w-14 h-14 rounded-xl object-cover" style={{ border: `1px solid ${BORDER}` }} />
          ) : (
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: "rgba(37,99,235,0.1)", color: BLUE, border: `1.5px dashed rgba(37,99,235,0.3)` }}>
              {biz.name[0]}
            </div>
          )}
          <span className="absolute inset-0 rounded-xl flex items-center justify-center text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: "rgba(16,24,40,0.55)" }}>
            {biz.logo ? "Replace" : "Upload"}
          </span>
        </button>
        {uploadingLogo && (
          <LogoUploadModal biz={biz}
            onCancel={() => setUploadingLogo(false)}
            onSave={(dataUrl) => { onUploadLogo(biz.id, dataUrl); setUploadingLogo(false); }} />
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-2.5">
          {/* Name + status/plan badges */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold" style={{ color: NAVY }}>{biz.name}</span>
              <StatusTag status={biz.status} />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE }}>{biz.plan}</span>
              {!biz.hasContent && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(217,119,6,0.15)", color: "#92400E" }}>Content Pending</span>
              )}
              {biz.newToMaidenhead && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(251,191,36,0.15)", color: "#92400E" }}>New to Maidenhead</span>
              )}
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>Submitted {biz.submitted}</p>
          </div>

          {/* Category + sub-category — one consistent chip row for every
              business type, section first then its specific picks. */}
          {(secLabel || chips.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {secLabel && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: NAVY, color: "#fff" }}>{secLabel}</span>
              )}
              {chips.map((l) => (
                <span key={l} className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: "rgba(37,99,235,0.08)", color: "#1D4ED8", border: "1px solid rgba(37,99,235,0.15)" }}>{l}</span>
              ))}
            </div>
          )}

          {/* Suspend/reject reason */}
          {biz.status === "Suspended" && biz.suspendNote && (
            <p className="text-xs italic" style={{ color: "#92400E" }}>Suspend reason: {biz.suspendNote}</p>
          )}
          {biz.status === "Rejected" && biz.rejectionNote && (
            <p className="text-xs italic" style={{ color: "#991B1B" }}>Rejection reason: {biz.rejectionNote}</p>
          )}

          {/* Business-facing contact fields — clearly labelled, not left to
              an emoji to imply what each value is. Hidden entirely rather
              than showing an empty divider when nothing's been filled in. */}
          {(biz.website || biz.businessEmail || biz.businessPhone || (biz.status === "Approved" && biz.userEmail)) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 pt-2.5" style={{ borderTop: `1px solid ${BORDER}` }}>
              <InfoField label="Website" value={biz.website} />
              <InfoField label="Business Email" value={biz.businessEmail} />
              <InfoField label="Business Phone" value={biz.businessPhone} />
              {biz.status === "Approved" && (
                <InfoField label="Approved User" value={biz.userEmail} />
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          <BizBtn color={NAVY} disabled={isBusy} onClick={() => setShowDetail(true)}>View Details</BizBtn>
          {showDetail && <BusinessDetailModal biz={biz} onClose={() => setShowDetail(false)} />}
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
          <BizBtn color={NAVY} disabled={isBusy} onClick={() => navigate(`/admin/business-analytics/${biz.id}`)}>
            View Analytics
          </BizBtn>

          {/* Delete */}
          <BizBtn color="#991B1B" disabled={isBusy} onClick={() => onDelete(biz)}>Delete</BizBtn>
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
  const [deletingBiz, setDeletingBiz] = useState(null);
  const [busy, setBusy]             = useState(null);

  const list = local ?? fetched ?? [];

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 4000); }
  function patch(id, changes) { setLocal((prev) => (prev ?? fetched ?? []).map((b) => b.id === id ? { ...b, ...changes } : b)); }

  function handleRegister(form) {
    return registerBusiness(form).then((saved) => {
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

  function handleDeleteStart(biz) { setDeletingBiz(biz); }
  function handleDeleteCancel()   { setDeletingBiz(null); }
  // TODO: delete business record from Supabase and log to audit trail
  function handleDeleteConfirm() {
    const biz = deletingBiz;
    setBusy(biz.id);
    deleteBusiness(biz.id).then(() => {
      setLocal((prev) => (prev ?? fetched ?? []).filter((b) => b.id !== biz.id));
      setBusy(null);
      setDeletingBiz(null);
      notify(`"${biz.name}" permanently deleted and recorded in Admin Logs.`);
    });
  }
  function handleUploadLogo(id, dataUrl) {
    // TODO: upload to Supabase storage
    patch(id, { logo: dataUrl });
    notify("Logo updated.");
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
      {deletingBiz && (
        <DeleteBusinessModal biz={deletingBiz} deleting={busy === deletingBiz.id}
          onCancel={handleDeleteCancel} onConfirm={handleDeleteConfirm} />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Business Registrations</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Register businesses across Eat & Drink, See & Do, Shop and Live sections.</p>
        </div>
        {!showForm && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => exportCsv(filtered)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>
              Export CSV
            </button>
            <button onClick={() => setShowForm(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: BLUE }}>
              + Register Business
            </button>
          </div>
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
              onUploadLogo={handleUploadLogo}
              busy={busy}
              onAddContent={handleAddContent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
