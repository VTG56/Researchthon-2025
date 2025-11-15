import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function GamesPage() {
  const [expandedCard, setExpandedCard] = useState(null);

  const toggleCard = (cardId) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-genos font-bold mb-3 md:mb-4 bg-white bg-clip-text text-transparent">
            Explore Games
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4">
            Join the fun! Choose a game to participate in real-time events.
          </p>
        </div>

        {/* Games Section - Detailed game cards */}
        <section id="games" className="mb-12 md:mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              
              {/* Chaos Collector Card */}
              <article className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
                <div className="flex items-center justify-center mb-4 md:mb-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-genos font-bold mb-2 text-center">
                  🌀Chaos Collector🌀
                </h2>
                <p className="text-blue-400 text-center mb-4 md:mb-6 text-sm md:text-base">
                  Get ready for a fast and fun scavenger hunt!
                </p>

                <div className="space-y-3 md:space-y-4 text-sm md:text-base">
                  <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
                    <p className="text-gray-300 mb-2 font-semibold">Quick Overview:</p>
                    <ul className="space-y-2 text-gray-400">
                      <li>• Your team has 15 minutes to find as many items as possible from the list.</li>
                      <li>• Only one unique item per list entry.</li>
                      <li>• No sharing of items between teams.</li>
                      <li>• Once you think you have the maximum items, report immediately!</li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-2 text-yellow-400 text-sm md:text-base">
                    <span>🏆</span>
                    <span className="font-semibold">Winner = Most correct items + fastest team.</span>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-sm md:text-base">
                    <p className="text-blue-300">
                      <strong>Pro tip:</strong> Feel free to dash across the campus — be quick, be clever, and stay respectful.
                    </p>
                  </div>

                  <div className="bg-gray-800/70 border border-gray-600/50 rounded-lg p-3 md:p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">📝</span>
                      <div className="flex-1">
                        <p className="text-gray-300 font-medium mb-1">Items List:</p>
                        <p className="text-orange-400 text-sm">
                          Hidden — will be published at 11:00 AM on 15 Nov 2025
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          
                        </div>
                      </div>
                    </div>
                  </div>

                  
                </div>

                <button
                  onClick={() => toggleCard('scavenger')}
                  aria-expanded={expandedCard === 'scavenger'}
                  className="mt-4 md:mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 md:py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-sm md:text-base"
                >
                  {expandedCard === 'scavenger' ? 'Hide Details' : 'View Details'}
                </button>

                {expandedCard === 'scavenger' && (
                  <div className="mt-4 p-4 bg-gray-800/70 rounded-lg text-sm space-y-2">
                    <p className="text-gray-300 font-semibold mb-2">Full Guidelines:</p>
                    <p className="text-gray-400">
                      Teams will receive a list of items to find around the campus. You'll have exactly 15 minutes from the start signal. Items must be physical objects you can bring to the collection point. Be creative, work together, and most importantly—have fun!
                    </p>
                    <p className="text-gray-400 mt-2">
                      Remember: Safety first! No running in crowded areas, and respect all campus rules and boundaries.
                    </p>
                  </div>
                )}

                <Link
                  to="/games/scavenger"
                  className="mt-4 flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 md:py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-sm md:text-base"
                >
                  Play Now
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </article>

              {/* BINGO BLAST Card */}
              <article className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
                <div className="flex items-center justify-center mb-4 md:mb-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-genos font-bold mb-2 text-center">
                  🎉BINGO BLAST🎉
                </h2>
                <p className="text-purple-400 text-center mb-4 md:mb-6 text-sm md:text-base">
                  Just an ice-breaker session for you guys!
                </p>

                <div className="space-y-3 md:space-y-4 text-sm md:text-base">
                  <div className="bg-gray-800/50 rounded-lg p-3 md:p-4"> 
                    <p className="text-gray-300 mb-2 font-semibold">Quick Overview:</p>
                    <ul className="space-y-2 text-gray-400">
                      <li>• A random number will be generated live on our website every 10 seconds.</li>
                      <li>• Each team gets a sheet with numbers 1–99 in a 5×5 grid box.</li>
                      <li>• As numbers appear, strike them off your sheet.</li>
                      <li>• Just making sure you guys don't get bored</li>
                    </ul>
                  </div>

                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-purple-300 text-sm md:text-base">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Numbers appear live every 10 seconds</span>
                    </div>
                  </div>

                  <div className="bg-gray-800/70 border border-gray-600/50 rounded-lg p-3 md:p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">📋</span>
                      <div className="flex-1">
                        <p className="text-gray-300 font-medium mb-1">Your Game Sheet:</p>
                        <p className="text-gray-400 text-sm">
                          Each team gets a 5×5 printed sheet with numbers from 1 to 99.
                        </p>
                        
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-900/20 border border-yellow-600/40 rounded-lg p-3 text-sm">
                    <p className="text-yellow-300">
                      <strong>💡 Tip:</strong> Stay focused and cross off numbers quickly. The first team to complete wins!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleCard('bingo')}
                  aria-expanded={expandedCard === 'bingo'}
                  className="mt-4 md:mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 md:py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-sm md:text-base"
                >
                  {expandedCard === 'bingo' ? 'Hide Details' : 'View Details'}
                </button>

                {expandedCard === 'bingo' && (
                  <div className="mt-4 p-4 bg-gray-800/70 rounded-lg text-sm space-y-2">
                    <p className="text-gray-300 font-semibold mb-2">Full Guidelines:</p>
                    <p className="text-gray-400">
                      BINGO BLAST is a fast-paced icebreaker game where teams compete to be the first to mark all numbers on their grid. Watch the live number generator on our website—new numbers drop every 10 seconds!
                    </p>
                    <p className="text-gray-400 mt-2">
                      Work together as a team to track numbers quickly. When you've marked all your numbers, raise your hand immediately to claim victory!
                    </p>
                  </div>
                )}

                <Link
                  to="/games/bingo"
                  className="mt-4 flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 md:py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-sm md:text-base"
                >
                  Play Now
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </article>
            </div>
          </div>
        </section>
        {/* End Games Section */}

        <div className="mt-12 md:mt-16 text-center px-4">
          <p className="text-gray-500 text-lg md:text-lg">
            Games update in real-time. Make sure you have a stable internet connection.
          </p>
        </div>
      </div>
    </div>
  );
}