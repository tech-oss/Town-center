import { Routes, Route, Navigate } from "react-router-dom";
import useBusinessAuth from "./hooks/useBusinessAuth";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MyListingPage from "./pages/MyListingPage";
import ArticlesPage from "./pages/ArticlesPage";
import ArticleEditorPage from "./pages/ArticleEditorPage";
import BillingPage from "./pages/BillingPage";
import ReviewsPage from "./pages/ReviewsPage";
import SupportPage from "./pages/SupportPage";
import SettingsPage from "./pages/SettingsPage";

function RequireAuth({ children }) {
  const { isLoggedIn } = useBusinessAuth();
  return isLoggedIn ? children : <Navigate to="/business/login" replace />;
}

export default function BusinessApp() {
  const { isLoggedIn } = useBusinessAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isLoggedIn ? "/business/dashboard" : "/business/login"} replace />} />
      <Route path="signup" element={isLoggedIn ? <Navigate to="/business/dashboard" replace /> : <SignUpPage />} />
      <Route path="login" element={isLoggedIn ? <Navigate to="/business/dashboard" replace /> : <LoginPage />} />

      <Route path="dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="listing" element={<RequireAuth><MyListingPage /></RequireAuth>} />
      <Route path="articles" element={<RequireAuth><ArticlesPage /></RequireAuth>} />
      <Route path="articles/new" element={<RequireAuth><ArticleEditorPage /></RequireAuth>} />
      <Route path="articles/:id/edit" element={<RequireAuth><ArticleEditorPage /></RequireAuth>} />
      <Route path="billing" element={<RequireAuth><BillingPage /></RequireAuth>} />
      <Route path="reviews" element={<RequireAuth><ReviewsPage /></RequireAuth>} />
      <Route path="support" element={<RequireAuth><SupportPage /></RequireAuth>} />
      <Route path="settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/business" replace />} />
    </Routes>
  );
}
