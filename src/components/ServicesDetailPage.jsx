import { useParams, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { sections } from "../Data/pages";
import { getBusinessBySlug, getBusinesses } from "../api";
import useFetch from "../hooks/useFetch";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";
import ServicesDetailLayout from "./ServicesDetailLayout";

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

  const sectionItems = allBusinesses.filter((i) => i.section === item.section);
  const sameCat = sectionItems.filter((i) => i.category === item.category && i.slug !== item.slug);
  const others = sectionItems.filter((i) => i.category !== item.category && i.slug !== item.slug);
  const related = [...sameCat, ...others].slice(0, 4);

  const mapQuery = item.mapQuery || `${item.name}, Maidenhead`;
  const heroImage = item.gallery[0];
  const extraImages = item.gallery.slice(1);

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
