import { Link } from 'react-router-dom';

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-genos font-bold mb-4 bg-white bg-clip-text text-transparent">
            Explore Games
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Join the fun! Choose a game to participate in real-time events.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Link
            to="/games/scavenger"
            className="group bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-3xl font-genos font-bold mb-3 text-center group-hover:text-blue-400 transition-colors">
              Scavenger Hunt
            </h2>
            
            <p className="text-gray-400 text-center mb-6 leading-relaxed">
              Find hidden items around the venue. Check live updates and rules as the hunt progresses.
            </p>
            
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 text-blue-400 font-medium group-hover:gap-3 transition-all">
                Play Now
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </Link>

          <Link
            to="/games/bingo"
            className="group bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-3xl font-genos font-bold mb-3 text-center group-hover:text-purple-400 transition-colors">
              Bingo Game
            </h2>
            
            <p className="text-gray-400 text-center mb-6 leading-relaxed">
              Watch numbers reveal in real-time. Track the grid and mark your card as numbers are called.
            </p>
            
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 text-purple-400 font-medium group-hover:gap-3 transition-all">
                Play Now
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Games update in real-time. Make sure you have a stable internet connection.
          </p>
        </div>
      </div>
    </div>
  );
}