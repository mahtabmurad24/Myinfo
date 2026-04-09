import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Check, X, ArrowRight, Shield, Zap, Star, Globe } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Home() {
  const [username, setUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await fetch(`/api/profile/check-username/${username}`);
        const data = await res.json();
        setIsAvailable(data.available);
      } catch (err) {
        console.error(err);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleClaim = () => {
    if (!isAvailable) return;
    if (!user) {
      navigate('/signup', { state: { username } });
    } else {
      navigate('/setup', { state: { username } });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="py-20 md:py-32 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8"
        >
          <Star className="w-4 h-4" />
          <span>The #1 Digital Profile Platform</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-6"
        >
          Your Digital Identity, <br />
          <span className="gradient-text">Professionally Crafted.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-gray-400 max-w-2xl mb-12"
        >
          Claim your unique username and build a professional profile <span className="text-blue-400 font-bold">for free</span> that showcases your work, social links, and expertise. All in one place.
        </motion.p>

        {/* Claim Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-2xl px-4"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass rounded-full p-1 flex items-center shadow-2xl border border-white/10 overflow-hidden w-full">
              <div className="flex-grow flex items-center px-2 sm:px-4 min-h-[44px] sm:min-h-[56px] min-w-0">
                <Globe className="hidden sm:block w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-gray-500 font-medium text-base sm:text-xl whitespace-nowrap shrink-0">myinfo.pro.bd/</span>
                <input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="bg-transparent border-none focus:ring-0 text-white font-medium placeholder-gray-600 flex-grow text-lg sm:text-xl px-1 min-w-0"
                />
                <div className="flex items-center gap-1 sm:gap-2 min-w-[16px] sm:min-w-[24px] justify-end shrink-0">
                  {isChecking && <div className="w-4 h-4 sm:w-4 sm:h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                  {!isChecking && isAvailable === true && <Check className="w-5 h-5 sm:w-5 sm:h-5 text-green-500" />}
                  {!isChecking && isAvailable === false && <X className="w-5 h-5 sm:w-5 sm:h-5 text-red-500" />}
                </div>
              </div>
              <button
                onClick={handleClaim}
                disabled={!isAvailable || isChecking}
                className="px-6 sm:px-12 py-4 sm:py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-full font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 text-lg sm:text-xl whitespace-nowrap shadow-lg shadow-blue-600/20 shrink-0"
              >
                Claim It
              </button>
            </div>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            {isAvailable === false && <span className="text-red-400">Username is already taken.</span>}
            {isAvailable === true && <span className="text-green-400">Username is available!</span>}
            {isAvailable === null && username.length > 0 && username.length < 3 && <span>Username must be at least 3 characters.</span>}
          </p>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: <Zap className="w-8 h-8 text-yellow-400" />,
            title: "Instant Setup",
            description: "Claim your name and have your profile ready in under 60 seconds."
          },
          {
            icon: <Shield className="w-8 h-8 text-blue-400" />,
            title: "Verified Identity",
            description: "Our admin approval process ensures high-quality, authentic profiles."
          },
          {
            icon: <Globe className="w-8 h-8 text-green-400" />,
            title: "Global Reach",
            description: "Share your professional link with anyone, anywhere in the world."
          }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass p-8 rounded-3xl glass-hover"
          >
            <div className="mb-6">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
            <p className="text-gray-400 leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
