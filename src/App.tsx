import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  LayoutDashboard, 
  LogOut, 
  Shield, 
  Coffee, 
  ExternalLink, 
  Menu, 
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings as SettingsIcon,
  Globe
} from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import { Settings, Profile } from './types';
import { cn } from './lib/utils';
import Preloader from './components/Preloader';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import AdminPanel from './pages/AdminPanel';
import PublicProfile from './pages/PublicProfile';
import CoffeeWidget from './components/CoffeeWidget';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(setSettings)
      .catch(console.error);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    ...(user ? [
      { name: 'Dashboard', path: '/dashboard' },
      ...(user.role === 'admin' ? [{ name: 'Admin', path: '/admin' }] : [])
    ] : [])
  ];

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
      <div className="glass border border-white/10 rounded-2xl px-4 sm:px-6 lg:px-8 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              {settings?.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="w-8 h-8 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
              )}
              <span className="text-xl font-bold font-display tracking-tight">MyInfo<span className="text-blue-500">Pro</span></span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link 
                key={link.path} 
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-blue-400",
                  location.pathname === link.path ? "text-blue-400" : "text-gray-400"
                )}
              >
                {link.name}
              </Link>
            ))}
            {settings?.demo_profile_url && (
              <a 
                href={settings.demo_profile_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-400 hover:text-blue-400 flex items-center gap-1"
              >
                Demo Profile <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {user ? (
              <button 
                onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all text-sm font-medium"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            ) : (
              <Link 
                to="/login"
                className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-all text-sm font-medium"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-400">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden glass border border-white/10 rounded-2xl mt-2 overflow-hidden shadow-2xl"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map(link => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-lg font-medium text-gray-300 hover:text-blue-400"
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <button 
                  onClick={() => { logout(); navigate('/'); setIsMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-lg font-medium"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              ) : (
                <Link 
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 rounded-xl bg-blue-600 text-lg font-medium"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(setSettings)
      .catch(console.error);
  }, []);

  return (
    <footer className="mt-20 border-t border-white/10 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link to="/" className="flex items-center gap-2">
            {settings?.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="w-8 h-8 rounded-lg object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
            )}
            <span className="text-xl font-bold font-display tracking-tight">MyInfoPro</span>
          </Link>
          <p className="text-gray-500 text-sm">Create your professional digital identity in seconds.</p>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-4">
          <div className="text-gray-500 text-sm text-center md:text-right">
            <p>&copy; {new Date().getFullYear()} MyInfoPro. All rights reserved.</p>
            <p>Developed by <a href="https://mahtafgfx.pro.bd" className="text-blue-400 hover:underline">mahtafgfx.pro.bd</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => {
        if (!res.ok) throw new Error('Settings fetch failed');
        return res.json();
      })
      .then(setSettings)
      .catch(err => console.error('App settings fetch error:', err));

    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const isPublicProfile = window.location.pathname !== '/' && 
    !['/login', '/signup', '/dashboard', '/setup', '/admin'].includes(window.location.pathname);

  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        {loading && !isPublicProfile && <Preloader key="preloader" logoUrl={settings?.logo_url} />}
      </AnimatePresence>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const isPublicProfile = location.pathname !== '/' && 
    !['/login', '/signup', '/dashboard', '/setup', '/admin'].includes(location.pathname);

  useEffect(() => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('device_id', deviceId);
    }

    fetch('/api/track-site-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, path: location.pathname })
    }).catch(console.error);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isPublicProfile && <Navbar />}
      {!isPublicProfile && <CoffeeWidget />}
      <main className={cn("flex-grow", !isPublicProfile && "pt-32")}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/setup" element={<ProfileSetup />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/:username" element={<PublicProfile />} />
        </Routes>
      </main>
      {!isPublicProfile && <Footer />}
    </div>
  );
}
