export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black/80 border-t border-white/10 mt-20 relative z-0">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center">
        <p className="text-sm text-gray-400">
          © {currentYear} Researchathon. All rights reserved.
        </p>
      </div>
    </footer>
  );
}