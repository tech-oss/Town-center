// Small "i" info badge that reveals an explanatory tooltip on hover / focus.
// Used beside graph titles across the admin to describe what each chart shows.
export default function InfoTip({ text, width = 224 }) {
  return (
    <span className="relative inline-flex group align-middle">
      <span
        tabIndex={0}
        role="img"
        aria-label={text}
        className="text-[10px] w-4 h-4 flex items-center justify-center rounded-full cursor-help select-none outline-none"
        style={{ backgroundColor: "rgba(16,24,40,0.07)", color: "#6B7280" }}
      >
        i
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute z-40 left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 rounded-lg text-[11px] leading-snug font-normal normal-case opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-150"
        style={{
          width,
          backgroundColor: "#1E293B",
          color: "#F4F6F9",
          fontFamily: "'Inter', system-ui, sans-serif",
          letterSpacing: "0",
          boxShadow: "0 10px 28px rgba(16,24,40,0.38)",
        }}
      >
        {text}
        <span
          className="absolute left-1/2 -translate-x-1/2 top-full"
          style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1E293B" }}
        />
      </span>
    </span>
  );
}
