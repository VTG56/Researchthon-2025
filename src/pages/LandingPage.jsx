import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAnnouncements } from '../firebase/queries';
import AnnouncementCard from '../components/AnnouncementCard';
import Loader from '../components/Loader';

export default function LandingPage() {
  const navigate = useNavigate();
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentAnnouncements = async () => {
      try {
        const announcements = await getAllAnnouncements();
        setRecentAnnouncements(announcements.slice(0, 3));
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Researchthon 2025
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Your one-stop hub for updates, schedules, and official announcements.
        </p>
        <button
          onClick={() => navigate('/announcements')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all shadow-lg transform hover:scale-105"
        >
          View Announcements
        </button>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10 mt-20">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          About Researchthon
        </h2>
        <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto text-center">
          Researchthon 2025 is an innovative collegiate event bringing together students, 
          researchers, and industry experts to collaborate on cutting-edge projects. 
          Over the course of this intensive program, participants will tackle real-world 
          challenges, develop groundbreaking solutions, and present their findings to a 
          panel of distinguished judges. Stay connected with all event updates, schedules, 
          and important announcements through this platform.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10 mt-20">
        <h2 className="text-3xl font-bold text-white mb-10 text-center">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[var(--card-bg)] p-6 rounded-lg shadow-md border border-white/5 text-center transition-transform hover:scale-105">
            <div className="text-4xl mb-4">📢</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Live Announcements
            </h3>
            <p className="text-gray-300">
              Get instant updates on event schedules, venue changes, and important 
              notifications as they happen.
            </p>
          </div>
          <div className="bg-[var(--card-bg)] p-6 rounded-lg shadow-md border border-white/5 text-center transition-transform hover:scale-105">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Document Downloads
            </h3>
            <p className="text-gray-300">
              Access presentation slides, resource materials, and official documents 
              directly from announcements.
            </p>
          </div>
          <div className="bg-[var(--card-bg)] p-6 rounded-lg shadow-md border border-white/5 text-center transition-transform hover:scale-105">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Admin Updates in Real-Time
            </h3>
            <p className="text-gray-300">
              Stay informed with real-time posts from event organizers ensuring you 
              never miss critical information.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10 mt-20 mb-20">
        <h2 className="text-3xl font-bold text-white mb-10 text-center">
          Recent Announcements
        </h2>
        {loading ? (
          <Loader />
        ) : recentAnnouncements.length > 0 ? (
          <div className="space-y-6">
            {recentAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">
            No announcements yet. Check back soon!
          </p>
        )}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/announcements')}
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg transition-all transform hover:scale-105"
          >
            View All Announcements
          </button>
        </div>
      </section>
    </div>
  );
}