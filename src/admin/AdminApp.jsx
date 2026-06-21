import { Routes, Route } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";
import ApprovalQueuePage from "./pages/ApprovalQueuePage";
import ApprovalDetailPage from "./pages/ApprovalDetailPage";
import ListingsPage from "./pages/ListingsPage";
import PropertiesPage from "./pages/PropertiesPage";
import ProjectsPage from "./pages/ProjectsPage";
import EventsNewsPage from "./pages/EventsNewsPage";
import SubscriptionsPage, { SubscriptionDetailPage } from "./pages/SubscriptionsPage";
import ReportingPage from "./pages/ReportingPage";
import SettingsPage from "./pages/SettingsPage";
import useFetch from "../hooks/useFetch";
import { getApprovals } from "../api/admin";

export default function AdminApp() {
  const { data: pending } = useFetch(() => getApprovals({ status: "Pending" }), []);
  const pendingCount = pending?.length ?? 0;

  return (
    <Routes>
      <Route element={<AdminLayout pendingCount={pendingCount} />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="approvals" element={<ApprovalQueuePage />} />
        <Route path="approvals/:id" element={<ApprovalDetailPage />} />
        <Route path="listings" element={<ListingsPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="events-news" element={<EventsNewsPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />
        <Route path="reporting" element={<ReportingPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
