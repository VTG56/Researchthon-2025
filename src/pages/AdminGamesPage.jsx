// src/pages/AdminGamesPage.jsx
// Add in App.jsx router: <Route path="/admin/games" element={<AdminGamesPage />} />

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminGamesPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  const games = [
    {
      id: 'scavenger',
      title: 'Scavenger Hunt',
      description: 'Manage locations, clues, and participant progress',
      icon: '🔍',
      route: '/admin/games/scavenger',
      color: 'from-purple-500/20 to-blue-500/20'
    },
    {
      id: 'bingo',
      title: 'Virtual Bingo',
      description: 'Control bingo cards, calls, and winner verification',
      icon: '🎯',
      route: '/admin/games/bingo',
      color: 'from-green-500/20 to-teal-500/20'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b0f13] py-6 md:py-8 page-fade">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
            Game Controls
          </h1>
          <p className="text-base md:text-lg text-gray-400">
            Select a game to manage
          </p>
        </header>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {games.map((game) => (
              <section
                key={game.id}
                className="group bg-gray-900/70 border border-white/10 rounded-xl p-6 md:p-8 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-white/20"
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 md:mb-6 text-3xl md:text-4xl transition-transform group-hover:scale-110`}>
                  {game.icon}
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">
                  {game.title}
                </h2>

                <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8">
                  {game.description}
                </p>

                <button
                  onClick={() => navigate(game.route)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 md:py-2.5 rounded-lg transition-colors duration-200"
                >
                  Open Controls
                </button>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminGamesPage;