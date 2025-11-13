// src/layout/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-black/60 border-b border-white/6">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: logo + title */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/rvce-logo.png" alt="RVCE Logo" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        {/* Center: nav links */}
        <div className="hidden md:flex gap-6 items-center">
          <Link to="/" className="text-lg text-gray-200 hover:text-white transition">Home</Link>
          <Link to="/announcements" className="text-lg text-gray-200 hover:text-white transition">Announcements</Link>
          <Link to="/#about" className="text-lg text-gray-200 hover:text-white transition">About</Link>
        </div>

        {/* Right: club logo + admin button */}
        <div className="flex items-center gap-3">
          <img src="/cc-logo.png" alt="Club Logo" className="h-16 w-auto object-contain" />
          

          {/* Mobile simple menu — button goes to announcements */}
          <div className="md:hidden">
            
          </div>
        </div>
      </div>
    </nav>
  );
}
