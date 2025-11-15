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

  const isActive = (path) => {
    if (path === '/games') {
      return location.pathname === '/games' || location.pathname.startsWith('/games/');
    }
    if (path === '/') {
      return location.pathname === '/' && !location.hash;
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/60 border-b border-white/6">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Desktop Layout */}
        <div className="hidden md:flex md:items-center md:justify-between">
          {/* Left Logo */}
          <a href="https://rvce.edu.in/" target="_blank" rel="noopener noreferrer" className="flex items-center">
            <img src="/rvce-logo.png" alt="RVCE Logo" className="h-12 w-auto object-contain" loading="lazy" />
          </a>

          {/* Center Section: Home + About + GAMES + Features + Announcements */}
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg transition-all btn-glow font-genos tracking-wide ${'bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white'
                }`}
                onClick={() => {
                  closeMenu();
                  if (location.pathname === '/') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                aria-current={isActive('/') ? 'page' : undefined}
              >
                HomePage
              </Link>

              <button
                onClick={() => scrollToSection('about')}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white transition-all btn-glow font-genos tracking-wide"
              >
                Overview
              </button>
            </div>

            <Link
              to="/games"
              className={`px-4 py-2 rounded-lg transition-all btn-glow font-genos tracking-wide ${
                isActive('/games')
                  ? 'bg-white/15 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white'
              }`}
              onClick={closeMenu}
              aria-label="Navigate to Games"
              aria-current={isActive('/games') ? 'page' : undefined}
            >
              Games
            </Link>

            <div className="flex items-center gap-6">
              <button
                onClick={() => scrollToSection('features')}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white transition-all btn-glow font-genos tracking-wide"
              >
                Features
              </button>

              <Link
                to="/announcements"
                className={`px-4 py-2 rounded-lg transition-all btn-glow font-genos tracking-wide ${
                  isActive('/announcements')
                    ? 'bg-white/15 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white'
                }`}
                aria-current={isActive('/announcements') ? 'page' : undefined}
              >
                Announcements
              </Link>
            </div>
          </div>

          {/* Right Logo */}
          <a href="https://in.linkedin.com/company/coding-club-rvce" target="_blank" rel="noopener noreferrer">
            <img src="/cc-logo.png" alt="Club Logo" className="h-16 w-auto object-contain" loading="lazy" />
          </a>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            {/* Left: RVCE Logo */}
            <a href="https://rvce.edu.in/" target="_blank" rel="noopener noreferrer" className="flex items-center">
              <img src="/rvce-logo.png" alt="RVCE Logo" className="h-10 w-auto object-contain" loading="lazy" />
            </a>

            {/* Center: Games Button */}
            <div className="flex justify-center">
              <Link
                to="/games"
                className={`px-5 py-2 rounded-lg font-bold text-sm transition-all btn-glow font-genos tracking-wide ${'bg-white/15 text-white'
                }`}
                onClick={closeMenu}
                aria-label="Navigate to Games"
                aria-current={isActive('/games') ? 'page' : undefined}
              >
                Games
              </Link>
            </div>

            {/* Right: Club Logo + Hamburger */}
            <div className="flex items-center gap-2 justify-end">
              <a href="https://in.linkedin.com/company/coding-club-rvce" target="_blank" rel="noopener noreferrer">
                <img src="/cc-logo.png" alt="Club Logo" className="h-12 w-auto object-contain" loading="lazy" />
              </a>
              
              <button
                onClick={toggleMenu}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition"
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
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/6 bg-black/80 backdrop-blur-md">
          <div className="px-4 py-4 space-y-3">
            <Link
              to="/"
              className={`block px-4 py-2 text-lg rounded-lg transition ${
                isActive('/')
                  ? 'bg-white/15 text-white'
                  : 'text-gray-200 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => {
                closeMenu();
                if (location.pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              aria-current={isActive('/') ? 'page' : undefined}
            >
              HomePage
            </Link>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left px-4 py-2 text-lg text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-4 py-2 text-lg text-gray-200 hover:text-white hover:bg-white/5 rounded-lg transition"
            >
              Features
            </button>
            <Link
              to="/announcements"
              className={`block px-4 py-2 text-lg rounded-lg transition ${
                isActive('/announcements')
                  ? 'bg-white/15 text-white'
                  : 'text-gray-200 hover:text-white hover:bg-white/5'
              }`}
              onClick={closeMenu}
              aria-current={isActive('/announcements') ? 'page' : undefined}
            >
              Announcements
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}