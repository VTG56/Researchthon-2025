import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-4">
        <Link 
          to="/" 
          className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Researchthon 2025
        </Link>
        <div className="flex gap-6 items-center">
          <Link 
            to="/" 
            className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
          >
            Home
          </Link>
          <Link 
            to="/announcements" 
            className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
          >
            Announcements
          </Link>
        </div>
      </div>
    </nav>
  );
}