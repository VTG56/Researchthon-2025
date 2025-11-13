import { getDocs, query, orderBy, where } from 'firebase/firestore';
import { announcementCollection } from './refs';

export const getAllAnnouncements = async () => {
  const q = query(announcementCollection(), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getPinnedAnnouncements = async () => {
  const q = query(
    announcementCollection(),
    where('pinned', '==', true),
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};