import { useParams, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { sections } from "../Data/pages";
import { getBusinessBySlug, getBusinesses } from "../api";
import useFetch from "../hooks/useFetch";
import NewsOffers from "./NewsOffers";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";
import PlaceDetailLayout from "./PlaceDetailLayout";
import { isFreeListing, FREE_PLACEHOLDERS } from "../lib/planPresentation";

// Business social profiles → the shared layout's { icon, href, label } shape.
function buildSocial(item) {
  const s = item.social;
  if (!s) return null;
  return [
    s.instagram && { icon: "instagram", href: s.instagram, label: "Instagram" },
    s.facebook && { icon: "facebook", href: s.facebook, label: "Facebook" },
    s.x && { icon: "x", href: s.x, label: "X" },
  ].filter(Boolean);
}

export default function DetailPage() {
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

  // Related items from the same section/category (excluding this one).
  // Prefer same-category venues, then top up with others from the section so
  // "You might also like" always shows a full set of relevant listings.
  const sectionItems = allBusinesses.filter((i) => i.section === item.section);
  const sameCat = sectionItems.filter((i) => i.category === item.category && i.slug !== item.slug);
  const others = sectionItems.filter((i) => i.category !== item.category && i.slug !== item.slug);
  const related = [...sameCat, ...others].slice(0, 3);

  // Map / directions target — prefer an explicit query, else the business name + town
  const mapQuery = item.mapQuery || `${item.name}, Maidenhead`;

  // Free plan: name, hero image, address, phone and email only. Description,
  // hours and photos show a "coming soon" line; socials, website/booking
  // buttons and the map are left out; News & Offers keeps its heading.
  const free = isFreeListing(item);

  const gallery = item.gallery?.length ? item.gallery : [item.image].filter(Boolean);
  const heroImage = item.logoHeader ? item.logo : gallery[0];
  const extraImages = free || item.logoHeader ? [] : gallery.slice(1);

  const description = free || item.hideDescription
    ? null
    : item.paragraphs
    ? item.paragraphs
    : [item.tagline, item.description, item.description2].filter(Boolean);

  return (
    <PlaceDetailLayout
      breadcrumbs={[
        { label: "Home", to: "/" },
        { label: sec.label, to: sec.path },
        { label: item.tag, to: `/${item.section}?category=${item.category}` },
      ]}
      categoryLabel={item.tag}
      title={item.name}
      heroImage={heroImage}
      extraImages={extraImages}
      description={description}
      descriptionPlaceholder={free ? FREE_PLACEHOLDERS.description : undefined}
      hours={free ? null : item.hours}
      hoursPlaceholder={free ? FREE_PLACEHOLDERS.hours : undefined}
      galleryPlaceholder={free ? FREE_PLACEHOLDERS.gallery : undefined}
      address={item.address}
      phone={item.phone}
      email={item.email}
      website={free || item.hideWeb ? null : item.website}
      social={free ? null : buildSocial(item)}
      directionsQuery={free ? null : mapQuery}
      extraButtonLabel={!free && item.section === "eat-drink" ? "Booking" : undefined}
      extraButtonHref={item.bookingUrl || item.website}
      shareTitle={`${item.name} — Maidenhead`}
      relatedHeading="You might also like"
      related={related.map((it) => ({
        slug: it.slug,
        to: `/${it.section}/place/${it.slug}`,
        image: it.image,
        logo: it.logo,
        category: it.tag,
        name: it.name,
      }))}
      afterMap={free
        ? <NewsOffers item={item} placeholder={FREE_PLACEHOLDERS.news} />
        : <NewsOffers item={item} />}
    />
  );
}
