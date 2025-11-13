// src/components/AnnouncementCard.jsx
import { formatTimestamp } from "../utils/formatTimestamp";

function FileIcon({ ext }) {
  const e = (ext || "").toLowerCase();
  // simple SVG icons by type
  if (["pdf"].includes(e)) {
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 2v6h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="6" y="17" fill="currentColor" fontSize="4" fontWeight="700">..</text>
      </svg>
    );
  }
  if (["xls", "xlsx", "csv"].includes(e)) {
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M7 7h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <text x="6" y="18" fill="currentColor" fontSize="8" fontWeight="700">..</text>
      </svg>
    );
  }
  if (["doc", "docx", "txt"].includes(e)) {
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 2h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2"/>
        <text x="7" y="17" fill="currentColor" fontSize="8" fontWeight="700">..</text>
      </svg>
    );
  }
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(e)) {
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 13l2-2 3 3 4-4 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // fallback generic file icon
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M17 3v5h4" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function FileRow({ file }) {
  // derive extension and display name
  const name = file.name || (file.url ? file.url.split("/").pop() : "file");
  const splitted = name.split(".");
  const ext = splitted.length > 1 ? splitted[splitted.length - 1] : "";
  const displayName = name.length > 40 ? `${name.slice(0, 36)}...${ext ? `.${ext}` : ""}` : name;

  return (
    <div className="flex items-center justify-between gap-3 bg-white/3 rounded-md px-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-white/6 text-white">
          <FileIcon ext={ext} />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate" title={name}>
            {displayName}
          </div>
          <div className="text-xs text-gray-300 mt-0.5">
            {ext ? ext.toUpperCase() : "FILE"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white/30 hover:bg-white/10 transition text-sm"
          aria-label={`Download ${name}`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3v12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 21H3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hidden sm:inline">Download</span>
        </a>
      </div>
    </div>
  );
}

const AnnouncementCard = ({ announcement }) => {
  return (
    <div className="bg-[#1f2933] p-6 rounded-xl border border-white/6 shadow-sm">
      <div className="flex items-start gap-3 mb-2">
        <div className="flex-1">
          <span className="text-lg bg-white/10 text-gray mb-3">{formatTimestamp(announcement.timestamp)}</span>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-3xl py-4 font-semibold text-white">{announcement.title}</h3>
            {announcement.pinned && (
              <span className="text-xs bg-yellow-300 text-black px-2 py-1 rounded">📌 Pinned</span>
            )}
          </div>

          

          <p className="text-gray-200 my-4 whitespace-pre-wrap">{announcement.body}</p>

          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="mt-3 space-y-3">
              <p className="text-lg text-gray-300 font-medium">Attachments</p>

              <div className="flex flex-col gap-2">
                {announcement.attachments.map((file, idx) => (
                  <FileRow key={idx} file={file} />
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
