import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getCurrentBusinessAccount } from "../api/business/auth";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F7FB" }}>
      <p className="text-sm" style={{ color: "#64748B", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>Loading…</p>
    </div>
  );
}

export default function BusinessApp() {
  const [account, setAccount] = useState(undefined); // undefined = checking, null = signed out

  useEffect(() => {
    getCurrentBusinessAccount().then(setAccount);
  }, []);

  if (account === undefined) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={account ? "/business/dashboard" : "/business/login"} replace />} />
      <Route path="signup" element={account ? <Navigate to="/business/dashboard" replace /> : <SignUpPage onAuth={setAccount} />} />
      <Route path="login" element={account ? <Navigate to="/business/dashboard" replace /> : <LoginPage onAuth={setAccount} />} />
      <Route
        path="dashboard"
        element={account ? <DashboardPage account={account} onLogout={() => setAccount(null)} /> : <Navigate to="/business/login" replace />}
      />
      <Route path="*" element={<Navigate to="/business" replace />} />
    </Routes>
  );
}
