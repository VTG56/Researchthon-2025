// src/components/Loader.jsx
export default function Loader() {
  return (
    <div className="flex items-center justify-center p-8 md:p-12" role="status" aria-label="Loading">
      <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}