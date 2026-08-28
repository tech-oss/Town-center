export default function EmptyState({ title = "Nothing here yet", message = "No items to display.", icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: "rgba(27,67,50,0.08)" }}>
        {icon ?? "📭"}
      </div>
      <p className="font-semibold text-base" style={{ color: "#1B4332" }}>{title}</p>
      <p className="text-sm max-w-xs" style={{ color: "#6B7280" }}>{message}</p>
    </div>
  );
}
