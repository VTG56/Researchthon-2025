import AnnouncementCard from './AnnouncementCard';

const AnnouncementList = ({ announcements }) => {
  if (!announcements || announcements.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No announcements yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <AnnouncementCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  );
};

export default AnnouncementList;