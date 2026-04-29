// App.tsx — top-level route table with an auth guard.
// When Supabase is configured and there's no session, we show Login.
// When Supabase isn't configured, we treat the app as un-authenticated demo mode
// (mock data renders, AI calls fall back to canned responses).

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Dashboard } from "@/pages/Dashboard";
import { CategoryDetail } from "@/pages/CategoryDetail";
import { Browser } from "@/pages/Browser";
import { AIFull } from "@/pages/AIFull";
import { UploadModal } from "@/pages/UploadModal";
import { Onboarding } from "@/pages/Onboarding";
import { Login } from "@/pages/Login";
import { Sheets } from "@/pages/Sheets";
import { Trash } from "@/pages/Trash";
import { Contacts } from "@/pages/Contacts";
import { Settings } from "@/pages/Settings";

function LoadingShell() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "100vw",
        height: "100vh",
        background: "var(--ad-bg)",
        color: "var(--ad-text-dim)",
        fontSize: 13,
        fontFamily: "'Geist', system-ui, sans-serif",
      }}
    >
      Loading…
    </div>
  );
}

export function App() {
  const { user, loading, configured } = useAuth();

  // While we're checking the session, show a placeholder.
  if (loading) return <LoadingShell />;

  // If Supabase is configured and the user is not signed in, show login.
  // If Supabase is NOT configured, we run in demo mode — mocks visible to anyone.
  if (configured && !user) return <Login />;

  return (
    <Routes>
      <Route path="/"               element={<Dashboard />} />
      <Route path="/categories/:id" element={<CategoryDetail />} />
      <Route path="/categories"     element={<Navigate to="/documents" replace />} />
      <Route path="/documents"      element={<Browser />} />
      <Route path="/ai"             element={<AIFull />} />
      <Route path="/upload"         element={<UploadModal />} />
      <Route path="/sheets"         element={<Sheets />} />
      <Route path="/trash"          element={<Trash />} />
      <Route path="/contacts"       element={<Contacts />} />
      <Route path="/settings"       element={<Settings />} />
      <Route path="/onboarding"     element={<Onboarding />} />
      <Route path="*"               element={<Navigate to="/" replace />} />
    </Routes>
  );
}
