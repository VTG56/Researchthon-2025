import { useState, useEffect } from 'react';
import { query, orderBy, onSnapshot } from 'firebase/firestore';
import { announcementCollection } from '../firebase/refs';
import AdminAnnouncementForm from '../components/AdminAnnouncementForm';
import AnnouncementCard from '../components/AnnouncementCard';

const AdminDashboard = () => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const q = query(announcementCollection(), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(docs);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="mb-8">
          <AdminAnnouncementForm />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">All Announcements</h2>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;