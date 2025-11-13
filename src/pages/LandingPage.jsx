// src/pages/LandingPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllAnnouncements } from '../firebase/queries';
import AnnouncementCard from '../components/AnnouncementCard';
import Loader from '../components/Loader';

export default function LandingPage() {
  const navigate = useNavigate();
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentAnnouncements = async () => {
      try {
        const announcements = await getAllAnnouncements();
        setRecentAnnouncements(announcements.slice(0, 3));
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentAnnouncements();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="relative">
      {/* Hero Section - Full Screen */}
      <motion.section 
        id="hero"
        className="min-h-screen flex items-center justify-center px-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="text-center max-w-4xl">
          <motion.h1 
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 md:mb-8"
            variants={itemVariants}
          >
            Researchthon 2025
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl lg:text-3xl text-gray-300 mb-10 md:mb-12"
            variants={itemVariants}
          >
            Your one-stop hub for updates, schedules, and official announcements.
          </motion.p>
          <motion.button
            onClick={() => navigate('/announcements')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 md:px-10 py-3 md:py-4 text-lg md:text-xl rounded-lg transition-all shadow-lg border-2 border-white/20 hover:border-white/40"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Announcements
          </motion.button>
          
          {/* Scroll Indicator */}
          <motion.div
            className="mt-16 md:mt-20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1,
              delay: 1.5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <svg className="w-6 h-6 md:w-8 md:h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </div>
      </motion.section>

      {/* About Section - Full Screen */}
      <motion.section 
        id="about"
        className="min-h-screen flex items-center justify-center px-4 py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeInUp}
      >
        <div className="max-w-4xl">
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 md:mb-10 text-center"
            variants={fadeInUp}
          >
            About Researchthon
          </motion.h2>
          <motion.p 
            className="text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed text-center"
            variants={fadeInUp}
          >
            Researchthon 2025 is an innovative collegiate event bringing together students, 
            researchers, and industry experts to collaborate on cutting-edge projects. 
            Over the course of this intensive program, participants will tackle real-world 
            challenges, develop groundbreaking solutions, and present their findings to a 
            panel of distinguished judges. Stay connected with all event updates, schedules, 
            and important announcements through this platform.
          </motion.p>
        </div>
      </motion.section>

      {/* Key Features Section - Full Screen */}
      <motion.section 
        id="features"
        className="min-h-screen flex items-center justify-center px-4 py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <div className="max-w-6xl w-full">
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-12 md:mb-16 text-center"
            variants={itemVariants}
          >
            Key Features
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <motion.div 
              className="bg-[var(--card-bg)] p-8 md:p-10 rounded-xl shadow-lg border border-white/5 text-center"
              variants={itemVariants}
              whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.2)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-5xl md:text-6xl mb-5 md:mb-6">📢</div>
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">
                Live Announcements
              </h3>
              <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                Get instant updates on event schedules, venue changes, and important 
                notifications as they happen.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-[var(--card-bg)] p-8 md:p-10 rounded-xl shadow-lg border border-white/5 text-center"
              variants={itemVariants}
              whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.2)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-5xl md:text-6xl mb-5 md:mb-6">📄</div>
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">
                Document Downloads
              </h3>
              <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                Access presentation slides, resource materials, and official documents 
                directly from announcements.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-[var(--card-bg)] p-8 md:p-10 rounded-xl shadow-lg border border-white/5 text-center"
              variants={itemVariants}
              whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.2)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-5xl md:text-6xl mb-5 md:mb-6">⚡</div>
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">
                Real-Time Updates
              </h3>
              <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                Stay informed with real-time posts from event organizers ensuring you 
                never miss critical information.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Recent Announcements Section */}
      <motion.section 
        id="recent"
        className="max-w-5xl mx-auto px-4 py-20 md:py-28"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
      >
        <motion.h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-10 md:mb-14 text-center"
          variants={fadeInUp}
        >
          Recent Announcements
        </motion.h2>
        {loading ? (
          <Loader />
        ) : recentAnnouncements.length > 0 ? (
          <motion.div 
            className="space-y-6 md:space-y-8"
            variants={containerVariants}
          >
            {recentAnnouncements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.1 }}
              >
                <AnnouncementCard announcement={announcement} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.p 
            className="text-center text-gray-400 text-lg"
            variants={fadeInUp}
          >
            No announcements yet. Check back soon!
          </motion.p>
        )}
        <motion.div 
          className="text-center mt-10 md:mt-12"
          variants={fadeInUp}
        >
          <motion.button
            onClick={() => navigate('/announcements')}
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 md:px-10 py-3 md:py-4 text-lg rounded-lg transition-all border-2 border-white/10 hover:border-white/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View All Announcements
          </motion.button>
        </motion.div>
      </motion.section>
    </div>
  );
}