import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/mobile/home", { replace: true }), 1800);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div
      className="mobile-root min-h-screen flex items-center justify-center sm:py-8"
      style={{ backgroundColor: "#0c1418" }}
    >
      <div
        className="relative w-full sm:max-w-[430px] sm:rounded-[2.5rem] sm:border-8 overflow-hidden flex flex-col items-center justify-center"
        style={{ height: "100dvh", maxHeight: "100dvh", backgroundColor: "var(--forest)", borderColor: "#000" }}
        onClick={() => navigate("/mobile/home", { replace: true })}
      >
        <div className="flex flex-col items-center gap-5 animate-fade-in px-10 text-center">
          <img src="/logo-mark.svg" alt="" className="w-28 h-auto" />
          <div className="flex flex-col items-center gap-2">
            <h1
              className="text-3xl font-bold tracking-[0.18em]"
              style={{ color: "#fff", fontFamily: "var(--font-body)" }}
            >
              MAIDENHEAD
            </h1>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--sage)" }}>
              Riverside. Connected. Thriving.
            </p>
          </div>
        </div>

        <div className="absolute bottom-12 flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--sage)", borderTopColor: "transparent" }} />
        </div>
      </div>
    </div>
  );
}
