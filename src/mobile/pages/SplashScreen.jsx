import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/mobile/home", { replace: true }), 2200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="mobile-root">
      <div
        className="mobile-frame items-center justify-center"
        onClick={() => navigate("/mobile/home", { replace: true })}
        style={{
          background:
            "radial-gradient(120% 80% at 50% 30%, #25404e 0%, #1C2E38 55%, #14222b 100%)",
        }}
      >
        {/* subtle decorative river arcs */}
        <svg
          className="absolute inset-x-0 bottom-0 w-full opacity-[0.07]"
          viewBox="0 0 390 200"
          fill="none"
          preserveAspectRatio="none"
          style={{ height: 200 }}
        >
          <path d="M0 120 Q97 80 195 120 T390 120" stroke="var(--sage)" strokeWidth="2" />
          <path d="M0 150 Q97 110 195 150 T390 150" stroke="var(--sage)" strokeWidth="2" />
          <path d="M0 180 Q97 140 195 180 T390 180" stroke="var(--sage)" strokeWidth="2" />
        </svg>

        <div className="flex flex-col items-center gap-7 px-10 text-center relative">
          <div className="splash-mark">
            <img src="/logo-mark.svg" alt="" className="w-24 h-auto" />
          </div>

          <div className="flex flex-col items-center gap-3 splash-word">
            <h1
              className="text-[1.7rem] font-semibold text-white"
              style={{ fontFamily: "var(--font-body)", letterSpacing: "0.32em", paddingLeft: "0.32em" }}
            >
              MAIDENHEAD
            </h1>
            <div className="flex items-center gap-3">
              <span style={{ height: 1, width: 24, background: "rgba(82,199,182,0.5)" }} />
              <p className="text-[10px] font-semibold tracking-[0.28em] uppercase" style={{ color: "var(--sage)" }}>
                Riverside · Connected · Thriving
              </p>
              <span style={{ height: 1, width: 24, background: "rgba(82,199,182,0.5)" }} />
            </div>
          </div>
        </div>

        {/* slim progress bar */}
        <div className="absolute left-0 right-0 flex justify-center" style={{ bottom: 56 }}>
          <div style={{ width: 140, height: 3, borderRadius: 3, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 3,
                background: "var(--sage)",
                animation: "progressGrow 2.1s cubic-bezier(0.4,0,0.2,1) forwards",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        .splash-mark { animation: splashMarkIn 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        .splash-word { animation: mobileFadeUp 0.7s ease 0.35s both; }
        @keyframes splashMarkIn {
          from { opacity: 0; transform: scale(0.82) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
