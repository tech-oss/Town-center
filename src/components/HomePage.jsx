import Hero from "./Hero";
import QuickLinks from "./QuickLinks";
import BlogCards from "./BlogCards";
import BrandGrid from "./BrandGrid";
import FeatureBlocks from "./FeatureBlocks";
import EventsGrid from "./EventsGrid";
import PlanVisit from "./PlanVisit";
import AppCta from "./AppCta";
import Newsletter from "./Newsletter";

export default function HomePage({ headerHeight }) {
  return (
    <>
      <Hero headerHeight={headerHeight} />
      <QuickLinks />
      <BlogCards />
      <BrandGrid />
      <FeatureBlocks />
      <EventsGrid />
      <PlanVisit />
      <AppCta />
      <Newsletter />
    </>
  );
}
