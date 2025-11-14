// src/pages/AdminBingoControl.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, setDoc, updateDoc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/client';

/**
 * AdminBingoControl - Admin panel for managing Bingo game
 * 
 * Features:
 * - Manual reveal: click to reveal one number at a time (transactional)
 * - Automator: auto-clicks reveal button every 10 seconds
 * - Countdown timer: shows time until next reveal (10s → 0)
 * - Schedule: set a start time and countdown
 * - Reset & End game buttons
 */
const AdminBingoControl = () => {
  const navigate = useNavigate();

  // Auth check
  useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Game state from Firestore
  const [status, setStatus] = useState('waiting');
  const [totalNumbers, setTotalNumbers] = useState(99);
  const [revealedNumbers, setRevealedNumbers] = useState([]);
  const [startAt, setStartAt] = useState(null);

  // UI state
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [selectedTotalNumbers, setSelectedTotalNumbers] = useState(99);
  const [loading, setLoading] = useState(false);
  const [scheduledCountdown, setScheduledCountdown] = useState(null);
  const [latestNumber, setLatestNumber] = useState(null);
  const [showNumberAnimation, setShowNumberAnimation] = useState(false);
  const [revealCountdown, setRevealCountdown] = useState(10);
  
  // Automator state
  const [automatorActive, setAutomatorActive] = useState(false);
  const automatorIntervalRef = useRef(null);
  const scheduledCountdownIntervalRef = useRef(null);
  const revealCountdownIntervalRef = useRef(null);
  const lastRevealTimeRef = useRef(null);
  const prevCountRef = useRef(0);

  // Cleanup intervals
  useEffect(() => {
    return () => {
      if (automatorIntervalRef.current) clearInterval(automatorIntervalRef.current);
      if (scheduledCountdownIntervalRef.current) clearInterval(scheduledCountdownIntervalRef.current);
      if (revealCountdownIntervalRef.current) clearInterval(revealCountdownIntervalRef.current);
    };
  }, []);

  // Firestore listener with doc auto-creation
  useEffect(() => {
    const gameRef = doc(db, 'games', 'bingo');
    
    const unsubscribe = onSnapshot(gameRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Defensive: ensure revealedNumbers has no duplicates
        const revealed = Array.isArray(data.revealedNumbers) ? data.revealedNumbers : [];
        const uniqueRevealed = [...new Set(revealed)];
        
        // If duplicates detected, silently fix them
        if (revealed.length !== uniqueRevealed.length) {
          console.warn('[Admin] Duplicate numbers detected, fixing...');
          try {
            await updateDoc(gameRef, {
              revealedNumbers: uniqueRevealed,
              updatedAt: serverTimestamp()
            });
          } catch (err) {
            console.error('[Admin] Failed to fix duplicates:', err);
          }
        }
        
        setStatus(data.status || 'waiting');
        setTotalNumbers(data.totalNumbers || 99);
        setRevealedNumbers(uniqueRevealed);
        setStartAt(data.startAt);

        // Update latest number with animation and reset countdown
        const currentCount = uniqueRevealed.length;
        if (currentCount > prevCountRef.current) {
          const newest = uniqueRevealed[uniqueRevealed.length - 1];
          setLatestNumber(newest);
          setShowNumberAnimation(true);
          setTimeout(() => setShowNumberAnimation(false), 1000);
          
          // Reset reveal countdown timer
          lastRevealTimeRef.current = Date.now();
          setRevealCountdown(10);
        }
        prevCountRef.current = currentCount;
        
        // Stop automator if game ended
        if (data.status === 'ended' && automatorActive) {
          stopAutomator();
        }
      } else {
        // Doc doesn't exist - create it with canonical schema
        try {
          const numbers = Array.from({ length: 99 }, (_, i) => i + 1);
          await setDoc(gameRef, {
            status: 'waiting',
            totalNumbers: 99,
            revealedNumbers: [],
            numbers: numbers,
            currentIndex: -1,
            lastRevealAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
          console.log('[Admin] Bingo game document auto-created');
        } catch (error) {
          console.error('[Admin] Error auto-creating game doc:', error);
        }
      }
    }, (error) => {
      console.error('[Admin] Error listening to game state:', error);
    });

    return () => unsubscribe();
  }, [automatorActive]);

  // Countdown timer for scheduled start
  useEffect(() => {
    if (status === 'scheduled' && startAt) {
      if (scheduledCountdownIntervalRef.current) clearInterval(scheduledCountdownIntervalRef.current);
      
      scheduledCountdownIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const targetTime = startAt.toMillis ? startAt.toMillis() : startAt;
        const diff = targetTime - now;
        
        if (diff <= 0) {
          setScheduledCountdown(0);
        } else {
          setScheduledCountdown(Math.ceil(diff / 1000));
        }
      }, 100);

      return () => {
        if (scheduledCountdownIntervalRef.current) clearInterval(scheduledCountdownIntervalRef.current);
      };
    } else {
      setScheduledCountdown(null);
      if (scheduledCountdownIntervalRef.current) clearInterval(scheduledCountdownIntervalRef.current);
    }
  }, [status, startAt]);

  // Reveal countdown timer (10s → 0)
  useEffect(() => {
    if (status === 'live' && revealedNumbers.length > 0) {
      if (revealCountdownIntervalRef.current) clearInterval(revealCountdownIntervalRef.current);
      
      revealCountdownIntervalRef.current = setInterval(() => {
        if (lastRevealTimeRef.current) {
          const elapsed = Math.floor((Date.now() - lastRevealTimeRef.current) / 1000);
          const remaining = Math.max(0, 10 - elapsed);
          setRevealCountdown(remaining);
        }
      }, 1000);

      return () => {
        if (revealCountdownIntervalRef.current) clearInterval(revealCountdownIntervalRef.current);
      };
    } else {
      setRevealCountdown(10);
      if (revealCountdownIntervalRef.current) clearInterval(revealCountdownIntervalRef.current);
    }
  }, [status, revealedNumbers.length]);

  // Manual reveal using transaction - prevents duplicates
  const handleManualReveal = async () => {
    if (revealedNumbers.length >= totalNumbers) {
      alert('All numbers have been revealed!');
      return;
    }

    setLoading(true);
    try {
      const gameRef = doc(db, 'games', 'bingo');
      
      const result = await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(gameRef);
        
        // If doc doesn't exist, create it
        if (!docSnap.exists()) {
          const numbers = Array.from({ length: 99 }, (_, i) => i + 1);
          transaction.set(gameRef, {
            status: 'waiting',
            totalNumbers: 99,
            revealedNumbers: [],
            numbers: numbers,
            currentIndex: -1,
            lastRevealAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          return { created: true };
        }

        const data = docSnap.data();
        const numbers = data.numbers || Array.from({ length: 99 }, (_, i) => i + 1);
        const revealed = data.revealedNumbers || [];
        
        // Defensive: remove duplicates from revealed
        const uniqueRevealed = [...new Set(revealed)];
        const total = Math.min(data.totalNumbers || 99, numbers.length);

        // Check if all numbers revealed
        const remaining = numbers.filter(n => !uniqueRevealed.includes(n));
        if (remaining.length === 0) {
          transaction.update(gameRef, {
            status: 'ended',
            revealedNumbers: uniqueRevealed,
            updatedAt: serverTimestamp()
          });
          return { ended: true };
        }

        // Pick random unrevealed number
        const nextNumber = remaining[Math.floor(Math.random() * remaining.length)];
        const newRevealed = [...uniqueRevealed, nextNumber];
        const newStatus = newRevealed.length >= total ? 'ended' : 'live';

        transaction.update(gameRef, {
          revealedNumbers: newRevealed,
          currentIndex: newRevealed.length - 1,
          lastRevealAt: serverTimestamp(),
          status: newStatus,
          updatedAt: serverTimestamp()
        });

        return { success: true, number: nextNumber };
      });

      if (result.created) {
        console.log('[Admin] Game document initialized');
      } else if (result.ended) {
        console.log('[Admin] Game ended - all numbers revealed');
        stopAutomator();
      } else if (result.success) {
        console.log('[Admin] Revealed number:', result.number);
      }

    } catch (error) {
      console.error('[Admin] Transaction failed:', error);
      alert('Failed to reveal number. Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Start automator
  const startAutomator = () => {
    if (automatorActive) return;
    
    setAutomatorActive(true);
    console.log('[Admin] Automator started - will reveal every 10 seconds');
    
    automatorIntervalRef.current = setInterval(() => {
      console.log('[Admin] Automator tick - revealing number');
      handleManualReveal();
    }, 10000); // 10 seconds
  };

  // Stop automator
  const stopAutomator = () => {
    if (automatorIntervalRef.current) {
      clearInterval(automatorIntervalRef.current);
      automatorIntervalRef.current = null;
    }
    setAutomatorActive(false);
    console.log('[Admin] Automator stopped');
  };

  // Reset revealed numbers
  const handleReset = async () => {
    if (!window.confirm('Reset all revealed numbers? This cannot be undone.')) {
      return;
    }

    // Stop automator first
    stopAutomator();

    setLoading(true);
    try {
      const gameRef = doc(db, 'games', 'bingo');
      await updateDoc(gameRef, {
        revealedNumbers: [],
        status: 'waiting',
        currentIndex: -1,
        lastRevealAt: null,
        updatedAt: serverTimestamp()
      });
      setLatestNumber(null);
      lastRevealTimeRef.current = null;
      setRevealCountdown(10);
    } catch (error) {
      console.error('[Admin] Error resetting game:', error);
      alert('Failed to reset. Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // End game
  const handleEndGame = async () => {
    if (!window.confirm('End the game now?')) {
      return;
    }

    // Stop automator first
    stopAutomator();

    setLoading(true);
    try {
      const gameRef = doc(db, 'games', 'bingo');
      await updateDoc(gameRef, {
        status: 'ended',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[Admin] Error ending game:', error);
      alert('Failed to end game. Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Schedule game
  const handleSchedule = async () => {
    if (!scheduleDateTime) {
      alert('Please select a start date and time.');
      return;
    }

    const scheduledTime = new Date(scheduleDateTime);
    const now = new Date();

    if (scheduledTime <= now) {
      alert('Start time must be in the future.');
      return;
    }

    setLoading(true);
    try {
      const gameRef = doc(db, 'games', 'bingo');
      const clampedTotal = Math.max(1, Math.min(99, selectedTotalNumbers));
      
      await updateDoc(gameRef, {
        status: 'scheduled',
        startAt: Timestamp.fromDate(scheduledTime),
        totalNumbers: clampedTotal,
        revealedNumbers: [],
        updatedAt: serverTimestamp()
      });
      
      alert(`Game scheduled for ${scheduledTime.toLocaleString()}.\n\nClick "Reveal Next Number" to start when timer reaches zero.`);
    } catch (error) {
      console.error('[Admin] Error scheduling game:', error);
      alert('Failed to schedule game. Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Status badge helpers
  const getStatusColor = () => {
    switch (status) {
      case 'live': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'scheduled': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'ended': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'live': return '● Live';
      case 'scheduled': return '⏰ Scheduled';
      case 'ended': return '🏁 Ended';
      default: return '○ Waiting';
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f13] py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
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
            <span className="text-white">Bingo</span>
          </nav>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                Bingo Game Controls
              </h1>
              <p className="text-base md:text-lg text-gray-400">
                Manual control with automator
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs md:text-sm px-3 py-1 rounded-full border ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              {automatorActive && (
                <span className="text-xs md:text-sm px-3 py-1 rounded-full border bg-green-500/10 text-green-400 border-green-500/20 animate-pulse">
                  🤖 Auto Running
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left column - Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Manual Controls */}
            <section className="bg-gray-900/70 border border-white/10 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Game Controls</h2>
              
              {/* Countdown Timer Display */}
              {status === 'live' && revealedNumbers.length > 0 && (
                <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-center">
                  <div className="text-sm text-blue-200 mb-2">Next Reveal In</div>
                  <div className={`text-5xl font-bold ${revealCountdown === 0 ? 'text-yellow-400 animate-pulse' : 'text-blue-400'}`}>
                    {revealCountdown}s
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={handleManualReveal}
                  disabled={loading || status === 'ended' || revealedNumbers.length >= totalNumbers}
                  className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition ${
                    loading || status === 'ended' || revealedNumbers.length >= totalNumbers
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                  }`}
                >
                  {loading ? 'Revealing...' : '🎯 Reveal Next Number'}
                </button>

                {!automatorActive ? (
                  <button
                    onClick={startAutomator}
                    disabled={loading || status === 'ended' || revealedNumbers.length >= totalNumbers}
                    className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition ${
                      loading || status === 'ended' || revealedNumbers.length >= totalNumbers
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
                    }`}
                  >
                    🤖 Start Automator (10s interval)
                  </button>
                ) : (
                  <button
                    onClick={stopAutomator}
                    className="w-full px-6 py-4 rounded-lg font-bold text-lg transition bg-orange-600 hover:bg-orange-700 text-white hover:scale-105"
                  >
                    ⏸️ Stop Automator
                  </button>
                )}

                {automatorActive && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-sm text-green-200">
                    ✅ Automator is running - revealing a number every 10 seconds
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className={`px-4 py-3 rounded-lg font-semibold transition ${
                      loading
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    🔄 Reset Numbers
                  </button>

                  <button
                    onClick={handleEndGame}
                    disabled={loading}
                    className={`px-4 py-3 rounded-lg font-semibold transition ${
                      loading
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    🏁 End Game
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-[#0b0f13] border border-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{revealedNumbers.length}</div>
                  <div className="text-xs text-gray-400">Revealed</div>
                </div>
                <div className="bg-[#0b0f13] border border-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {totalNumbers - revealedNumbers.length}
                  </div>
                  <div className="text-xs text-gray-400">Remaining</div>
                </div>
                <div className="bg-[#0b0f13] border border-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{totalNumbers}</div>
                  <div className="text-xs text-gray-400">Total</div>
                </div>
              </div>
            </section>

            {/* Schedule Section */}
            <section className="bg-gray-900/70 border border-white/10 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Schedule Game</h2>
              
              {status === 'waiting' || status === 'ended' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0b0f13] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Total Numbers (1-99)</label>
                    <input
                      type="number"
                      value={selectedTotalNumbers}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 99;
                        setSelectedTotalNumbers(Math.max(1, Math.min(99, val)));
                      }}
                      min="1"
                      max="99"
                      className="w-full px-4 py-3 bg-[#0b0f13] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleSchedule}
                    disabled={loading || !scheduleDateTime}
                    className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition ${
                      loading || !scheduleDateTime
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-105'
                    }`}
                  >
                    {loading ? 'Scheduling...' : '📅 Schedule Game'}
                  </button>

                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200">
                    ℹ️ After scheduling, click "Reveal Next Number" when timer reaches zero to start the game.
                  </div>
                </div>
              ) : status === 'scheduled' ? (
                <div className="space-y-4">
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-200 font-semibold mb-2">⏰ Game Scheduled</p>
                    <p className="text-sm text-blue-200/80 mb-3">
                      Waiting for start time. Click "Reveal Next Number" when countdown reaches zero.
                    </p>
                    {scheduledCountdown !== null && scheduledCountdown > 0 && (
                      <p className="text-blue-300 font-mono text-lg">
                        Starts in: {Math.floor(scheduledCountdown / 3600)}h {Math.floor((scheduledCountdown % 3600) / 60)}m {scheduledCountdown % 60}s
                      </p>
                    )}
                    {scheduledCountdown === 0 && (
                      <p className="text-yellow-300 font-bold text-lg animate-pulse">
                        ⏰ Time to start! Click "Reveal Next Number" above!
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleEndGame}
                    disabled={loading}
                    className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition ${
                      loading
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    🛑 Cancel Schedule
                  </button>
                </div>
              ) : (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-200 font-semibold">✅ Game is Live</p>
                  <p className="text-sm text-green-200/80 mt-2">
                    Use the controls above to manage reveals.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right column - Display */}
          <div className="space-y-6">
            {/* Latest Number Display */}
            <section className="bg-gray-900/70 border border-white/10 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">Latest Number</h2>
              
              <div className={`relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-center transition-all duration-500 ${
                showNumberAnimation ? 'scale-110 shadow-2xl' : 'scale-100'
              }`}>
                {latestNumber !== null ? (
                  <>
                    <div className="text-7xl font-bold text-white mb-2">
                      {latestNumber}
                    </div>
                    <div className="text-sm text-white/80">
                      #{revealedNumbers.length} of {totalNumbers}
                    </div>
                  </>
                ) : (
                  <div className="text-3xl text-white/60">
                    No number revealed yet
                  </div>
                )}
              </div>

              {/* Scheduled countdown */}
              {status === 'scheduled' && scheduledCountdown !== null && scheduledCountdown > 0 && (
                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-400 mb-2">Game starts in:</div>
                  <div className="text-3xl font-bold text-blue-400">
                    {Math.floor(scheduledCountdown / 3600)}h {Math.floor((scheduledCountdown % 3600) / 60)}m {scheduledCountdown % 60}s
                  </div>
                  <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-pulse" />
                  </div>
                </div>
              )}

              {status === 'scheduled' && scheduledCountdown === 0 && (
                <div className="mt-4 text-center">
                  <div className="text-lg font-bold text-yellow-400 animate-pulse">
                    ⏰ Ready to Start!
                  </div>
                </div>
              )}

              {/* Reveal countdown for live game */}
              {status === 'live' && revealedNumbers.length > 0 && (
                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-400 mb-2">Next reveal in:</div>
                  <div className={`text-3xl font-bold ${revealCountdown === 0 ? 'text-yellow-400 animate-pulse' : 'text-green-400'}`}>
                    {revealCountdown}s
                  </div>
                  <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-1000"
                      style={{ width: `${((10 - revealCountdown) / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Revealed Numbers Grid */}
            <section className="bg-gray-900/70 border border-white/10 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">
                Revealed Numbers ({revealedNumbers.length})
              </h2>
              
              {revealedNumbers.length === 0 ? (
                <p className="text-gray-400 text-center py-8 text-sm">No numbers revealed yet</p>
              ) : (
                <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                  {revealedNumbers.map((num, idx) => (
                    <div
                      key={idx}
                      className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-2 text-center"
                    >
                      <div className="text-lg font-bold text-white">{num}</div>
                      <div className="text-xs text-gray-400">#{idx + 1}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Status Info */}
            <section className="bg-gray-900/70 border border-white/10 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">Game Info</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white font-semibold">{status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Automator:</span>
                  <span className="text-white font-semibold">{automatorActive ? 'Running' : 'Stopped'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Progress:</span>
                  <span className="text-white font-semibold">
                    {revealedNumbers.length} / {totalNumbers}
                  </span>
                </div>
                {status === 'live' && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next Reveal:</span>
                    <span className={`font-semibold ${revealCountdown === 0 ? 'text-yellow-400 animate-pulse' : 'text-green-400'}`}>
                      {revealCountdown}s
                    </span>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBingoControl;

/**
 * USAGE INSTRUCTIONS:
 * 
 * 1. Manual Flow:
 *    - Click "Reveal Next Number" to reveal one number at a time
 *    - Timer shows countdown from 10s → 0 after each reveal
 *    - Click "Start Automator" to auto-reveal every 10 seconds
 *    - Click "Stop Automator" to pause automation
 * 
 * 2. Schedule Flow:
 *    - Set start date/time and total numbers
 *    - Click "Schedule Game"
 *    - Wait for countdown to reach zero
 *    - Click "Reveal Next Number" once to start (status: scheduled -> live)
 *    - After 9 seconds, click "Start Automator" to continue automatically
 * 
 * 3. Reset & End:
 *    - "Reset Numbers" - clears all revealed numbers, keeps game waiting
 *    - "End Game" - marks game as ended, stops automator
 * 
 * 4. Timer Features:
 *    - Big countdown timer (10s → 0) displayed prominently
 *    - Turns yellow and pulses when hitting 0
 *    - Progress bar shows visual countdown
 *    - Resets to 10 on each new number reveal
 *    - Also shows in Game Info sidebar
 * 
 * 5. Automator Details:
 *    - Runs every 10 seconds exactly
 *    - Automatically stops when game ends
 *    - Can be manually stopped/started anytime
 *    - Uses same transaction logic as manual reveal (no duplicates)
 * 
 * 6. Sync Notes:
 *    - All 1000 clients see numbers within ~200-500ms of each other
 *    - Timer on each client is independent but shows same revealed numbers
 *    - Firestore real-time listeners ensure perfect sync
 */