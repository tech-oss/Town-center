import Hero from "./Hero";
import QuickLinks from "./QuickLinks";
import BlogCards from "./BlogCards";
import { lazy, Suspense } from "react";
import WhenVisible from "./WhenVisible";
import FeatureBlocks from "./FeatureBlocks";
import EventsGrid from "./EventsGrid";
import GuidesGrid from "./GuidesGrid";
import PlanVisit from "./PlanVisit";
import AppCta from "./AppCta";
import Newsletter from "./Newsletter";
import InstagramFeed from "./InstagramFeed";

// The traders map (and its ~900 KB map engine) loads as it nears the screen.
// It also asks for the visitor's location, which now happens when they reach
// the map rather than the moment the homepage opens.
const TradersMap = lazy(() => import("./TradersMap"));
const MAP_SPACE = <div className="h-[640px] sm:h-[720px] lg:h-[820px]" style={{ backgroundColor: "#EEF1EF" }} />;

export default function HomePage() {
  return (
    <>
      <Hero />
      <QuickLinks />
      <FeatureBlocks />
      <BlogCards />
      <WhenVisible placeholder={MAP_SPACE}>
        <Suspense fallback={MAP_SPACE}><TradersMap /></Suspense>
      </WhenVisible>
      <EventsGrid />
      <GuidesGrid />
      <PlanVisit />
      <AppCta />
      <Newsletter />
      <InstagramFeed />
    </>
  );
}
