// src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import {
  query,
  orderBy,
  onSnapshot,
  doc as firestoreDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref as storageRef, deleteObject } from "firebase/storage";
import { announcementCollection } from "../firebase/refs";
import AdminAnnouncementForm from "../components/AdminAnnouncementForm";
import AnnouncementCard from "../components/AnnouncementCard";
import { db, storage } from "../firebase/client"; // ensure client.js exports these
import { FiTrash2, FiEdit3 } from "react-icons/fi";

const AdminDashboard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  // Edit modal state
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editPinned, setEditPinned] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const q = query(announcementCollection(), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAnnouncements(docs);
    });

    return () => unsubscribe();
  }, []);

  // Helper: try to delete a single attachment from Storage
  const tryDeleteAttachment = async (file) => {
    try {
      if (file.fullPath) {
        const ref = storageRef(storage, file.fullPath);
        await deleteObject(ref);
        return;
      }

      if (file.url && typeof file.url === "string") {
        const url = file.url;
        const marker = "/o/";
        const idx = url.indexOf(marker);
        if (idx !== -1) {
          const rest = url.substring(idx + marker.length);
          const qIdx = rest.indexOf("?");
          const encodedPath = qIdx === -1 ? rest : rest.substring(0, qIdx);
          const decodedPath = decodeURIComponent(encodedPath);
          const ref = storageRef(storage, decodedPath);
          await deleteObject(ref);
          return;
        }
      }

      if (file.url && file.url.startsWith("gs://")) {
        const ref = storageRef(storage, file.url);
        await deleteObject(ref);
        return;
      }

      console.warn("Could not derive storage path to delete for file:", file);
    } catch (err) {
      console.warn("Failed to delete attachment from storage (continuing):", err);
    }
  };

  const handleDelete = async (announcement) => {
    const ok = window.confirm(
      `Delete announcement "${announcement.title}"? This will remove the announcement and attempt to delete attached files.`
    );
    if (!ok) return;

    setDeletingId(announcement.id);
    try {
      if (Array.isArray(announcement.attachments) && announcement.attachments.length > 0) {
        for (const file of announcement.attachments) {
          // eslint-disable-next-line no-await-in-loop
          await tryDeleteAttachment(file);
        }
      }

      const docRef = firestoreDoc(db, "announcements", announcement.id);
      await deleteDoc(docRef);

      alert("Announcement deleted.");
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      alert("Delete failed — check console for details.");
    } finally {
      setDeletingId(null);
    }
  };

  // Open edit modal with prefilled values (attachments not changed here)
  const openEdit = (announcement) => {
    setEditId(announcement.id);
    setEditTitle(announcement.title || "");
    setEditBody(announcement.body || "");
    setEditPinned(Boolean(announcement.pinned));
    setEditing(true);
  };

  const closeEdit = () => {
    setEditing(false);
    setEditId(null);
    setEditTitle("");
    setEditBody("");
    setEditPinned(false);
    setSavingEdit(false);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSavingEdit(true);
    try {
      const docRef = firestoreDoc(db, "announcements", editId);
      await updateDoc(docRef, {
        title: editTitle,
        body: editBody,
        pinned: editPinned,
        updatedAt: serverTimestamp(),
      });
      alert("Announcement updated.");
      closeEdit();
    } catch (err) {
      console.error("Failed to update announcement:", err);
      alert("Update failed — check console.");
      setSavingEdit(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f13] py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-8 text-white">Admin Dashboard</h1>

        <div className="mb-8">
          <AdminAnnouncementForm />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-4xl font-bold text-white">All Announcements</h2>
            <p className="text-sm text-gray-400">Live (real-time)</p>
          </div>

          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="flex gap-4 items-start">
                <div className="flex-1">
                  <AnnouncementCard announcement={announcement} />
                </div>

                {/* Action buttons */}
                <div className="w-36 flex-shrink-0 flex flex-col gap-2 items-end pt-2">
                  <button
                    onClick={() => openEdit(announcement)}
                    className="flex items-center gap-2 px-5 py-2 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white transition"
                  >
                    <FiEdit3 />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(announcement)}
                    disabled={deletingId === announcement.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${
                      deletingId === announcement.id
                        ? "bg-red-700 text-white/60 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    <FiTrash2 />
                    <span>{deletingId === announcement.id ? "Deleting..." : "Delete"}</span>
                  </button>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="text-gray-400">No announcements yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              if (!savingEdit) closeEdit();
            }}
          />
          <div className="relative bg-[#0b0f13] border border-white/6 rounded-lg max-w-2xl w-full mx-4 p-6 z-60">
            <h3 className="text-2xl font-bold text-white mb-4">Edit Announcement</h3>

            <label className="block mb-2 text-lg text-gray-300">Title</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded bg-[#14171a] border border-white/6 text-white"
            />

            <label className="block mb-2 text-lg text-gray-300">Description</label>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={6}
              className="w-full mb-3 px-3 py-2 rounded bg-[#14171a] border border-white/6 text-white"
            />

            <label className="inline-flex items-center gap-2 text-sm mb-4">
              <input
                type="checkbox"
                checked={editPinned}
                onChange={(e) => setEditPinned(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="text-gray-300">Pinned</span>
            </label>

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  if (!savingEdit) closeEdit();
                }}
                className="px-4 py-2 rounded-md bg-white/6 hover:bg-white/10 text-white transition"
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className={`px-4 py-2 rounded-md text-white ${
                  savingEdit ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={savingEdit}
              >
                {savingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
