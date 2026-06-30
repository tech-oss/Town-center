import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import HomeScreen from "./pages/HomeScreen";
import WhatsOnScreen from "./pages/WhatsOnScreen";
import ExploreScreen from "./pages/ExploreScreen";
import MapScreen from "./pages/MapScreen";
import MoreScreen from "./pages/MoreScreen";
import SectionScreen from "./pages/SectionScreen";
import PlaceDetailScreen from "./pages/PlaceDetailScreen";
import InfoScreen from "./pages/InfoScreen";
import PlanScreen from "./pages/PlanScreen";
import AboutScreen from "./pages/AboutScreen";

export default function MobileApp() {
  // Service worker scoped to /mobile/ only — never touches the rest of the site.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/mobile/" }).catch(() => {});
    }
  }, []);

  return (
    <Routes>
      <Route index element={<SplashScreen />} />
      <Route path="home" element={<HomeScreen />} />
      <Route path="whats-on" element={<WhatsOnScreen />} />
      <Route path="explore" element={<ExploreScreen />} />
      <Route path="map" element={<MapScreen />} />
      <Route path="more" element={<MoreScreen />} />
      <Route path="see-do" element={<SectionScreen sectionKey="see-do" />} />
      <Route path="eat-drink" element={<SectionScreen sectionKey="eat-drink" />} />
      <Route path="shop" element={<SectionScreen sectionKey="shop" />} />
      <Route path="place/:id" element={<PlaceDetailScreen />} />
      <Route path="info/:topic" element={<InfoScreen />} />
      <Route path="plan" element={<PlanScreen />} />
      <Route path="about" element={<AboutScreen />} />
      <Route path="*" element={<Navigate to="/mobile" replace />} />
    </Routes>
  );
}
