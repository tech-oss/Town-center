import { useLayoutEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import MobileApp from './mobile/MobileApp'
import AdminApp from './admin/AdminApp'
import BusinessApp from './business/BusinessApp'
import Header from './components/Header'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './components/HomePage'
import CategoryPage from './components/CategoryPage'
import DetailPage from './components/DetailPage'
import ServicesDetailPage from './components/ServicesDetailPage'
import ArticlePage from './components/ArticlePage'
import LivePage from './components/LivePage'
// Property search platform (for sale / for rent) — paused for now, kept for
// a future relaunch. See the commented-out routes below.
// import PropertySearch from './components/PropertySearch'
// import PropertyPage from './components/PropertyPage'
import StayListingPage from './components/StayListingPage'
import StayDetailPage from './components/StayDetailPage'
import BuildingPage from './components/BuildingPage'
import EnquirePage from './components/EnquirePage'
import AttractionPage from './components/AttractionPage'
import WorkPage from './components/WorkPage'
import WorkCategoryPage from './components/WorkCategoryPage'
import WorkplaceDevelopmentsPage from './components/WorkplaceDevelopmentsPage'
import ExploreFuturePage from './components/ExploreFuturePage'
import GuidesPage from './components/GuidesPage'
import GuideDetailPage from './components/GuideDetailPage'
import OurStoryPage from './components/OurStoryPage'
import GettingHerePage from './components/GettingHerePage'
import NewsIndexPage from './components/NewsIndexPage'
import OffersPage from './components/OffersPage'
import PressPage from './components/PressPage'
import TradersPage from './components/TradersPage'
import FeatureArticlePage from './components/FeatureArticlePage'
import EventPage from './components/EventPage'
import GetAppPage from './components/GetAppPage'
import EventsCalendarPage from './components/EventsCalendarPage'
import EventsListPage from './components/EventsListPage'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import LogoAnimation from './components/LogoAnimation/LogoAnimation'
import ExternalLinkModal from './components/ExternalLinkModal'
import useOrientationRepaint from './hooks/useOrientationRepaint'
import useExternalLinkGuard from './hooks/useExternalLinkGuard'

// See & Do place links now use the shared event layout at /event/:slug.
function SeeDoPlaceRedirect() {
  const { slug } = useParams()
  return <Navigate to={`/event/${slug}`} replace />
}

// Old /section/category/:cat URLs redirect to /section?category=cat
function SectionCategoryRedirect() {
  const { section, category } = useParams()
  return <Navigate to={`/${section}?category=${category}`} replace />
}

function PublicSite() {
  useOrientationRepaint()
  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const { pathname } = useLocation()
  // The homepage hero is a fullscreen video that the transparent header floats
  // over, so its <main> must start at y=0 (no header offset). Shop, Eat &
  // Drink, Services and See & Do share the same transparent-over-hero header
  // treatment. Every other page keeps the measured header height as top
  // padding so content clears the fixed header.
  const isHome = ['/', '/see-do', '/shop', '/eat-drink', '/services', '/offers', '/explore/the-future', '/guides', '/getting-here', '/live', '/live/stay/hotels', '/live/stay/accommodation', '/work'].includes(pathname)
    || pathname.startsWith('/guides/')
    || pathname.startsWith('/work/developments/')
    || pathname.startsWith('/live/building/')

  // useLayoutEffect fires synchronously BEFORE the browser paints,
  // so the correct height is used on the very first frame — no flash/gap.
  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    setHeaderHeight(el.offsetHeight)
    const ro = new ResizeObserver(() => setHeaderHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <>
      <ScrollToTop />
      <Header ref={headerRef} />
      {/* Rendered near the top of the DOM (rather than after the footer) so
          the widget's own IntersectionObserver-based lazy load fires on the
          very first paint, regardless of scroll position — it renders as a
          fixed corner bubble either way. */}
      <ChatWidget />
      <main style={{ paddingTop: isHome ? 0 : headerHeight || undefined }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Plan your visit / info pages */}
          <Route path="/getting-here" element={<GettingHerePage />} />
          <Route path="/traders" element={<TradersPage />} />
          <Route path="/get-the-app" element={<GetAppPage />} />
          <Route path="/work-with-us" element={<PressPage />} />
          {/* legacy alias */}
          <Route path="/press" element={<PressPage />} />
          {/* Journal */}
          <Route path="/news" element={<NewsIndexPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/news/:articleSlug" element={<ArticlePage />} />
          {/* Featured stories */}
          <Route path="/story/:slug" element={<FeatureArticlePage />} />
          {/* What's On events */}
          <Route path="/whats-on" element={<EventsCalendarPage />} />
          <Route path="/events" element={<EventsListPage />} />
          <Route path="/event/:slug" element={<EventPage />} />
          <Route path="/attraction/:slug" element={<AttractionPage />} />
          {/* Work section */}
          <Route path="/work" element={<WorkPage />} />
          <Route path="/work/developments" element={<Navigate to="/work/developments/one-maidenhead" replace />} />
          <Route path="/work/developments/:slug" element={<WorkplaceDevelopmentsPage />} />
          <Route path="/work/:category" element={<WorkCategoryPage />} />
          {/* Explore */}
          <Route path="/explore/the-future" element={<ExploreFuturePage />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/guides/:slug" element={<GuideDetailPage />} />
          {/* About */}
          <Route path="/about" element={<OurStoryPage />} />
          {/* Live (residential) section */}
          <Route path="/live" element={<LivePage />} />
          <Route path="/live/stay/hotels" element={<StayListingPage kind="hotels" />} />
          <Route path="/live/stay/hotels/:slug" element={<StayDetailPage kind="hotels" />} />
          <Route path="/live/stay/accommodation" element={<StayListingPage kind="accommodation" />} />
          <Route path="/live/stay/accommodation/:slug" element={<StayDetailPage kind="accommodation" />} />
          {/* Property search platform (for sale / for rent) — paused for
              now, kept for a future relaunch. */}
          {/* <Route path="/live/overview" element={<PropertySearch mode="overview" />} /> */}
          {/* <Route path="/live/for-sale" element={<PropertySearch mode="sale" />} /> */}
          {/* <Route path="/live/for-rent" element={<PropertySearch mode="rent" />} /> */}
          <Route path="/live/enquire" element={<EnquirePage />} />
          <Route path="/live/building/:slug" element={<BuildingPage />} />
          {/* <Route path="/live/property/:slug" element={<PropertyPage />} /> */}
          <Route path="/see-do/place/:slug" element={<SeeDoPlaceRedirect />} />
          <Route path="/services/place/:slug" element={<ServicesDetailPage />} />
          <Route path="/services/:group" element={<CategoryPage />} />
          <Route path="/:section" element={<CategoryPage />} />
          <Route path="/:section/category/:category" element={<SectionCategoryRedirect />} />
          <Route path="/:section/place/:slug" element={<DetailPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

// Standalone fullscreen demo of the cinematic logo intro (no header/footer).
function LogoAnimationDemo() {
  return (
    <div style={{ height: '100vh', backgroundColor: '#0c1418' }}>
      <LogoAnimation />
    </div>
  )
}

function App() {
  const { pendingHref, confirm, cancel } = useExternalLinkGuard()
  const { pathname } = useLocation()
  return (
    <>
      <Routes>
        <Route path="/mobile/*" element={<MobileApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/business/*" element={<BusinessApp />} />
        <Route path="/logo-animation" element={<LogoAnimationDemo />} />
        <Route path="*" element={<PublicSite />} />
      </Routes>
      <ExternalLinkModal
        open={!!pendingHref}
        onConfirm={confirm}
        onCancel={cancel}
        isMobileApp={pathname.startsWith('/mobile')}
      />
    </>
  )
}

export default App
