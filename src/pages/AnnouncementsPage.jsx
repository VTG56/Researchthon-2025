import { useState, useEffect } from "react";
import AnnouncementList from "../components/AnnouncementList";
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
    <div className="min-h-screen py-10 page-fade">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-white">Announcements</h1>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No announcements yet.</div>
          ) : (
            <div className="grid gap-6">
              {/* AnnouncementList will render cards; cards use .card styles */}
              <AnnouncementList announcements={announcements} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
