// src/layout/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    closeMenu();
    
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/60 border-b border-white/6">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3" onClick={closeMenu}>
            <img src="/rvce-logo.png" alt="RVCE Logo" className="h-10 md:h-12 w-auto object-contain" loading="lazy" />
          </Link>
        </div>

        <div className="hidden md:flex gap-6 items-center">
          <Link to="/" className="text-lg text-gray-200 hover:text-white transition">
            Home
          </Link>
          <Link to="/announcements" className="text-lg text-gray-200 hover:text-white transition">
            Announcements
          </Link>
          <button 
            onClick={() => scrollToSection('about')}
            className="text-lg text-gray-200 hover:text-white transition"
          >
            About
          </button>
          <button 
            onClick={() => scrollToSection('features')}
            className="text-lg text-gray-200 hover:text-white transition"
          >
            Features
          </button>
        </div>

        <div className="flex items-center gap-3">
          <img src="/cc-logo.png" alt="Club Logo" className="h-12 md:h-16 w-auto object-contain" loading="lazy" />

          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/6 bg-black/80 backdrop-blur-md">
          <div className="px-4 py-4 space-y-3">
            <Link
              to="/"
              className="block px-4 py-2 text-lg text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition"
              onClick={closeMenu}
            >
              Home
            </Link>
            <Link
              to="/announcements"
              className="block px-4 py-2 text-lg text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition"
              onClick={closeMenu}
            >
              Announcements
            </Link>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left px-4 py-2 text-lg text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-4 py-2 text-lg text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition"
            >
              Features
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}