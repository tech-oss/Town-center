import { useParams, Navigate } from "react-router-dom";
import { useTrackView, businessView } from "../lib/trackView";
import { useEffect } from "react";
import { sections } from "../Data/pages";
import { getBusinessBySlug, getBusinesses } from "../api";
import useFetch from "../hooks/useFetch";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";
import ServicesDetailLayout from "./ServicesDetailLayout";
import FreelancerDetailLayout from "./FreelancerDetailLayout";
import NewsOffers from "./NewsOffers";
import ClaimBusinessBox from "./ClaimBusinessBox";
import { isFreeListing, FREE_PLACEHOLDERS } from "../lib/planPresentation";
import useViewedCategory from "../lib/viewedCategory";
import { FREELANCER_CATEGORIES } from "../mobile/lib/freelancerCategories";

// A freelancer gets the portfolio-first profile rather than the
// tradesperson layout (services offered, why choose us, areas covered).
// This used to test a hand-kept list of eight old category slugs, so every
// freelancer in a newer category — most of them — got the tradesperson page
// with none of their Skills, Portfolio or Working With Me. The kind they
// chose at signup decides it now, with the taxonomy list as a fallback, the
// same test the app uses.
const isFreelancerItem = (item) =>
  item?.serviceGroup === "freelancers" || FREELANCER_CATEGORIES.has(item?.category);

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
  useTrackView(businessView(item));
  const viewed = useViewedCategory(item);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading || loadingList) return <Loading minHeight="70vh" />;
  if (error) return <ErrorState minHeight="70vh" />;
  if (!item) return <Navigate to="/" replace />;
  const sec = sections[item.section];

  const isFreelancer = isFreelancerItem(item);

  // Freelancers only pair up with other freelancers — a graphic designer's
  // "similar" list shouldn't surface builders or electricians.
  const sectionItems = allBusinesses
    .filter((i) => i.section === item.section)
    .filter((i) => isFreelancerItem(i) === isFreelancer);
  const sameCat = sectionItems.filter((i) => i.category === item.category && i.slug !== item.slug);
  const others = sectionItems.filter((i) => i.category !== item.category && i.slug !== item.slug);
  const related = [...sameCat, ...others].slice(0, 4);

  // Free plan: name, hero image, address, phone and email only — see DetailPage.
  const free = isFreeListing(item);
  const mapQuery = item.mapQuery || `${item.name}, Maidenhead`;
  const gallery = (item.gallery?.length ? item.gallery : [item.image].filter(Boolean)).slice(0, 8); // cap at 8 pictures per business
  const heroImage = gallery[0];
  const extraImages = gallery.slice(1);

  if (isFreelancer) {
    return (
      <FreelancerDetailLayout
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: sec.label, to: sec.path },
          { label: viewed.label, to: `/${item.section}?category=${viewed.value}` },
        ]}
        categoryLabel={viewed.label}
        title={item.name}
        heroImage={item.image}
        logo={free ? null : item.logo}
        hours={free ? null : item.hours}
        hoursPlaceholder={free ? FREE_PLACEHOLDERS.hours : undefined}
        description={free ? null : item.description}
        descriptionPlaceholder={free ? FREE_PLACEHOLDERS.description : undefined}
        galleryPlaceholder={free ? FREE_PLACEHOLDERS.gallery : undefined}
        address={item.address}
        phone={item.phone}
        email={item.email}
        website={free ? null : item.website}
        social={free ? null : buildSocial(item)}
        rating={item.rating}
        reviewCount={item.reviewCount}
        aboutHeading={item.aboutHeading}
        aboutText={item.aboutText}
        // Only what the freelancer entered — no borrowed fields, no example
        // wording. An empty section is simply not shown.
        skills={free ? [] : (item.skills ?? [])}
        portfolio={free ? [] : (item.portfolio ?? [])}
        availability={free ? null : item.workingWithMe?.availability}
        workMode={free ? null : item.workingWithMe?.workMode}
        responseTime={free ? null : item.workingWithMe?.responseTime}
        experience={free ? null : item.workingWithMe?.experience}
        reviewsBreakdown={item.reviewsBreakdown}
        reviewsList={item.reviewsList}
        faq={free ? [] : item.faq}
        afterGrid={free
          ? <><NewsOffers item={item} placeholder={FREE_PLACEHOLDERS.news} /><ClaimBusinessBox businessId={item.businessId} /></>
          : <NewsOffers item={item} />}
        relatedHeading="You might also like"
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
        { label: viewed.label, to: `/${item.section}?category=${viewed.value}` },
      ]}
      categoryLabel={viewed.label}
      title={item.name}
      heroImage={heroImage}
      logo={free ? null : item.logo}
      extraImages={free ? [] : extraImages}
      description={free ? null : item.description}
      descriptionPlaceholder={free ? FREE_PLACEHOLDERS.description : undefined}
      hours={free ? null : item.hours}
      hoursPlaceholder={free ? FREE_PLACEHOLDERS.hours : undefined}
      galleryPlaceholder={free ? FREE_PLACEHOLDERS.gallery : undefined}
      address={item.address}
      phone={item.phone}
      email={item.email}
      website={free ? null : item.website}
      social={free ? null : buildSocial(item)}
      directionsQuery={free ? null : mapQuery}
      rating={item.rating}
      reviewCount={item.reviewCount}
      badges={item.badges}
      aboutHeading={item.aboutHeading}
      aboutText={item.aboutText}
      stats={free ? [] : item.stats}
      servicesOffered={free ? [] : item.servicesOffered}
      whyChooseUs={free ? [] : item.whyChooseUs}
      areasCovered={free ? [] : item.areasCovered}
      reviewsBreakdown={item.reviewsBreakdown}
      reviewsList={item.reviewsList}
      businessInfo={item.businessInfo}
      accreditations={item.accreditations}
      faq={free ? [] : item.faq}
      afterGrid={free
        ? <><NewsOffers item={item} placeholder={FREE_PLACEHOLDERS.news} /><ClaimBusinessBox businessId={item.businessId} /></>
        : <NewsOffers item={item} />}
      relatedHeading="You might also like"
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
