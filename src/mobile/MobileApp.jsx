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
import AboutScreen from "./pages/AboutScreen";
import GuidesScreen from "./pages/GuidesScreen";
import GuideDetailScreen from "./pages/GuideDetailScreen";
import OffersScreen from "./pages/OffersScreen";
import LiveScreen from "./pages/LiveScreen";
import WorkScreen from "./pages/WorkScreen";
import StoryDetailScreen from "./pages/StoryDetailScreen";
import EventDetailScreen from "./pages/EventDetailScreen";
import NewsDetailScreen from "./pages/NewsDetailScreen";
import StayDetailScreen from "./pages/StayDetailScreen";
import FutureScreen from "./pages/FutureScreen";
import SearchScreen from "./pages/SearchScreen";
import TransportScreen from "./pages/TransportScreen";
import ParkingScreen from "./pages/ParkingScreen";

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
      <Route path="services" element={<SectionScreen sectionKey="services" />} />
      <Route path="place/:id" element={<PlaceDetailScreen />} />
      <Route path="search" element={<SearchScreen />} />
      <Route path="transport" element={<TransportScreen />} />
      <Route path="parking" element={<ParkingScreen />} />
      <Route path="about" element={<AboutScreen />} />
      <Route path="guides" element={<GuidesScreen />} />
      <Route path="guides/:slug" element={<GuideDetailScreen />} />
      <Route path="offers" element={<OffersScreen />} />
      <Route path="live" element={<LiveScreen />} />
      <Route path="work" element={<WorkScreen />} />
      <Route path="story/:slug" element={<StoryDetailScreen />} />
      <Route path="event/:slug" element={<EventDetailScreen />} />
      <Route path="news/:slug" element={<NewsDetailScreen />} />
      <Route path="stay/:kind/:slug" element={<StayDetailScreen />} />
      <Route path="explore/the-future" element={<FutureScreen />} />
      <Route path="*" element={<Navigate to="/mobile" replace />} />
    </Routes>
  );
}
