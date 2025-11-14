// src/pages/AdminScavengerControl.jsx
// Add in App.jsx router: <Route path="/admin/games/scavenger" element={<AdminScavengerControl />} />
// src/pages/AdminScavengerControl.jsx
// Add in App.jsx router: <Route path="/admin/games/scavenger" element={<AdminScavengerControl />} />

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc, serverTimestamp, Timestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/client';

const AdminScavengerControl = () => {
  const navigate = useNavigate();

  // Auth check
  useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Scavenger list state
  const [items, setItems] = useState([
    'Find the main auditorium',
    'Take a photo with a researcher',
    'Locate the registration desk'
  ]);
  const [newItem, setNewItem] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [rules, setRules] = useState('');

  // Upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [referenceFiles, setReferenceFiles] = useState([]);

  // Schedule state
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isLive, setIsLive] = useState(false);

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState('live'); // 'live' or 'waiting'
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activityLog, setActivityLog] = useState([
    { action: 'Page initialized', timestamp: new Date().toISOString(), user: 'Admin' }
  ]);

  // Initialize bulk text from items
  useEffect(() => {
    setBulkText(items.join('\n'));
  }, []);

  // Real-time listener for Firestore document
  useEffect(() => {
    const docRef = doc(db, 'games', 'scavenger');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Firestore data synced:', data);
        
        // Update status
        if (data.status === 'live') {
          setIsLive(true);
        } else {
          setIsLive(false);
        }
        
        // Optionally sync items if they exist in Firestore
        if (data.items && Array.isArray(data.items)) {
          setItems(data.items);
          setBulkText(data.items.join('\n'));
        }
        
        // Sync reference files
        if (data.referenceFiles && Array.isArray(data.referenceFiles)) {
          setReferenceFiles(data.referenceFiles);
        }
        
        addToLog('Synced with Firestore');
      } else {
        console.log('No scavenger hunt document exists yet');
        setIsLive(false);
      }
    }, (error) => {
      console.error('Error listening to Firestore:', error);
      addToLog(`Firestore sync error: ${error.message}`);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array - only set up once

  // Sync items from bulk text
  const handleBulkTextChange = (text) => {
    setBulkText(text);
    const lines = text.split('\n').filter(line => line.trim() !== '');
    setItems(lines);
  };

  // Add single item
  const handleAddItem = () => {
    if (newItem.trim()) {
      const updated = [...items, newItem.trim()];
      setItems(updated);
      setBulkText(updated.join('\n'));
      setNewItem('');
      addToLog(`Added item: "${newItem.trim()}"`);
    }
  };

  // Remove item
  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    setBulkText(updated.join('\n'));
    addToLog(`Removed item at position ${index + 1}`);
  };

  // Move item up
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...items];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setItems(updated);
    setBulkText(updated.join('\n'));
  };

  // Move item down
  const handleMoveDown = (index) => {
    if (index === items.length - 1) return;
    const updated = [...items];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setItems(updated);
    setBulkText(updated.join('\n'));
  };

  // File upload handler
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      addToLog(`Selected reference file: ${file.name}`);
      handleUploadFile(file);
    }
  };

  // Firebase Storage upload implementation
  const handleUploadFile = async (file) => {
    try {
      setLoading(true);
      setUploadProgress(0);
      
      // Sanitize filename and create unique path
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `scavenger_refs/${timestamp}_${sanitizedFileName}`;
      
      console.log(`Uploading file to: ${filePath}`);
      
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
        },
        (error) => {
          console.error('File upload error:', error);
          addToLog(`File upload failed: ${error.message}`);
          alert(`File upload failed: ${error.message}. You can still post without the file.`);
          setUploadedFile(null);
          setUploadProgress(0);
          setLoading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('File uploaded successfully. URL:', downloadURL);
            
            const fileObj = {
              name: file.name,
              url: downloadURL
            };
            
            setReferenceFiles([fileObj]);
            addToLog(`Successfully uploaded: ${file.name}`);
            setLoading(false);
            setUploadProgress(0);
          } catch (urlError) {
            console.error('Error getting download URL:', urlError);
            addToLog(`Failed to get file URL: ${urlError.message}`);
            setLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Error initiating upload:', error);
      addToLog(`Upload initiation failed: ${error.message}`);
      setUploadedFile(null);
      setLoading(false);
    }
  };

  // Post Now - Write to Firestore immediately
  const handlePostNow = async () => {
    if (items.length === 0) {
      alert('Please add at least one scavenger hunt item before posting.');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      
      const payload = {
        items: items,
        rules: rules.trim() || null,
        referenceFiles: referenceFiles,
        status: 'live',
        startAt: null,
        publishedAt: serverTimestamp(),
        publishedBy: 'admin',
        updatedAt: serverTimestamp()
      };

      console.log('Posting to Firestore:', payload);
      
      const docRef = doc(db, 'games', 'scavenger');
      await setDoc(docRef, payload, { merge: true });

      // Status will be updated by the listener
      addToLog(`Posted ${items.length} items live`);
      alert('Scavenger hunt posted successfully! Participants can now see it.');
      
    } catch (error) {
      console.error('Error posting to Firestore:', error);
      addToLog(`Post failed: ${error.message}`);
      alert(`Failed to post: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Schedule for later
  const handleSchedule = async () => {
    if (items.length === 0) {
      alert('Please add at least one scavenger hunt item before scheduling.');
      return;
    }

    if (!scheduleDate || !scheduleTime) {
      alert('Please select both date and time for scheduling.');
      return;
    }

    setShowScheduleModal(true);
  };

  // Confirm and write schedule to Firestore
  const confirmSchedule = async () => {
    if (loading) return;

    try {
      setLoading(true);
      
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      const firestoreTimestamp = Timestamp.fromDate(scheduledDateTime);
      
      const payload = {
        items: items,
        rules: rules.trim() || null,
        referenceFiles: referenceFiles,
        status: 'scheduled',
        startAt: firestoreTimestamp,
        scheduledBy: 'admin',
        updatedAt: serverTimestamp()
      };

      console.log('Scheduling in Firestore:', payload);
      
      const docRef = doc(db, 'games', 'scavenger');
      await setDoc(docRef, payload, { merge: true });

      setShowScheduleModal(false);
      addToLog(`Scheduled for ${scheduledDateTime.toLocaleString()}`);
      alert(`Scavenger hunt scheduled for ${scheduledDateTime.toLocaleString()}.\n\nNote: Auto-publish requires a Cloud Function. For testing, manually change status to 'live' in Firestore console.`);
      
    } catch (error) {
      console.error('Error scheduling in Firestore:', error);
      addToLog(`Schedule failed: ${error.message}`);
      alert(`Failed to schedule: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Unpublish - Take offline
  const handleUnpublish = async () => {
    if (!window.confirm('Are you sure you want to take the scavenger hunt offline?')) {
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      
      const payload = {
        status: 'offline',
        unpublishedAt: serverTimestamp(),
        unpublishedBy: 'admin',
        updatedAt: serverTimestamp()
      };

      console.log('Unpublishing in Firestore:', payload);
      
      const docRef = doc(db, 'games', 'scavenger');
      await updateDoc(docRef, payload);

      // Status will be updated by the listener
      addToLog('Unpublished scavenger hunt');
      alert('Scavenger hunt taken offline. Participants will see "Stay Tuned" message.');
      
    } catch (error) {
      console.error('Error unpublishing in Firestore:', error);
      addToLog(`Unpublish failed: ${error.message}`);
      alert(`Failed to unpublish: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Activity log helper
  const addToLog = (action) => {
    setActivityLog(prev => [{
      action,
      timestamp: new Date().toISOString(),
      user: 'Admin'
    }, ...prev].slice(0, 10)); // Keep last 10 entries
  };

  return (
    <div className="min-h-screen bg-[#0b0f13] py-6 md:py-8 page-fade">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header with breadcrumb */}
        <header className="mb-6 md:mb-8">
          <nav className="text-sm text-gray-400 mb-3">
            <button onClick={() => navigate('/admin/dashboard')} className="hover:text-white transition">
              Admin
            </button>
            <span className="mx-2">→</span>
            <button onClick={() => navigate('/admin/games')} className="hover:text-white transition">
              Games
            </button>
            <span className="mx-2">→</span>
            <span className="text-white">Scavenger Hunt</span>
          </nav>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                Scavenger Hunt Controls
              </h1>
              <p className="text-base md:text-lg text-gray-400">
                Manage hunt items, schedule, and participant view
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs md:text-sm px-3 py-1 rounded-full border ${
                isLive 
                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                  : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
              }`}>
                {isLive ? '● Live' : '○ Offline'}
              </span>
            </div>
          </div>
        </header>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left column - Editor & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bulk Editor */}
            <section className="bg-gray-900/70 border border-white/10 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Edit Hunt Items</h2>
              <p className="text-sm text-gray-400 mb-4">
                Enter each item on a new line. Items will appear in order for participants.
              </p>
              
              <textarea
                value={bulkText}
                onChange={(e) => handleBulkTextChange(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 bg-[#0b0f13] border border-white/10 rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                placeholder="Find the main auditorium&#10;Take a photo with a researcher&#10;Locate the registration desk"
                aria-label="Bulk edit scavenger hunt items"
              />

              <div className="mt-4 flex items-center gap-3">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                  placeholder="Add single item..."
                  className="flex-1 px-4 py-2 bg-[#0b0f13] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Add single item"
                />
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                >
                  Add Item
                </button>
              </div>
            </section>

            {/* Item Preview List with Reorder */}
            <section className="bg-gray-900/70 border border-white/10 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                Items Preview ({items.length})
              </h2>
              
              {items.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No items yet. Add items above.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-[#0b0f13] border border-white/10 rounded-lg p-3 group hover:border-white/20 transition"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className={`p-1 rounded ${
                            index === 0 
                              ? 'text-gray-600 cursor-not-allowed' 
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                          aria-label="Move up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === items.length - 1}
                          className={`p-1 rounded ${
                            index === items.length - 1 
                              ? 'text-gray-600 cursor-not-allowed' 
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                          aria-label="Move down"
                        >
                          ▼
                        </button>
                      </div>
                      
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      
                      <p className="flex-1 text-white text-sm md:text-base">{item}</p>
                      
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
                        aria-label="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Reference File Upload */}
            <section className="bg-gray-900/70 border border-white/10 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Reference File (Optional)</h2>
              <p className="text-sm text-gray-400 mb-4">
                Upload a reference document for your records (.pdf, .xlsx, .csv, .docx)
              </p>
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mb-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Uploading: {uploadProgress.toFixed(0)}%</p>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <label className="flex-1">
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.csv,.docx"
                    onChange={handleFileSelect}
                    disabled={loading}
                    className="hidden"
                    aria-label="Upload reference file"
                  />
                  <div className={`cursor-pointer px-4 py-3 bg-[#0b0f13] border border-white/10 rounded-lg hover:border-white/20 transition text-center ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}>
                    {referenceFiles.length > 0 ? (
                      <span className="text-white">
                        📄 {referenceFiles[0].name}
                      </span>
                    ) : uploadedFile ? (
                      <span className="text-yellow-400">
                        ⏳ Uploading {uploadedFile.name}...
                      </span>
                    ) : (
                      <span className="text-gray-400">Click to upload reference file</span>
                    )}
                  </div>
                </label>
                
                {referenceFiles.length > 0 && (
                  <button
                    onClick={() => {
                      setReferenceFiles([]);
                      setUploadedFile(null);
                      addToLog('Removed reference file');
                    }}
                    disabled={loading}
                    className="px-4 py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              {referenceFiles.length > 0 && (
                <p className="text-xs text-green-400 mt-2">✓ File uploaded successfully</p>
              )}
            </section>

            {/* Schedule & Publish Controls */}
            <section className="bg-gray-900/70 border border-white/10 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Schedule & Publish</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-[#0b0f13] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Schedule date"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-[#0b0f13] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Schedule time"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={handlePostNow}
                  disabled={loading || items.length === 0}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    loading || items.length === 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
                  }`}
                >
                  {loading ? 'Publishing...' : '🚀 Post Now'}
                </button>
                
                <button
                  onClick={handleSchedule}
                  disabled={loading || items.length === 0}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    loading || items.length === 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                  }`}
                >
                  {loading ? 'Scheduling...' : '⏰ Schedule'}
                </button>
                
                <button
                  onClick={handleUnpublish}
                  disabled={loading || !isLive}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    loading || !isLive
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
                  }`}
                >
                  {loading ? 'Processing...' : '🔴 Unpublish'}
                </button>
              </div>
            </section>
          </div>

          {/* Right column - Preview & Activity */}
          <div className="space-y-6">
            {/* Preview Toggle */}
            <section className="bg-gray-900/70 border border-white/10 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Participant Preview</h2>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    showPreview
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                  aria-pressed={showPreview}
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>

              {showPreview && (
                <>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setPreviewMode('waiting')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        previewMode === 'waiting'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      Stay Tuned
                    </button>
                    <button
                      onClick={() => setPreviewMode('live')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        previewMode === 'live'
                          ? 'bg-green-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      Live View
                    </button>
                  </div>

                  <div className="bg-[#0b0f13] border border-white/10 rounded-lg p-4 min-h-[200px]">
                    {previewMode === 'waiting' ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-3">🔍</div>
                        <h3 className="text-xl font-bold text-white mb-2">Stay Tuned!</h3>
                        <p className="text-gray-400 text-sm">
                          The scavenger hunt will begin soon.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-bold text-white mb-3">Hunt Items</h3>
                        {items.length === 0 ? (
                          <p className="text-gray-400 text-sm">No items to display</p>
                        ) : (
                          <div className="space-y-2">
                            {items.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 bg-gray-900/50 p-3 rounded-lg"
                              >
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </span>
                                <p className="text-gray-300 text-sm">{item}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* Quick Tips */}
            <section className="bg-gray-900/70 border border-white/10 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">💡 Quick Tips</h2>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Keep items clear and concise for best mobile experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Use "Schedule" to auto-publish at a specific time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Preview shows how participants will see the hunt</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Activity log tracks all changes made on this page</span>
                </li>
              </ul>
            </section>
            {/* Activity Log */}
            <section className="bg-gray-900/70 border border-white/10 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">📋 Activity Log</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activityLog.map((log, index) => (
                  <div
                    key={index}
                    className="bg-[#0b0f13] border border-white/5 rounded-lg p-3"
                  >
                    <p className="text-sm text-white mb-1">{log.action}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span>{log.user}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Schedule Confirmation Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !loading && setShowScheduleModal(false)}
          />
          <div className="relative bg-[#1f2933] border border-white/10 rounded-xl max-w-md w-full p-6 z-60">
            <h3 className="text-2xl font-bold text-white mb-4">Confirm Schedule</h3>
            
            <div className="bg-[#0b0f13] border border-white/10 rounded-lg p-4 mb-6">
              <p className="text-gray-300 mb-2">
                <span className="font-semibold text-white">Start Time:</span>{' '}
                {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
              </p>
              <p className="text-gray-300">
                <span className="font-semibold text-white">Items:</span> {items.length}
              </p>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              The scavenger hunt will be scheduled with the specified start time. 
              Note: Cloud Function required to automatically change status from 'scheduled' to 'live'. 
              For testing, manually update the status field in Firestore console at the scheduled time.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmSchedule}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  loading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? 'Scheduling...' : 'Confirm Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScavengerControl;

/* 
TESTING NOTES:
================

1. File Upload Testing:
   - Upload a PDF/Excel file and verify it appears in Firebase Storage under scavenger_refs/
   - Check that the download URL is correctly stored in the referenceFiles array
   - Test error handling by disconnecting network during upload

2. Post Now Testing:
   - Click "Post Now" and verify document is written to Firestore at path: games/scavenger
   - Open participant page (ScavengerGame component) to verify items appear instantly
   - Check Firestore console to verify all fields: items, status: 'live', publishedAt, etc.

3. Schedule Testing:
   - Set a future date/time and click "Schedule"
   - Verify Firestore document has status: 'scheduled' and startAt timestamp
   - TO TEST LIVE TRANSITION: Manually change status from 'scheduled' to 'live' in Firestore console
   - Participant page should immediately reflect the change

4. Unpublish Testing:
   - Click "Unpublish" while hunt is live
   - Verify status changes to 'offline' in Firestore
   - Check participant page shows "Stay Tuned" message immediately

5. Reference File in Participant View:
   - After uploading and posting, check if participant page can access file URL
   - Verify URL is publicly accessible (Firebase Storage rules must allow read)

6. Edge Cases to Test:
   - Try posting with empty items list (should show alert)
   - Try uploading invalid file type
   - Test with slow network to verify upload progress bar
   - Try clicking Post Now multiple times rapidly (loading flag should prevent)
   - Upload file, then remove it before posting

7. Real-time Sync Testing:
   - Open admin control in one tab, participant view in another
   - Post/unpublish from admin, verify instant update on participant view
   - Requires Firestore real-time listener in ScavengerGame component

8. Cloud Function Setup (Future):
   - Create scheduled Cloud Function to monitor games/scavenger document
   - When status === 'scheduled' AND startAt <= now(), update status to 'live'
   - Deploy and test automated scheduling

DATA STRUCTURE IN FIRESTORE:
=============================
Document Path: games/scavenger

{
  items: string[],
  rules: string | null,
  referenceFiles: [{ name: string, url: string }],
  status: 'waiting' | 'scheduled' | 'live' | 'offline' | 'ended',
  startAt: Timestamp | null,
  publishedAt: Timestamp,
  publishedBy: string,
  scheduledBy: string (if scheduled),
  unpublishedAt: Timestamp (if unpublished),
  unpublishedBy: string (if unpublished),
  updatedAt: Timestamp
}
*/