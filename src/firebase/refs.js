import { collection, doc } from 'firebase/firestore';
import { ref } from 'firebase/storage';
import { db, storage } from './client';

// Firestore collection reference
export const announcementCollection = () => {
  return collection(db, 'announcements');
};

// Firestore document reference
export const announcementDoc = (id) => {
  return doc(db, 'announcements', id);
};

// Storage folder reference for announcements
export const announcementStorageFolder = (id) => {
  return ref(storage, `announcements/${id}/`);
};

// Storage file reference
export const filePath = (id, fileName) => {
  return ref(storage, `announcements/${id}/${fileName}`);
};