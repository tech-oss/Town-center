import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { categoryColors } from "../Data/events";
import { categoryTitles } from "../Data/pages";
import { getEventBySlug, getEvents, getBusinessBySlug } from "../api";
import useFetch from "../hooks/useFetch";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";
import PlaceDetailLayout, { CalendarIcon, TicketIcon } from "./PlaceDetailLayout";

// What's On events carry their own category system (Music, Family, Market,
// Festive, Theatre, Sport, Community) — map each onto the nearest See & Do
// category so the breadcrumb links to a real, filterable category, matching
// the mapping used to tag these events on the See & Do listing page.
const EVENT_CATEGORY_MAP = {
  Music: "art-culture",
  Theatre: "art-culture",
  Family: "family",
  Market: "community",
  Festive: "community",
  Community: "community",
  Sport: "sport-wellness",
};

// Map a What's On event, or a See & Do business (from the businesses resource),
// onto the shared event shape so every See & Do detail page uses the same layout.
// Businesses carry the full contact/hours/social data used by PlaceDetailLayout;
// real What's On events only have date/time/tickets/location.
function asEvent(rawEvent, it) {
  if (rawEvent) return { ...rawEvent, isBusiness: false };
  if (!it || it.section !== "see-do") return null;
  const body = it.paragraphs
    ? it.paragraphs.map((p) => ({ text: p }))
    : it.description
    ? [{ text: it.description }]
    : [];
  return {
    isBusiness: true,
    slug: it.slug,
    category: it.tag || "What's On",
    title: it.name,
    location: it.address,
    website: it.website,
    image: it.image,
    gallery: it.gallery?.length ? it.gallery : [it.image],
    standfirst: it.description,
    body,
    hours: it.hours,
    phone: it.phone,
    email: it.email,
    social: it.social,
    mapQuery: it.mapQuery,
  };
}

// Business social profiles → the shared layout's { icon, href, label } shape.
function buildSocial(social) {
  if (!social) return null;
  return [
    social.instagram && { icon: "instagram", href: social.instagram, label: "Instagram" },
    social.facebook && { icon: "facebook", href: social.facebook, label: "Facebook" },
    social.x && { icon: "x", href: social.x, label: "X" },
  ].filter(Boolean);
}

export default function EventPage() {
  const { slug } = useParams();
  // The slug can be either a What's On event or a See & Do business; fetch both
  // and let asEvent() pick the right one.
  const { data: rawEvent, loading: loadingEvent, error } = useFetch(() => getEventBySlug(slug), [slug]);
  const { data: business, loading: loadingBusiness } = useFetch(() => getBusinessBySlug(slug), [slug]);
  const { data: allEvents, loading: loadingList } = useFetch(getEvents, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (loadingEvent || loadingBusiness || loadingList) return <Loading minHeight="70vh" />;
  if (error) return <ErrorState minHeight="70vh" />;
  const event = asEvent(rawEvent, business);
  if (!event) return <Navigate to="/" replace />;

  const gallery = event.gallery?.length ? event.gallery : [event.image];
  const dot = categoryColors[event.category] || "var(--leaf)";

  // Real See & Do category for the breadcrumb: businesses already carry their
  // own category slug; What's On events map through EVENT_CATEGORY_MAP.
  const categorySlug = business?.category ?? EVENT_CATEGORY_MAP[rawEvent?.category] ?? "community";
  const categoryLabel = categoryTitles[categorySlug] ?? event.category;

  // Location isn't included here — it already renders in the info card's
  // Find Us column via the `address` prop below, so repeating it as a Pin
  // row here would just duplicate it.
  const metaRows = [
    event.date && { icon: <CalendarIcon />, text: event.date + (event.time ? ` · ${event.time}` : "") },
    event.tickets && { icon: <TicketIcon />, text: event.tickets },
  ].filter(Boolean);

  const description = event.standfirst
    ? [{ text: event.standfirst }, ...event.body]
    : event.body;

  return (
    <PlaceDetailLayout
      breadcrumbs={[
        { label: "Home", to: "/" },
        { label: "See & Do", to: "/see-do" },
        { label: categoryLabel, to: `/see-do?category=${categorySlug}` },
      ]}
      backLink={{ label: "View full calendar", to: "/whats-on" }}
      categoryLabel={event.category}
      categoryColor={dot}
      title={event.title}
      heroImage={gallery[0]}
      extraImages={gallery.slice(1)}
      metaRows={metaRows}
      description={description}
      hours={event.hours}
      address={event.location}
      phone={event.phone}
      email={event.email}
      website={event.website}
      social={buildSocial(event.social)}
      directionsQuery={event.location}
      extraButtonLabel="Buy Tickets"
      extraButtonHref={event.website}
      shareTitle={`${event.title} — Maidenhead`}
      relatedHeading="More See & Do"
      related={allEvents
        .filter((e) => e.slug !== event.slug)
        .slice(0, 3)
        .map((e) => ({
          slug: e.slug,
          to: `/event/${e.slug}`,
          image: e.image,
          tag: e.category,
          tagDotColor: categoryColors[e.category] || "var(--leaf)",
          name: e.title,
          date: e.date,
        }))}
    />
  );
}
