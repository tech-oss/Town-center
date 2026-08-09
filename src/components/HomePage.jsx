import Hero from "./Hero";
import QuickLinks from "./QuickLinks";
import BlogCards from "./BlogCards";
import TradersMap from "./TradersMap";
import FeatureBlocks from "./FeatureBlocks";
import EventsGrid from "./EventsGrid";
import PlanVisit from "./PlanVisit";
import AppCta from "./AppCta";
import Newsletter from "./Newsletter";
import InstagramFeed from "./InstagramFeed";

export default function HomePage() {
  return (
    <>
      <Hero />
      <QuickLinks />
      <FeatureBlocks />
      <BlogCards />
      <TradersMap />
      <EventsGrid />
      <PlanVisit />
      <AppCta />
      <Newsletter />
      <InstagramFeed />
    </>
  );
}
