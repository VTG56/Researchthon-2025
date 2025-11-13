// src/pages/AnnouncementsPage.jsx
import { useState, useEffect } from "react";
import AnnouncementList from "../components/AnnouncementList";
import Loader from "../components/Loader";
import { getAllAnnouncements } from "../firebase/queries";

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAnnouncements = async () => {
      const data = await getAllAnnouncements();
      if (!mounted) return;
      setAnnouncements(data);
      setLoading(false);
    };
    fetchAnnouncements();
    return () => (mounted = false);
  }, []);

  return (
    <div className="min-h-screen py-8 md:py-10 page-fade" aria-busy={loading}>
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-white">Announcements</h1>

        <div className="space-y-4 md:space-y-6">
          {loading ? (
            <Loader />
          ) : announcements.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No announcements yet.</div>
          ) : (
            <AnnouncementList announcements={announcements} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;