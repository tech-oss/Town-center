import useLiveTick from "./hooks/useLiveTick";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import AdminLoginPage from "./pages/AdminLoginPage";
import useAdminAuth from "./hooks/useAdminAuth";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";
import BusinessesPage from "./pages/BusinessesPage";
import ApprovalQueuePage from "./pages/ApprovalQueuePage";
import ApprovalDetailPage from "./pages/ApprovalDetailPage";
import BusinessContentPage from "./pages/BusinessContentPage";
import PropertiesPage from "./pages/PropertiesPage";
import EventApprovalsPage from "./pages/EventApprovalsPage";
import BusinessAnalyticsPage from "./pages/BusinessAnalyticsPage";
import ArticleApprovalsPage from "./pages/ArticleApprovalsPage";
import FeatureArticleApprovalsPage from "./pages/FeatureArticleApprovalsPage";
import ReviewModerationPage from "./pages/ReviewModerationPage";
import SubscriptionsPage, { SubscriptionDetailPage } from "./pages/SubscriptionsPage";
import SubscriptionDocumentsPage from "./pages/SubscriptionDocumentsPage";
import ReportingPage from "./pages/ReportingPage";
import SettingsPage from "./pages/SettingsPage";
import HomepageSlotsPage from "./pages/HomepageSlotsPage";
import TheFuturePage from "./pages/explore/TheFuturePage";
import PushNotificationsPage from "./pages/PushNotificationsPage";
import AdminLogsPage from "./pages/AdminLogsPage";
import SupportTicketsPage from "./pages/SupportTicketsPage";
import NeighbourhoodGuidesPage from "./pages/NeighbourhoodGuidesPage";
import NeighbourhoodGuideEditorPage from "./pages/NeighbourhoodGuideEditorPage";
import SiteContentPage from "./pages/SiteContentPage";
import useFetch from "../hooks/useFetch";
import { getAdminPendingCounts } from "../api/admin";
import { useLocation } from "react-router-dom";

export default function AdminApp() {
  const { isLoggedIn, restored } = useAdminAuth();
  // Re-counted on every page change, so badges clear once items are handled.
  const { pathname } = useLocation();
  // One call counts every queue, so each sidebar item can show what's
  // waiting in it — not just the Approval Queue.
  // Also re-counted every few minutes while the tab is on screen (and on coming
  // back to it), so something a business submits while admin sits on one page
  // still shows up without navigating away. This was every minute whether or
  // not anyone was looking — 13 requests a minute from each forgotten tab.
  const tick = useLiveTick(5 * 60_000);
  const { data: counts } = useFetch(getAdminPendingCounts, [pathname, tick]);

  // Hold rendering until the initial Supabase getSession() resolves, otherwise
  // a signed-in admin flashes the login screen on every page load.
  if (!restored) return null;
  if (!isLoggedIn) return <AdminLoginPage />;

  return (
    <Routes>
      <Route element={<AdminLayout counts={counts ?? {}} />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="businesses" element={<BusinessesPage />} />
        <Route path="approvals" element={<ApprovalQueuePage />} />
        <Route path="approvals/:id" element={<ApprovalDetailPage />} />
        {/* The old placeholder Listings page, removed — anything bookmarked or
            linked to it lands on the real editor instead. */}
        <Route path="listings" element={<Navigate to="/admin/business-content" replace />} />
        <Route path="business-content" element={<BusinessContentPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="event-approvals" element={<EventApprovalsPage />} />
        <Route path="business-analytics" element={<BusinessAnalyticsPage />} />
        <Route path="business-analytics/:businessId" element={<BusinessAnalyticsPage />} />
        <Route path="article-approvals" element={<ArticleApprovalsPage />} />
        <Route path="featured-article-approvals" element={<FeatureArticleApprovalsPage />} />
        <Route path="review-moderation" element={<ReviewModerationPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />
        <Route path="subscriptions/:id/documents" element={<SubscriptionDocumentsPage />} />
        <Route path="homepage-slots" element={<HomepageSlotsPage />} />
        {/* Retired: the homepage work happens in Homepage Slots, and the
            editors these pages carried now sit on the business queues. Old
            links land on Homepage Slots rather than a dead route. */}
        <Route path="news-offers" element={<Navigate to="/admin/homepage-slots" replace />} />
        <Route path="featured-stories" element={<Navigate to="/admin/homepage-slots" replace />} />
        <Route path="featured-see-do" element={<Navigate to="/admin/homepage-slots" replace />} />
        <Route path="explore/the-future" element={<TheFuturePage />} />
        <Route path="reporting" element={<ReportingPage />} />
        <Route path="push-notifications" element={<PushNotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin-logs" element={<AdminLogsPage />} />
        <Route path="support-tickets" element={<SupportTicketsPage />} />
        <Route path="neighbourhood-guides" element={<NeighbourhoodGuidesPage />} />
        <Route path="neighbourhood-guides/new" element={<NeighbourhoodGuideEditorPage />} />
        <Route path="neighbourhood-guides/:id/edit" element={<NeighbourhoodGuideEditorPage />} />
        <Route path="site-content" element={<SiteContentPage />} />
      </Route>
    </Routes>
  );
}
