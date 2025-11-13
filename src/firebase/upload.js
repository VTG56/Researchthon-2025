import { uploadBytes, getDownloadURL } from 'firebase/storage';
import { filePath } from './refs';

export const uploadAnnouncementFiles = async (announcementId, filesArray) => {
  const uploadedFiles = [];

  for (const file of filesArray) {
    const cleanedName = file.name.toLowerCase().replace(/\s+/g, '_');
    const storageRef = filePath(announcementId, cleanedName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    uploadedFiles.push({
      name: cleanedName,
      url: downloadURL,
      type: file.type
    });
  }

  return uploadedFiles;
};