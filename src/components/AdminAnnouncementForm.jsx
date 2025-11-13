// src/components/AdminAnnouncementForm.jsx
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

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
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
    <div className="bg-[var(--card-bg)] p-4 md:p-6 rounded-xl border border-white/6 shadow-md">
      <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">Create Announcement</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-base md:text-lg font-medium mb-2 text-gray-200">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0b0f13] border border-white/10 rounded-lg text-white text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter announcement title"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-base md:text-lg font-medium mb-2 text-gray-200">Description</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows="6"
            className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0b0f13] border border-white/10 rounded-lg text-white text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter announcement description"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-base md:text-lg font-medium mb-2 text-gray-200">Attachments</label>
          <FileUploadButton onFilesSelected={handleFilesSelected} />
          
          {selectedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-300 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300 transition flex-shrink-0"
                    aria-label={`Remove ${file.name}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base md:text-lg font-semibold py-2.5 md:py-3 rounded-lg transition disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : 'Post Announcement ✅'}
        </button>
      </form>
    </div>
  );
};

export default AdminAnnouncementForm;