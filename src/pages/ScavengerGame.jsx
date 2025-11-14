import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/client';

export default function ScavengerGame() {
  const [loading, setLoading] = useState(true);
  const [scavengerData, setScavengerData] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const docRef = doc(db, 'games', 'scavenger');
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setLoading(false);
        if (snapshot.exists()) {
          setScavengerData(snapshot.data());
        } else {
          setScavengerData(null);
        }
      },
      (error) => {
        console.error('Error listening to scavenger hunt:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scavengerData?.status === 'scheduled' && scavengerData?.startAt) {
      const startMs = scavengerData.startAt.toMillis();
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
  }, [scavengerData, now]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading scavenger hunt...</p>
        </div>
      </div>
    );
  }

  if (!scavengerData) {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-900/50 border border-white/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-genos font-bold mb-2">No Scavenger Hunt Yet</h2>
              <p className="text-white/60 max-w-md">
                Scavenger Hunt information will appear here when released.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (scavengerData.status === 'offline') {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center animate-pulse">
                <svg className="w-12 h-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-genos font-bold mb-2">Scavenger Hunt Coming Soon</h2>
              <p className="text-white/70 text-lg">
                The hunt will begin soon. Stay tuned!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (scavengerData.status === 'scheduled') {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-gray-900/70 border border-white/10 rounded-xl p-8 md:p-12 max-w-2xl w-full">
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-genos font-bold mb-2">Scavenger Hunt</h1>
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

              {scavengerData.startAt && (
                <div className="text-center mb-6">
                  <p className="text-white/50 text-sm mb-1">Event starts</p>
                  <p className="text-white text-lg font-medium">
                    {formatStartTime(scavengerData.startAt)}
                  </p>
                </div>
              )}

              {scavengerData.rules && (
                <div className="border-t border-white/10 pt-6 mt-6">
                  <h3 className="text-lg font-genos font-bold mb-3 text-white/90">Rules Preview</h3>
                  <p className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">
                    {scavengerData.rules}
                  </p>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-white/40 text-sm">
                  Note: Admin must activate the hunt manually when ready
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (scavengerData.status === 'live') {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8 transition-opacity duration-500">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h1 className="text-4xl md:text-5xl font-genos font-bold">Scavenger Hunt</h1>
              <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-white/70 text-lg">Find as many items as possible</p>
          </div>

          {scavengerData.rules && (
            <div className="bg-gray-900/70 border border-white/10 rounded-xl p-6 mb-6 transition-opacity duration-500">
              <h2 className="text-xl font-genos font-bold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Rules
              </h2>
              <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                {scavengerData.rules}
              </p>
            </div>
          )}

          {scavengerData.items && scavengerData.items.length > 0 ? (
            <div className="bg-gray-900/70 border border-white/10 rounded-xl p-6 transition-opacity duration-500">
              <h2 className="text-2xl font-genos font-bold mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Items to Find ({scavengerData.items.length})
              </h2>
              
              <div className="space-y-3">
                {scavengerData.items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 border border-white/10 rounded-lg p-4 flex items-start gap-4 hover:bg-gray-800/70 transition-colors duration-200"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-lg leading-relaxed">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/70 border border-white/10 rounded-xl p-8 text-center">
              <p className="text-white/60">No items have been added to the scavenger hunt yet.</p>
            </div>
          )}

          {scavengerData.referenceFiles && scavengerData.referenceFiles.length > 0 && (
            <div className="bg-gray-900/70 border border-white/10 rounded-xl p-6 mt-6 transition-opacity duration-500">
              <h2 className="text-xl font-genos font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Reference Material
              </h2>
              
              <div className="space-y-2">
                {scavengerData.referenceFiles.map((file, index) => (
                  <a
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-800/50 border border-white/10 rounded-lg p-4 hover:bg-gray-800/70 hover:border-blue-500/30 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-white group-hover:text-blue-400 transition-colors">{file.name}</p>
                        <p className="text-white/50 text-sm">Click to download</p>
                      </div>
                      <svg className="w-5 h-5 text-white/40 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (scavengerData.status === 'ended') {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-genos font-bold mb-3">Scavenger Hunt Closed</h2>
              <p className="text-white/70 text-lg mb-6">
                Thank you for participating!
              </p>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping absolute" style={{ animationDelay: '0.2s', left: '40%' }}></div>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-ping absolute" style={{ animationDelay: '0.4s', right: '40%' }}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-ping absolute" style={{ animationDelay: '0.6s', bottom: '20%' }}></div>
                </div>
              </div>
              
              {scavengerData.items && scavengerData.items.length > 0 && (
                <p className="text-white/50 text-sm mt-6">
                  {scavengerData.items.length} items were in the hunt
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-white/60">Unknown scavenger hunt status: {scavengerData.status}</p>
        </div>
      </div>
    </div>
  );
}