import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './components/HomePage'
import CategoryPage from './components/CategoryPage'
import DetailPage from './components/DetailPage'
import ArticlePage from './components/ArticlePage'
import LivePage from './components/LivePage'
import PropertySearch from './components/PropertySearch'
import PropertyPage from './components/PropertyPage'
import BuildingPage from './components/BuildingPage'
import EnquirePage from './components/EnquirePage'
import AttractionPage from './components/AttractionPage'
import WorkPage from './components/WorkPage'
import WorkCategoryPage from './components/WorkCategoryPage'
import ExploreFuturePage from './components/ExploreFuturePage'
import OurStoryPage from './components/OurStoryPage'
import GettingHerePage from './components/GettingHerePage'
import NewsIndexPage from './components/NewsIndexPage'
import PressPage from './components/PressPage'
import TradersPage from './components/TradersPage'
import FeatureArticlePage from './components/FeatureArticlePage'
import EventPage from './components/EventPage'
import GetAppPage from './components/GetAppPage'
import EventsCalendarPage from './components/EventsCalendarPage'
import EventsListPage from './components/EventsListPage'
import Footer from './components/Footer'
import NewsletterModal from './components/NewsletterModal'
import { newsletterModal } from './Data/content'

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

function App() {
  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  // Newsletter popup — disabled for now, re-enable by uncommenting the block below
  // const [modalOpen, setModalOpen] = useState(false)
  // const [modalShown, setModalShown] = useState(false)
  // useEffect(() => {
  //   if (modalShown) return
  //   const t = setTimeout(() => {
  //     setModalOpen(true)
  //     setModalShown(true)
  //   }, newsletterModal.openDelay)
  //   return () => clearTimeout(t)
  // }, [modalShown])

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
      <main style={{ paddingTop: headerHeight || undefined }}>
        <Routes>
          <Route path="/" element={<HomePage headerHeight={headerHeight} />} />
          {/* Plan your visit / info pages */}
          <Route path="/getting-here" element={<GettingHerePage />} />
          <Route path="/traders" element={<TradersPage />} />
          <Route path="/get-the-app" element={<GetAppPage />} />
          <Route path="/work-with-us" element={<PressPage />} />
          {/* legacy alias */}
          <Route path="/press" element={<PressPage />} />
          {/* Journal */}
          <Route path="/news" element={<NewsIndexPage />} />
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
          <Route path="/work/:category" element={<WorkCategoryPage />} />
          {/* Explore */}
          <Route path="/explore/the-future" element={<ExploreFuturePage />} />
          {/* About */}
          <Route path="/about" element={<OurStoryPage />} />
          {/* Live (residential) section */}
          <Route path="/live" element={<LivePage />} />
          <Route path="/live/overview" element={<PropertySearch mode="overview" />} />
          <Route path="/live/for-sale" element={<PropertySearch mode="sale" />} />
          <Route path="/live/for-rent" element={<PropertySearch mode="rent" />} />
          <Route path="/live/enquire" element={<EnquirePage />} />
          <Route path="/live/building/:slug" element={<BuildingPage />} />
          <Route path="/live/property/:slug" element={<PropertyPage />} />
          <Route path="/see-do/place/:slug" element={<SeeDoPlaceRedirect />} />
          <Route path="/:section" element={<CategoryPage />} />
          <Route path="/:section/category/:category" element={<SectionCategoryRedirect />} />
          <Route path="/:section/place/:slug" element={<DetailPage />} />
        </Routes>
      </main>
      <Footer />
      {/* <NewsletterModal open={modalOpen} onClose={() => setModalOpen(false)} /> */}
    </>
  )
}

export default App
