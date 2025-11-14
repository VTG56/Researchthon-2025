import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScavengerGame from './pages/ScavengerGame';
import BingoGame from './pages/BingoGame';
import GamesPage from './pages/GamesPage';
import AdminGamesPage from './pages/AdminGamesPage';
import AdminScavengerControl from './pages/AdminScavengerControl';
import AdminBingoControl from './pages/AdminBingoControl';
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
        <SpaceBackground 
          particleCount={120}
          particleColors={['#ffffff', '#60a5fa', '#3b82f6']}
          speed={0.3}
          particleSize={1.4}
          mouseInteraction={true}
          parallaxStrength={0.3}
          connectionDistance={200}
          showConnections={true}
        />
        
        <Navbar />

        <main className="flex-grow relative z-10 pt-20">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/scavenger" element={<ScavengerGame />} />
            <Route path="/games/bingo" element={<BingoGame />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/games" element={<AdminGamesPage />} />
            <Route path="/admin/games/scavenger" element={<AdminScavengerControl />} />
            <Route path="/admin/games/bingo" element={<AdminBingoControl />} />

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

        <CursorRibbon 
          color="#60a5fa"
          ribbonWidth={10}
          fadeSpeed={0.8}
          smoothness={0.2}
          glowIntensity={25}
          resetDelay={1500}
        />
      </div>
    </BrowserRouter>
  );
}