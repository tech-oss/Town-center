// Consistent error state for async (api/) content.
export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  onRetry,
  minHeight = "40vh",
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center px-6" style={{ minHeight }}>
      <p className="text-lg font-bold" style={{ color: "var(--forest)" }}>{title}</p>
      <p className="text-sm max-w-sm" style={{ color: "var(--ink)", opacity: 0.6 }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: "var(--forest)" }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
