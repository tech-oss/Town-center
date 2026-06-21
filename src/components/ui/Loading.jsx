// Consistent loading state for async (api/) content.
export default function Loading({ label = "Loading…", minHeight = "40vh" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3" style={{ minHeight }}>
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--forest)", borderTopColor: "transparent" }}
      />
      <p className="text-sm" style={{ color: "var(--ink)", opacity: 0.6 }}>{label}</p>
    </div>
  );
}
