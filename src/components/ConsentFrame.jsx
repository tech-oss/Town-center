// An embedded map from another provider (OpenStreetMap), which may set its
// own cookies. It loads when the visitor has allowed "features from other
// providers", or when they tap Show map for this one map.
import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { openCookieSettings, useCookieConsent } from "../lib/cookieConsent";

export default function ConsentFrame({ title, src, className = "w-full h-full border-0", provider = "OpenStreetMap" }) {
  const consent = useCookieConsent();
  const [once, setOnce] = useState(false);
  if (consent?.functional || once) {
    return <iframe title={title} src={src} loading="lazy" className={className} />;
  }
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 p-5 text-center" style={{ backgroundColor: "#EEF3F2" }}>
      <p className="text-sm font-semibold" style={{ color: "#1C2E38" }}>Interactive map</p>
      <p className="text-xs max-w-[280px]" style={{ color: "rgba(28,46,56,0.7)" }}>
        This map is provided by {provider}, which may set its own cookies.
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        <button type="button" onClick={() => setOnce(true)}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#1C2E38" }}>
          Show map
        </button>
        {/* The App Store app has no cookie settings; Show map is the choice. */}
        {!Capacitor.isNativePlatform() && (
          <button type="button" onClick={openCookieSettings}
            className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: "rgba(28,46,56,0.08)", color: "#1C2E38" }}>
            Cookie settings
          </button>
        )}
      </div>
    </div>
  );
}
