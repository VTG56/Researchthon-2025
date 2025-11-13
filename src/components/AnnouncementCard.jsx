// src/components/AnnouncementCard.jsx
import { formatTimestamp } from "../utils/formatTimestamp";

const AnnouncementCard = ({ announcement }) => {
  return (
    <div className="bg-[#1f2933] p-6 rounded-xl border border-white/6 shadow-sm">
      <div className="flex items-start gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-white">{announcement.title}</h3>
            {announcement.pinned && (
              <span className="text-xs bg-yellow-300 text-black px-2 py-1 rounded">📌 Pinned</span>
            )}
          </div>

          <p className="text-sm text-gray-400 mb-3">{formatTimestamp(announcement.timestamp)}</p>

          <p className="text-gray-200 mb-4 whitespace-pre-wrap">{announcement.body}</p>

          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-300 font-medium">Attachments</p>
              <div className="flex flex-col">
                {announcement.attachments.map((file, idx) => (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-white/6 text-white px-3 py-2 rounded hover:bg-white/10 transition block"
                  >
                    {file.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCard;
