import { Routes, Route, Navigate } from "react-router-dom";
import BusinessLayout from "./components/BusinessLayout";
import { PlanContext, PremiumFeatureGate } from "./components/FormKit";
import { isPremium } from "../Data/plans";
import useBusinessAuth from "./hooks/useBusinessAuth";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import RegisterUserPage from "./pages/RegisterUserPage";
import ClaimBusinessPage from "./pages/ClaimBusinessPage";
import ClaimOnboardingPage from "./pages/ClaimOnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ContentAnalyticsDetailPage from "./pages/ContentAnalyticsDetailPage";
import AnalyticsReportPage from "./pages/AnalyticsReportPage";
import MyListingPage from "./pages/MyListingPage";
import ArticlesPage from "./pages/ArticlesPage";
import ArticleEditorPage from "./pages/ArticleEditorPage";
import EventsPage from "./pages/EventsPage";
import EventEditorPage from "./pages/EventEditorPage";
import EventOccurrencesPage from "./pages/EventOccurrencesPage";
import BillingPage from "./pages/BillingPage";
import UpgradeFlowPage from "./pages/UpgradeFlowPage";
import ReviewsPage from "./pages/ReviewsPage";
import SupportPage from "./pages/SupportPage";
import SettingsPage from "./pages/SettingsPage";

function RequireAuth({ children }) {
  const { isLoggedIn, needsOnboarding } = useBusinessAuth();
  if (!isLoggedIn) return <Navigate to="/business/login" replace />;
  // Someone who claimed a business still owes us a plan and a terms
  // acceptance. Everything behind the dashboard assumes both exist, so the
  // guard sends them there rather than the individual pages coping with a
  // half-set-up account.
  if (needsOnboarding) return <Navigate to="/business/welcome" replace />;
  return children;
}

// Content Managers cannot see or manage billing — Owner only.
function RequireOwner({ children }) {
  const { isLoggedIn, user, needsOnboarding } = useBusinessAuth();
  if (!isLoggedIn) return <Navigate to="/business/login" replace />;
  if (needsOnboarding) return <Navigate to="/business/welcome" replace />;
  if (user.role === "Content Manager") return <Navigate to="/business/dashboard" replace />;
  return children;
}

// News & Offers, Events and Analytics are Visibility Plan features. A Free business reaching
// any of those routes — the list, the editor, or a deep link — sees a
// Subscribe screen instead of the page.
function RequirePremium({ title, description, children }) {
  const { user } = useBusinessAuth();
  if (isPremium(user?.plan)) return children;
  return (
    <BusinessLayout>
      <PlanContext.Provider value={{ plan: user?.plan, role: user?.role }}>
        <PremiumFeatureGate title={title} description={description} />
      </PlanContext.Provider>
    </BusinessLayout>
  );
}

const NEWS_GATE = { title: "News & Offers is part of the Visibility Plan", description: "Upgrade to publish news, updates and special offers on your business page." };
const EVENTS_GATE = { title: "Events are part of the Visibility Plan", description: "Upgrade to share upcoming events, activities and special occasions." };
const ANALYTICS_GATE = { title: "Business analytics is part of the Visibility Plan", description: "Upgrade to see your page views and article views, so you can understand what's getting attention." };

// The one route that requires onboarding to still be outstanding — once it's
// done, landing here again would just show a form with nothing left to save.
function RequireOnboarding({ children }) {
  const { isLoggedIn, needsOnboarding } = useBusinessAuth();
  if (!isLoggedIn) return <Navigate to="/business/login" replace />;
  if (!needsOnboarding) return <Navigate to="/business/dashboard" replace />;
  return children;
}

export default function BusinessApp() {
  const { isLoggedIn } = useBusinessAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isLoggedIn ? "/business/dashboard" : "/business/login"} replace />} />
      <Route path="signup" element={isLoggedIn ? <Navigate to="/business/dashboard" replace /> : <SignUpPage />} />
      <Route path="login" element={isLoggedIn ? <Navigate to="/business/dashboard" replace /> : <LoginPage />} />
      <Route path="register-user" element={isLoggedIn ? <Navigate to="/business/dashboard" replace /> : <RegisterUserPage />} />
      <Route path="claim-business" element={isLoggedIn ? <Navigate to="/business/dashboard" replace /> : <ClaimBusinessPage />} />

      <Route path="welcome" element={<RequireOnboarding><ClaimOnboardingPage /></RequireOnboarding>} />

      <Route path="dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="analytics" element={<RequireAuth><RequirePremium {...ANALYTICS_GATE}><AnalyticsPage /></RequirePremium></RequireAuth>} />
      <Route path="analytics/content/:id" element={<RequireAuth><RequirePremium {...ANALYTICS_GATE}><ContentAnalyticsDetailPage /></RequirePremium></RequireAuth>} />
      <Route path="analytics/report" element={<RequireAuth><RequirePremium {...ANALYTICS_GATE}><AnalyticsReportPage /></RequirePremium></RequireAuth>} />
      <Route path="listing" element={<RequireAuth><MyListingPage /></RequireAuth>} />
      <Route path="articles" element={<RequireAuth><RequirePremium {...NEWS_GATE}><ArticlesPage /></RequirePremium></RequireAuth>} />
      <Route path="articles/new" element={<RequireAuth><RequirePremium {...NEWS_GATE}><ArticleEditorPage /></RequirePremium></RequireAuth>} />
      <Route path="articles/:id/edit" element={<RequireAuth><RequirePremium {...NEWS_GATE}><ArticleEditorPage /></RequirePremium></RequireAuth>} />
      <Route path="events" element={<RequireAuth><RequirePremium {...EVENTS_GATE}><EventsPage /></RequirePremium></RequireAuth>} />
      <Route path="events/new" element={<RequireAuth><RequirePremium {...EVENTS_GATE}><EventEditorPage /></RequirePremium></RequireAuth>} />
      <Route path="events/:id/edit" element={<RequireAuth><RequirePremium {...EVENTS_GATE}><EventEditorPage /></RequirePremium></RequireAuth>} />
      <Route path="events/:id/dates" element={<RequireAuth><RequirePremium {...EVENTS_GATE}><EventOccurrencesPage /></RequirePremium></RequireAuth>} />
      <Route path="billing" element={<RequireOwner><BillingPage /></RequireOwner>} />
      <Route path="upgrade" element={<RequireOwner><UpgradeFlowPage /></RequireOwner>} />
      <Route path="subscription" element={<RequireOwner><UpgradeFlowPage /></RequireOwner>} />
      <Route path="reviews" element={<RequireAuth><ReviewsPage /></RequireAuth>} />
      <Route path="support" element={<RequireAuth><SupportPage /></RequireAuth>} />
      <Route path="settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/business" replace />} />
    </Routes>
  );
}
