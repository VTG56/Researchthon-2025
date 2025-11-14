// src/components/AnnouncementCard.jsx
import { formatTimestamp } from "../utils/formatTimestamp";

function FileIcon({ ext }) {
  const e = (ext || "").toLowerCase();
  
  if (["pdf"].includes(e)) {
    return (
      <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 2v6h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (["xls", "xlsx", "csv"].includes(e)) {
    return (
      <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M7 7h8M7 11h8M7 15h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (["doc", "docx", "txt"].includes(e)) {
    return (
      <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 2h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M14 2v5h5" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    );
  }
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(e)) {
    return (
      <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 13l2-2 3 3 4-4 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  
  return (
    <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M17 3v5h4" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function FileRow({ file }) {
  const name = file.name || (file.url ? file.url.split("/").pop() : "file");
  const splitted = name.split(".");
  const ext = splitted.length > 1 ? splitted[splitted.length - 1] : "";
  const displayName = name.length > 40 ? `${name.slice(0, 36)}...${ext ? `.${ext}` : ""}` : name;

  return (
    <div className="flex items-center justify-between gap-2 md:gap-3 bg-white/4 rounded-md px-3 py-2 border border-white/10">
        <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 md:gap-3 min-w-0 flex-1 hover:opacity-80 transition"
        aria-label={`Open ${name}`}
      >
        <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-md bg-white/6 text-white flex-shrink-0">
          <FileIcon ext={ext} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-white truncate" title={name}>
            {displayName}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {ext ? ext.toUpperCase() : "FILE"}
          </div>
        </div>
      </a>

      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded bg-white/6 hover:bg-white/10 transition text-sm flex-shrink-0"
        aria-label={`Download ${name}`}
      >
        <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3v12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 21H3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="hidden sm:inline">Download</span>
      </a>
    </div>
  );
}

const AnnouncementCard = ({ announcement }) => {
  return (
    <div className="bg-[#1f2933] p-4 md:p-6 rounded-xl border border-white/4 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm md:text-base text-gray-400">
            {formatTimestamp(announcement.timestamp)}
          </span>
          {announcement.pinned && (
            <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded font-medium">
              📌 Pinned
            </span>
          )}
        </div>

        <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-2 md:mb-3">
          {announcement.title}
        </h3>

        <p className="text-sm md:text-base text-gray-200 whitespace-pre-wrap leading-relaxed">
          {announcement.body}
        </p>

        {announcement.attachments && announcement.attachments.length > 0 && (
          <div className="mt-4 space-y-2 md:space-y-3">
            <p className="text-base md:text-lg text-gray-300 font-semibold">Attachments</p>

            <div className="flex flex-col gap-2">
              {announcement.attachments.map((file, idx) => (
                <FileRow key={idx} file={file} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCard;