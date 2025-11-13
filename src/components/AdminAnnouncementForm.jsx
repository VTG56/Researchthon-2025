import { useState } from 'react';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { announcementCollection } from '../firebase/refs';
import { uploadAnnouncementFiles } from '../firebase/upload';
import FileUploadButton from './FileUploadButton';
import { randomId } from '../utils/randomId';

const AdminAnnouncementForm = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFilesSelected = (filesArray) => {
    setSelectedFiles([...selectedFiles, ...filesArray]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const announcementId = randomId();

    let uploadedFilesMetadata = [];
    if (selectedFiles.length > 0) {
      uploadedFilesMetadata = await uploadAnnouncementFiles(announcementId, selectedFiles);
    }

    await addDoc(announcementCollection(), {
      id: announcementId,
      title,
      body,
      timestamp: serverTimestamp(),
      attachments: uploadedFilesMetadata,
      pinned: false
    });

    setTitle('');
    setBody('');
    setSelectedFiles([]);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Create Announcement</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows="6"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Attachments</label>
          <FileUploadButton onFilesSelected={handleFilesSelected} />
          
          {selectedFiles.length > 0 && (
            <ul className="mt-2 text-sm text-gray-600">
              {selectedFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {isSubmitting ? 'Posting...' : 'Post Announcement'}
        </button>
      </form>
    </div>
  );
};

export default AdminAnnouncementForm;