import { useState, useEffect } from 'react';
import AnnouncementList from '../components/AnnouncementList';
import { getAllAnnouncements } from '../firebase/queries';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const data = await getAllAnnouncements();
      setAnnouncements(data);
      setLoading(false);
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Announcements</h1>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : (
          <AnnouncementList announcements={announcements} />
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;