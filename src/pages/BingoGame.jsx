// src/pages/BingoGame.jsx
import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/client';

/**
 * BingoGame - Participant-facing real-time Bingo/Housie page
 * 
 * Features:
 * - Real-time display of revealed numbers
 * - Countdown timer (10s → 0) that resets on each new number
 * - Sound effects on new numbers
 */
export default function BingoGame() {
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [countdown, setCountdown] = useState(10);
  
  const audioRef = useRef(null);
  const mountedRef = useRef(true);
  const prevCountRef = useRef(0);
  const lastRevealTimeRef = useRef(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/ding1.mp3');
    audioRef.current.volume = 0.5;
    return () => {
      audioRef.current = null;
    };
  }, []);

  // Enable audio on first interaction
  useEffect(() => {
    const enableAudio = () => {
      setAudioEnabled(true);
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };

    document.addEventListener('click', enableAudio);
    document.addEventListener('touchstart', enableAudio);

    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
  }, []);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Firestore listener
  useEffect(() => {
    const docRef = doc(db, 'games', 'bingo');
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setLoading(false);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setGameData(data);

          // Play sound on new number and reset timer
          const currentCount = data.revealedNumbers?.length || 0;
          if (currentCount > prevCountRef.current) {
            if (audioEnabled && audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            }
            // Reset countdown timer on new number
            lastRevealTimeRef.current = Date.now();
            setCountdown(10);
          }
          prevCountRef.current = currentCount;
        } else {
          setGameData(null);
        }
      },
      (error) => {
        console.error('[BingoGame] Firestore listener error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [audioEnabled]);

  // Clock ticker for both scheduled countdown and reveal countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      
      // Update countdown timer (10 → 0)
      if (lastRevealTimeRef.current && gameData?.status === 'live') {
        const elapsed = Math.floor((Date.now() - lastRevealTimeRef.current) / 1000);
        const remaining = Math.max(0, 10 - elapsed); // Count down from 10
        setCountdown(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameData?.status]);

  // Calculate time until scheduled start
  useEffect(() => {
    if (gameData?.status === 'scheduled' && gameData?.startAt) {
      const startMs = gameData.startAt.toMillis();
      const remaining = Math.max(0, startMs - now);
      
      if (remaining > 0) {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        setTimeLeft({
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0'),
          seconds: String(seconds).padStart(2, '0'),
          total: remaining
        });
      } else {
        setTimeLeft(null);
      }
    } else {
      setTimeLeft(null);
    }
  }, [gameData, now]);

  const formatStartTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const generateNumberGrid = () => {
    const total = gameData?.totalNumbers || 25;
    const numbers = [];
    for (let i = 1; i <= total; i++) {
      numbers.push(i);
    }
    return numbers;
  };

  const isNumberRevealed = (number) => {
    return gameData?.revealedNumbers?.includes(number);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading bingo game...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-900/50 border border-white/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-genos font-bold mb-2">No Bingo Game Yet</h2>
              <p className="text-white/60 max-w-md">
                Bingo game will appear here when released.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameData.status === 'waiting') {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center animate-pulse">
                <svg className="w-12 h-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-genos font-bold mb-2">Bingo Starting Soon</h2>
              <p className="text-white/70 text-lg">
                The bingo event will be held on 16th. Stay tuned!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameData.status === 'scheduled') {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-gray-900/80 border border-white/10 rounded-xl p-8 md:p-12 max-w-2xl w-full">
              <div className="text-center mb-8">
                <h1 className="text-5xl md:text-5xl font-genos font-bold mb-2">VIRTUAL BINGO</h1>
                <span className="inline-block px-4 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
                  Scheduled
                </span>
              </div>

              {timeLeft && timeLeft.total > 0 && (
                <div className="mb-8">
                  <p className="text-white/60 text-center mb-4">Starts in</p>
                  <div className="flex justify-center gap-4">
                    <div className="text-center">
                      <div className="bg-gray-800/50 border border-white/10 rounded-lg px-6 py-4 min-w-[80px]">
                        <div className="text-4xl font-genos font-bold animate-pulse">{timeLeft.hours}</div>
                        <div className="text-xs text-white/50 mt-1">HOURS</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="bg-gray-800/50 border border-white/10 rounded-lg px-6 py-4 min-w-[80px]">
                        <div className="text-4xl font-genos font-bold animate-pulse">{timeLeft.minutes}</div>
                        <div className="text-xs text-white/50 mt-1">MINUTES</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="bg-gray-800/50 border border-white/10 rounded-lg px-6 py-4 min-w-[80px]">
                        <div className="text-4xl font-genos font-bold animate-pulse">{timeLeft.seconds}</div>
                        <div className="text-xs text-white/50 mt-1">SECONDS</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {gameData.startAt && (
                <div className="text-center mb-6">
                  <p className="text-white/50 text-sm mb-1">Event starts</p>
                  <p className="text-white text-lg font-medium">
                    {formatStartTime(gameData.startAt)}
                  </p>
                </div>
              )}

              <div className="border-t border-white/10 pt-6 mt-6 text-center">
                <p className="text-white/70 text-sm">
                  patience, patience
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameData.status === 'live') {
    const allNumbers = generateNumberGrid();
    const revealedNumbers = gameData.revealedNumbers || [];
    const latestNumber = revealedNumbers[revealedNumbers.length - 1];
    const recentNumbers = revealedNumbers.slice(-10).reverse();

    return (
      <div className="min-h-screen bg-transparent text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h1 className="text-4xl md:text-6xl font-genos font-bold">VIRTUAL BINGO</h1>
              <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full animate-pulse">
                LIVE
              </span>
            </div>
            
            {/* Countdown Timer: 10 → 0 with smooth progress bar */}
{revealedNumbers.length > 0 && (
  <div className="mt-4 max-w-md mx-auto">
    <div className="flex items-center justify-center gap-2 text-white/70 mb-2">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm">
        Next number in: <span className={`font-bold text-2xl ${countdown === 0 ? 'text-yellow-400 animate-pulse' : 'text-blue-400'}`}>{countdown}s</span>
      </span>
    </div>
    {/* Smooth progress bar */}
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-1500 ease-linear ${countdown === 0 ? 'bg-yellow-500' : 'bg-blue-500'}`}
        style={{ width: `${((10 - countdown) / 10) * 100}%` }}
      />
    </div>
  </div>
)}
          </div>

          {latestNumber && (
            <div className="bg-gray-900/80 border border-white/10 rounded-xl p-8 mb-6 text-center">
              <p className="text-white/60 text-sm mb-2">Latest Number</p>
              <div className="text-8xl md:text-9xl font-genos font-bold text-blue-400 animate-pulse">
                {latestNumber}
              </div>
              
              {revealedNumbers.length > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <span className="text-white/40 text-sm">Previous:</span>
                  <div className="flex gap-2">
                    {revealedNumbers.slice(-4, -1).reverse().map((num, idx) => (
                      <div
                        key={idx}
                        className={`
                          px-3 py-1.5 rounded-lg font-bold transition-all
                          ${idx === 0 
                            ? 'bg-blue-500/30 text-blue-300 text-lg border border-blue-500/40' 
                            : 'bg-gray-800/60 text-white/60 text-base'
                          }
                        `}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-900/80 border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-genos font-bold mb-4 text-center">
              All Numbers ({revealedNumbers.length}/{allNumbers.length})
            </h2>
            
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {allNumbers.map((number) => {
                const revealed = isNumberRevealed(number);
                const isLatest = number === latestNumber;
                
                return (
                  <div
                    key={number}
                    className={`
                      rounded-lg py-3 flex justify-center items-center
                      text-xl font-bold transition-all duration-300
                      ${revealed 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 transform scale-105' 
                        : 'bg-gray-800 text-white/40'
                      }
                      ${isLatest ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
                      hover:scale-110
                    `}
                  >
                    {number}
                  </div>
                );
              })}
            </div>
          </div>

          {recentNumbers.length > 0 && (
            <div className="bg-gray-900/80 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-genos font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Numbers
              </h2>
              
              <div className="flex flex-wrap gap-3 justify-center">
                {recentNumbers.map((num, index) => (
                  <div
                    key={index}
                    className={`
                      px-4 py-2 rounded-lg font-bold
                      ${index === 0 
                        ? 'bg-blue-600 text-white text-2xl shadow-lg shadow-blue-500/40' 
                        : 'bg-gray-800 text-white/80 text-lg'
                      }
                      transition-all duration-300
                    `}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameData.playback?.enabled && (
            <div className="mt-6 text-center">
              <p className="text-white/40 text-xs flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                {audioEnabled ? 'Sound enabled' : 'Tap anywhere to enable sound'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameData.status === 'ended') {
    const totalRevealed = gameData.revealedNumbers?.length || 0;
    const totalNumbers = gameData.totalNumbers || 25;

    return (
      <div className="min-h-screen bg-transparent text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-genos font-bold mb-3">🎉 Bingo Complete!</h2>
              <p className="text-white/70 text-lg mb-6">
                Thank you for participating!
              </p>
              
              <div className="bg-gray-900/80 border border-white/10 rounded-xl p-6 max-w-md mx-auto">
                <p className="text-white/60 text-sm mb-2">Total Numbers Revealed</p>
                <p className="text-5xl font-genos font-bold text-blue-400">
                  {totalRevealed} / {totalNumbers}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center">
          <p className="text-white/60">Unknown bingo game status: {gameData.status}</p>
        </div>
      </div>
    </div>
  );
}