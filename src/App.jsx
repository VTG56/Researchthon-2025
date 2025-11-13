// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";

import LandingPage from "./pages/LandingPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import CursorRibbon from "./components/CursorRibbon";
import SpaceBackground from "./components/SpaceBackground";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#0b0f13] text-white">
        {/* Space Background with Parallax - Layer 1 */}
        <SpaceBackground 
          particleCount={120}
          particleColors={['#ffffff', '#60a5fa', '#3b82f6']}
          speed={0.3}
          particleSize={2.5}
          mouseInteraction={true}
          parallaxStrength={0.3}
          connectionDistance={200}
          showConnections={true}
        />
        
        {/* Navbar - Layer 50 */}
        <Navbar />

        {/* Main Content - Layer 10 */}
        <main className="flex-grow relative z-10 pt-20">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />

            <Route path="/admin/login" element={<AdminLogin />} />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />

        {/* Cursor Ribbon - Top Layer (Layer 50) */}
        <CursorRibbon 
          color="#60a5fa"
          ribbonWidth={28}
          fadeSpeed={0.97}
          smoothness={0.2}
          glowIntensity={25}
          resetDelay={3000}
        />
      </div>
    </BrowserRouter>
  );
}