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
import { db, storage } from "../firebase/client";
import { FiTrash2, FiEdit3 } from "react-icons/fi";

const AdminDashboard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

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
    <div className="min-h-screen bg-[#0b0f13] py-6 md:py-8 page-fade">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 text-white">Admin Dashboard</h1>

        <div className="mb-8 md:mb-12">
          <AdminAnnouncementForm />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">All Announcements</h2>
            <span className="text-xs md:text-sm text-gray-400 bg-green-500/10 px-2 md:px-3 py-1 rounded-full border border-green-500/20">
              ● Live
            </span>
          </div>

          <div className="space-y-4 md:space-y-6">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="flex flex-col md:flex-row gap-3 md:gap-4 items-start">
                <div className="flex-1 w-full">
                  <AnnouncementCard announcement={announcement} />
                </div>

                <div className="w-full md:w-auto flex md:flex-col gap-2 md:gap-3 md:pt-2">
                  <button
                    onClick={() => openEdit(announcement)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-sm md:text-base bg-blue-600 hover:bg-blue-700 text-white transition font-medium"
                  >
                    <FiEdit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(announcement)}
                    disabled={deletingId === announcement.id}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-sm md:text-base transition font-medium ${
                      deletingId === announcement.id
                        ? "bg-red-800 text-white/60 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    <FiTrash2 className="w-4 h-4" />
                    <span>{deletingId === announcement.id ? "Deleting..." : "Delete"}</span>
                  </button>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="text-center text-gray-400 py-12">No announcements yet.</div>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              if (!savingEdit) closeEdit();
            }}
          />
          <div className="relative bg-[#1f2933] border border-white/10 rounded-xl max-w-2xl w-full mx-4 p-5 md:p-6 z-60 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Edit Announcement</h3>

            <label className="block mb-2 text-base md:text-lg text-gray-300 font-medium">Title</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full mb-4 px-3 md:px-4 py-2 md:py-2.5 rounded-lg bg-[#0b0f13] border border-white/10 text-white text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="block mb-2 text-base md:text-lg text-gray-300 font-medium">Description</label>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={6}
              className="w-full mb-4 px-3 md:px-4 py-2 md:py-2.5 rounded-lg bg-[#0b0f13] border border-white/10 text-white text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <label className="inline-flex items-center gap-2 text-sm md:text-base mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={editPinned}
                onChange={(e) => setEditPinned(e.target.checked)}
                className="form-checkbox h-4 w-4 md:h-5 md:w-5 text-blue-600 rounded"
              />
              <span className="text-gray-300">Pin this announcement</span>
            </label>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  if (!savingEdit) closeEdit();
                }}
                className="px-4 md:px-5 py-2 md:py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition font-medium"
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className={`px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-white font-medium ${
                  savingEdit ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={savingEdit}
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;