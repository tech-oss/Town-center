import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MobileShell from "./components/MobileShell";
import SplashScreen from "./pages/SplashScreen";
import HomeScreen from "./pages/HomeScreen";
import WhatsOnScreen from "./pages/WhatsOnScreen";
import ExploreScreen from "./pages/ExploreScreen";
import MapScreen from "./pages/MapScreen";
import MoreScreen from "./pages/MoreScreen";

export default function MobileApp() {
  // Service worker is scoped to /mobile/ only — the rest of the site (and the
  // main production app) is never touched by it.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/mobile/" }).catch(() => {});
    }
  }, []);

  return (
    <Routes>
      <Route index element={<SplashScreen />} />
      <Route path="home" element={<MobileShell><HomeScreen /></MobileShell>} />
      <Route path="whats-on" element={<MobileShell><WhatsOnScreen /></MobileShell>} />
      <Route path="explore" element={<MobileShell><ExploreScreen /></MobileShell>} />
      <Route path="map" element={<MobileShell><MapScreen /></MobileShell>} />
      <Route path="more" element={<MobileShell><MoreScreen /></MobileShell>} />
      <Route path="*" element={<Navigate to="/mobile" replace />} />
    </Routes>
  );
}
