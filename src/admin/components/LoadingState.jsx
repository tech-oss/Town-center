export default function LoadingState({ message = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-8 h-8 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: "#2D6A4F", borderTopColor: "transparent" }} />
      <p className="text-sm font-medium" style={{ color: "#2D6A4F" }}>{message}</p>
    </div>
  );
}
