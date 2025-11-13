import { useRef } from 'react';

const FileUploadButton = ({ onFilesSelected }) => {
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      onFilesSelected(filesArray);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleButtonClick}
        className="px-4 py-2 w-full  text-2xl bg-blue-800 text-white rounded-md hover:bg-blue-700 transition"
      >
        +Attach Files
      </button>
    </div>
  );
};

export default FileUploadButton;