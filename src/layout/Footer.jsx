export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center">
        <p className="text-sm text-gray-600">
          © {currentYear} Researchthon. All rights reserved.
        </p>
      </div>
    </footer>
  );
}