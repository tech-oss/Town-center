import { useParams, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { sections } from "../Data/pages";
import { getBusinessBySlug, getBusinesses } from "../api";
import useFetch from "../hooks/useFetch";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";
import ServicesDetailLayout from "./ServicesDetailLayout";
import FreelancerDetailLayout from "./FreelancerDetailLayout";
import NewsOffers from "./NewsOffers";

// Categories under the Services "Freelancers" menu column — these get the
// lighter, portfolio-first profile layout instead of the local-directory
// business profile (opening hours, areas covered, business info) that
// tradespeople and professionals use.
const FREELANCER_CATEGORIES = new Set([
  "graphic-designers",
  "web-developers",
  "photographers",
  "copywriters",
  "marketing-consultants",
  "personal-trainers",
  "tutors",
  "virtual-assistants",
]);

function buildSocial(item) {
  const s = item.social;
  if (!s) return null;
  return [
    s.instagram && { icon: "instagram", href: s.instagram, label: "Instagram" },
    s.facebook && { icon: "facebook", href: s.facebook, label: "Facebook" },
    s.x && { icon: "x", href: s.x, label: "X" },
  ].filter(Boolean);
}

// Distinct profile-style layout used only for Services business listings —
// See & Do / Eat & Drink / Shop keep the original DetailPage + PlaceDetailLayout.
export default function ServicesDetailPage() {
  const { slug } = useParams();
  const { data: item, loading, error } = useFetch(() => getBusinessBySlug(slug), [slug]);
  const { data: allBusinesses, loading: loadingList } = useFetch(getBusinesses, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading || loadingList) return <Loading minHeight="70vh" />;
  if (error) return <ErrorState minHeight="70vh" />;
  if (!item) return <Navigate to="/" replace />;
  const sec = sections[item.section];

  const isFreelancer = FREELANCER_CATEGORIES.has(item.category);

  // Freelancers only pair up with other freelancers — a graphic designer's
  // "similar" list shouldn't surface builders or electricians.
  const sectionItems = allBusinesses
    .filter((i) => i.section === item.section)
    .filter((i) => FREELANCER_CATEGORIES.has(i.category) === isFreelancer);
  const sameCat = sectionItems.filter((i) => i.category === item.category && i.slug !== item.slug);
  const others = sectionItems.filter((i) => i.category !== item.category && i.slug !== item.slug);
  const related = [...sameCat, ...others].slice(0, 4);

  const mapQuery = item.mapQuery || `${item.name}, Maidenhead`;
  const gallery = item.gallery.slice(0, 8); // cap at 8 pictures per business
  const heroImage = gallery[0];
  const extraImages = gallery.slice(1);

  if (isFreelancer) {
    return (
      <FreelancerDetailLayout
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: sec.label, to: sec.path },
          { label: item.tag, to: `/${item.section}?category=${item.category}` },
        ]}
        categoryLabel={item.tag}
        title={item.name}
        heroImage={item.image}
        description={item.description}
        address={item.address}
        phone={item.phone}
        email={item.email}
        website={item.website}
        social={buildSocial(item)}
        rating={item.rating}
        reviewCount={item.reviewCount}
        aboutHeading={item.aboutHeading}
        aboutText={item.aboutText}
        skills={item.servicesOffered}
        portfolio={item.portfolio || gallery.map((src) => ({ image: src }))}
        availability={item.availability || "Accepting new projects"}
        workMode={item.workMode || "Remote & on-site"}
        responseTime={item.responseTime || "Usually within 24 hours"}
        experience={item.experience || item.stats?.[0]?.value}
        reviewsBreakdown={item.reviewsBreakdown}
        reviewsList={item.reviewsList}
        faq={item.faq}
        afterGrid={!item.freePlan && <NewsOffers item={item} />}
        relatedHeading="Similar Freelancers"
        related={related.map((it) => ({
          slug: it.slug,
          to: `/${it.section}/place/${it.slug}`,
          image: it.image,
          category: it.tag,
          name: it.name,
          rating: it.rating,
          reviewCount: it.reviewCount,
        }))}
      />
    );
  }

  return (
    <ServicesDetailLayout
      breadcrumbs={[
        { label: "Home", to: "/" },
        { label: sec.label, to: sec.path },
        { label: item.tag, to: `/${item.section}?category=${item.category}` },
      ]}
      categoryLabel={item.tag}
      title={item.name}
      heroImage={heroImage}
      extraImages={extraImages}
      description={item.description}
      hours={item.hours}
      address={item.address}
      phone={item.phone}
      email={item.email}
      website={item.website}
      social={buildSocial(item)}
      directionsQuery={mapQuery}
      rating={item.rating}
      reviewCount={item.reviewCount}
      badges={item.badges}
      aboutHeading={item.aboutHeading}
      aboutText={item.aboutText}
      stats={item.stats}
      servicesOffered={item.servicesOffered}
      whyChooseUs={item.whyChooseUs}
      areasCovered={item.areasCovered}
      reviewsBreakdown={item.reviewsBreakdown}
      reviewsList={item.reviewsList}
      businessInfo={item.businessInfo}
      accreditations={item.accreditations}
      faq={item.faq}
      afterGrid={!item.freePlan && <NewsOffers item={item} />}
      relatedHeading="Similar Businesses"
      related={related.map((it) => ({
        slug: it.slug,
        to: `/${it.section}/place/${it.slug}`,
        image: it.image,
        category: it.tag,
        name: it.name,
        rating: it.rating,
        reviewCount: it.reviewCount,
      }))}
    />
  );
}
