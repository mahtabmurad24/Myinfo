import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Facebook, Briefcase, Globe, Send, AlertCircle, CheckCircle2, Upload, Trash, User as UserIcon } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function ProfileSetup() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState(location.state?.username || '');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [profession, setProfession] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [publicEmail, setPublicEmail] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        // In ProfileSetup, we might not have a token yet if this is the first step,
        // but the user is usually logged in to reach this page.
        // Wait, ProfileSetup is reached AFTER signup/login.
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: uploadFormData
      });
      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if user already has a profile
    fetch('/api/profile/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.status !== 'canceled') {
        navigate('/dashboard');
      }
    });
  }, [user, token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/profile/claim', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          username, 
          facebook_url: facebookUrl, 
          portfolio_url: portfolioUrl, 
          profession,
          avatar_url: avatarUrl,
          phone_number: phoneNumber,
          email: publicEmail,
          linkedin_url: linkedinUrl,
          twitter_url: twitterUrl
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-12 rounded-3xl"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold font-display mb-4">Request Submitted!</h1>
          <p className="text-gray-400 text-lg mb-8">
            Your request for a digital profile has been submitted to the admin. Please wait for approval. You can view the status on your profile page.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">Tell us a bit about yourself to get approved.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Claimed Username</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                disabled
                value={username}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">Your profile will be at myinfo.pro.bd/{username}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Profile Avatar</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-8 h-8 text-gray-500" />
                )}
              </div>
              <div className="flex-grow space-y-2">
                <label className="flex items-center justify-center gap-2 w-full bg-white/5 border border-white/10 border-dashed rounded-xl py-3 px-4 hover:bg-white/10 transition-all cursor-pointer">
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-400">Upload Avatar</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {avatarUrl && (
                  <button 
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash className="w-3 h-3" /> Remove avatar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Profession</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                required
                placeholder="e.g. UI/UX Designer, Web Developer"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="tel"
                  placeholder="+8801234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Public Email</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={publicEmail}
                  onChange={(e) => setPublicEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Facebook URL</label>
            <div className="relative">
              <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="url"
                required
                placeholder="https://facebook.com/yourusername"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Portfolio URL</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="url"
                required
                placeholder="https://yourportfolio.com"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">LinkedIn URL (Optional)</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="url"
                placeholder="https://linkedin.com/in/yourusername"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Twitter (X) URL (Optional)</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="url"
                placeholder="https://twitter.com/yourusername"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? 'Submitting...' : 'Submit Request'} <Send className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
