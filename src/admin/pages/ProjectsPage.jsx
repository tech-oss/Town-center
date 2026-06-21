import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import { getProjects, saveProject, deleteProject } from "../../api/admin";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

function ProjectEditor({ project, onSave, onCancel }) {
  const [form, setForm] = useState(project ?? { title: "", image: "", description: "", published: false });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.12)" }}>
      <h3 className="font-bold text-base" style={{ color: "#1B4332" }}>{project?.id ? "Edit Project" : "New Project"}</h3>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Title</span>
        <input value={form.title} onChange={(e) => set("title", e.target.value)} className="border rounded-xl px-3 py-2 text-sm outline-none" style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Image URL</span>
        <input value={form.image} onChange={(e) => set("image", e.target.value)} className="border rounded-xl px-3 py-2 text-sm outline-none" style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }} placeholder="/images/..." />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>Description</span>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="border rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }} />
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} className="w-4 h-4 rounded" />
        <span className="text-sm font-medium" style={{ color: "#1B4332" }}>Published on homepage</span>
      </label>
      <div className="flex gap-3">
        <button onClick={() => onSave(form)} className="px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#2D6A4F" }}>Save Project</button>
        <button onClick={onCancel} className="px-5 py-2 rounded-xl text-sm font-semibold" style={{ color: "#6B7280", border: "1.5px solid #D1D5DB" }}>Cancel</button>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { data: projects, loading } = useFetch(getProjects, []);
  const [editing, setEditing] = useState(null);
  const [localProjects, setLocalProjects] = useState(null);

  const list = localProjects ?? projects ?? [];

  function handleSave(form) {
    saveProject(form).then((saved) => {
      setLocalProjects((prev) => {
        const base = prev ?? projects ?? [];
        const idx = base.findIndex((p) => p.id === saved.id);
        return idx >= 0 ? base.map((p) => p.id === saved.id ? saved : p) : [...base, saved];
      });
      setEditing(null);
    });
  }

  function handleDelete(id) {
    deleteProject(id).then(() => {
      setLocalProjects((prev) => (prev ?? projects ?? []).filter((p) => p.id !== id));
    });
  }

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Explore (Projects)</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Manage town centre projects featured in the Explore section.</p>
        </div>
        <button onClick={() => setEditing({})} className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>+ New Project</button>
      </div>

      {editing !== null && <ProjectEditor project={editing.id ? editing : null} onSave={handleSave} onCancel={() => setEditing(null)} />}

      {list.length === 0 && !editing && <EmptyState title="No projects yet" message="Create your first Explore project." />}
      <div className="flex flex-col gap-4">
        {list.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl overflow-hidden flex gap-4" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
            {p.image && <img src={p.image} alt={p.title} className="w-32 h-24 object-cover shrink-0 rounded-l-2xl" />}
            <div className="flex-1 min-w-0 p-4 flex flex-col gap-1 justify-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ color: "#1B4332" }}>{p.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={p.published ? { backgroundColor: "rgba(45,106,79,0.12)", color: "#1B4332" } : { backgroundColor: "rgba(107,114,128,0.1)", color: "#6B7280" }}>
                  {p.published ? "Published" : "Draft"}
                </span>
              </div>
              <p className="text-xs line-clamp-2" style={{ color: "#6B7280" }}>{p.description}</p>
              <p className="text-[10px]" style={{ color: "#9CA3AF" }}>Updated {p.updatedAt}</p>
            </div>
            <div className="flex flex-col items-end justify-center gap-2 px-4 shrink-0">
              <button onClick={() => setEditing(p)} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70" style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332" }}>Edit</button>
              <button onClick={() => handleDelete(p.id)} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
