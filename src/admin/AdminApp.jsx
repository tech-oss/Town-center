import { Routes, Route } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import AdminLoginPage from "./pages/AdminLoginPage";
import useAdminAuth from "./hooks/useAdminAuth";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";
import BusinessesPage from "./pages/BusinessesPage";
import ApprovalQueuePage from "./pages/ApprovalQueuePage";
import ApprovalDetailPage from "./pages/ApprovalDetailPage";
import ListingsPage from "./pages/ListingsPage";
import BusinessContentPage from "./pages/BusinessContentPage";
import PropertiesPage from "./pages/PropertiesPage";
import ProjectsPage from "./pages/ProjectsPage";
import EventApprovalsPage from "./pages/EventApprovalsPage";
import BusinessAnalyticsPage from "./pages/BusinessAnalyticsPage";
import ArticleApprovalsPage from "./pages/ArticleApprovalsPage";
import ReviewModerationPage from "./pages/ReviewModerationPage";
import SubscriptionsPage, { SubscriptionDetailPage } from "./pages/SubscriptionsPage";
import SubscriptionDocumentsPage from "./pages/SubscriptionDocumentsPage";
import ReportingPage from "./pages/ReportingPage";
import SettingsPage from "./pages/SettingsPage";
import NewsOffersPage from "./pages/NewsOffersPage";
import FeaturedStoriesPage from "./pages/FeaturedStoriesPage";
import PushNotificationsPage from "./pages/PushNotificationsPage";
import AdminLogsPage from "./pages/AdminLogsPage";
import SupportTicketsPage from "./pages/SupportTicketsPage";
import NeighbourhoodGuidesPage from "./pages/NeighbourhoodGuidesPage";
import NeighbourhoodGuideEditorPage from "./pages/NeighbourhoodGuideEditorPage";
import SiteContentPage from "./pages/SiteContentPage";
import useFetch from "../hooks/useFetch";
import { getApprovals } from "../api/admin";

export default function AdminApp() {
  const { isLoggedIn, restored } = useAdminAuth();
  const { data: pending } = useFetch(() => getApprovals({ status: "Pending" }), []);
  const pendingCount = pending?.length ?? 0;

  // Hold rendering until the initial Supabase getSession() resolves, otherwise
  // a signed-in admin flashes the login screen on every page load.
  if (!restored) return null;
  if (!isLoggedIn) return <AdminLoginPage />;

  return (
    <Routes>
      <Route element={<AdminLayout pendingCount={pendingCount} />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="businesses" element={<BusinessesPage />} />
        <Route path="approvals" element={<ApprovalQueuePage />} />
        <Route path="approvals/:id" element={<ApprovalDetailPage />} />
        <Route path="listings" element={<ListingsPage />} />
        <Route path="business-content" element={<BusinessContentPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="event-approvals" element={<EventApprovalsPage />} />
        <Route path="business-analytics" element={<BusinessAnalyticsPage />} />
        <Route path="business-analytics/:businessId" element={<BusinessAnalyticsPage />} />
        <Route path="article-approvals" element={<ArticleApprovalsPage />} />
        <Route path="review-moderation" element={<ReviewModerationPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />
        <Route path="subscriptions/:id/documents" element={<SubscriptionDocumentsPage />} />
        <Route path="news-offers" element={<NewsOffersPage />} />
        <Route path="featured-stories" element={<FeaturedStoriesPage />} />
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
