import { formatTimestamp } from '../utils/formatTimestamp';

const AnnouncementCard = ({ announcement }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xl font-bold">{announcement.title}</h3>
        {announcement.pinned && (
          <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            📌 Pinned
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3">
        {formatTimestamp(announcement.timestamp)}
      </p>

      <p className="text-gray-800 mb-4 whitespace-pre-wrap">
        {announcement.body}
      </p>

      {announcement.attachments && announcement.attachments.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Attachments:</p>

          <div className="flex flex-wrap gap-2">
            {announcement.attachments.map((file, index) => (
              <a
                key={index}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition"
              >
                {file.name}
              </a>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

export default AnnouncementCard;
