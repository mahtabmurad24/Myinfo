import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Settings as SettingsIcon, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  Palette,
  Save,
  Facebook,
  Globe,
  Briefcase,
  FileText,
  Upload,
  Trash,
  MapPin
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Profile } from '../types';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState<{ total_visits: number, unique_devices: number } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    profession: '',
    facebook_url: '',
    portfolio_url: '',
    bio: '',
    theme: 'default',
    avatar_url: '',
    phone_number: '',
    email: '',
    website_url: '',
    instagram_url: '',
    youtube_url: '',
    telegram_url: '',
    whatsapp_number: '',
    pinterest_url: '',
    behance_url: '',
    dribbble_url: '',
    linkedin_url: '',
    twitter_url: '',
    location: '',
    custom_color: '',
    work_experience: [] as { title: string; company: string; period: string; description: string; }[],
    custom_links: [] as { label: string; url: string; }[]
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetch('/api/profile/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (!data) {
        navigate('/');
        return;
      }
      setProfile(data);
      setFormData({
        profession: data.profession || '',
        facebook_url: data.facebook_url || '',
        portfolio_url: data.portfolio_url || '',
        bio: data.bio || '',
        theme: data.theme || 'default',
        avatar_url: data.avatar_url || '',
        phone_number: data.phone_number || '',
        email: data.email || '',
        website_url: data.website_url || '',
        instagram_url: data.instagram_url || '',
        youtube_url: data.youtube_url || '',
        telegram_url: data.telegram_url || '',
        whatsapp_number: data.whatsapp_number || '',
        pinterest_url: data.pinterest_url || '',
        behance_url: data.behance_url || '',
        dribbble_url: data.dribbble_url || '',
        linkedin_url: data.linkedin_url || '',
        twitter_url: data.twitter_url || '',
        location: data.location || '',
        custom_color: data.custom_color || '#3b82f6',
        work_experience: Array.isArray(data.work_experience) ? data.work_experience : (typeof data.work_experience === 'string' ? JSON.parse(data.work_experience) : []),
        custom_links: Array.isArray(data.custom_links) ? data.custom_links : (typeof data.custom_links === 'string' ? JSON.parse(data.custom_links) : [])
      });

      // Fetch stats
      fetch('/api/profile/me/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(setStats)
      .catch(console.error);
    })
    .catch(console.error)
    .finally(() => setIsLoading(false));
  }, [user, token, navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setProfile(data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const addWorkExperience = () => {
    setFormData({
      ...formData,
      work_experience: [...formData.work_experience, { title: '', company: '', period: '', description: '' }]
    });
  };

  const removeWorkExperience = (index: number) => {
    const newExp = [...formData.work_experience];
    newExp.splice(index, 1);
    setFormData({ ...formData, work_experience: newExp });
  };

  const updateWorkExperience = (index: number, field: string, value: string) => {
    const newExp = [...formData.work_experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setFormData({ ...formData, work_experience: newExp });
  };

  const addCustomLink = () => {
    setFormData({
      ...formData,
      custom_links: [...formData.custom_links, { label: '', url: '' }]
    });
  };

  const removeCustomLink = (index: number) => {
    const newLinks = [...formData.custom_links];
    newLinks.splice(index, 1);
    setFormData({ ...formData, custom_links: newLinks });
  };

  const updateCustomLink = (index: number, field: string, value: string) => {
    const newLinks = [...formData.custom_links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, custom_links: newLinks });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, avatar_url: data.url }));
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null;

  const statusConfig = {
    pending: { icon: <Clock className="w-5 h-5" />, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pending Approval' },
    approved: { icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Approved' },
    hold: { icon: <AlertCircle className="w-5 h-5" />, color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'On Hold' },
    canceled: { icon: <XCircle className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Canceled' },
    suspended: { icon: <XCircle className="w-5 h-5" />, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Suspended' }
  };

  const currentStatus = statusConfig[profile.status as keyof typeof statusConfig];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Status & Info */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-6 rounded-3xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  profile.username[0].toUpperCase()
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">@{profile.username}</h2>
                <p className="text-gray-500 text-sm">{user?.email}</p>
              </div>
            </div>

            <div className={cn("flex items-center gap-3 p-4 rounded-2xl mb-4", currentStatus.bg, currentStatus.color)}>
              {currentStatus.icon}
              <span className="font-bold">{currentStatus.label}</span>
            </div>

            {profile.admin_message && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-gray-400">
                <p className="font-bold text-gray-300 mb-1">Admin Message:</p>
                {profile.admin_message}
              </div>
            )}

            {/* Profile Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-4 rounded-2xl text-center">
                <div className="text-2xl font-bold text-blue-400">{stats?.total_visits || 0}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Visits</div>
              </div>
              <div className="glass p-4 rounded-2xl text-center">
                <div className="text-2xl font-bold text-purple-400">{stats?.unique_devices || 0}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Unique Devices</div>
              </div>
            </div>

            {profile.status === 'approved' && (
              <a 
                href={`/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold transition-all"
              >
                View Live Profile <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </motion.div>

          {profile.status === 'approved' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-6 rounded-3xl"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" /> Theme Selection
              </h3>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {(['default', 'purple', 'pink', 'green', 'yellow'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: t, custom_color: '' })}
                    className={cn(
                      "w-full aspect-square rounded-lg border-2 transition-all",
                      t === 'default' ? "bg-blue-500" : 
                      t === 'purple' ? "bg-purple-500" :
                      t === 'pink' ? "bg-pink-500" :
                      t === 'green' ? "bg-green-500" : "bg-yellow-500",
                      formData.theme === t && !formData.custom_color ? "border-white scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
                    )}
                  />
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Custom Theme Color (Hex)</label>
                <div className="relative">
                  <Palette className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    disabled={profile.status !== 'approved'}
                    value={formData.custom_color}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ 
                        ...formData, 
                        custom_color: val,
                        theme: val ? '' : 'default' 
                      });
                    }}
                    placeholder="#3b82f6"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 italic">Entering a hex code will override the selected theme.</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Edit Profile */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-3xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-blue-400" /> 
                {profile.status === 'approved' ? 'Manage Profile' : 'Profile Details'}
              </h2>
              {profile.status === 'approved' && (
                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-wider">Unlocked</span>
              )}
            </div>

            {message.text && (
              <div className={cn(
                "mb-6 p-4 rounded-xl flex items-center gap-3 text-sm",
                message.type === 'success' ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"
              )}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-300 border-b border-white/10 pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Profile Avatar</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
                        {formData.avatar_url ? (
                          <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                            disabled={profile.status !== 'approved'}
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-gray-500 text-center italic">Click "Save Changes" below after uploading.</p>
                        {formData.avatar_url && profile.status === 'approved' && (
                          <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, avatar_url: '' })}
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
                        disabled={profile.status !== 'approved'}
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="tel"
                        disabled={profile.status !== 'approved'}
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="+8801234567890"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Public Email</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        disabled={profile.status !== 'approved'}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        disabled={profile.status !== 'approved'}
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="City, Country"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Bio / Description</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                    <textarea
                      disabled={profile.status !== 'approved'}
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 resize-none"
                      placeholder="Tell the world about yourself..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-300 border-b border-white/10 pb-2">Social & Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Facebook URL</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                        <img src="https://cdn.simpleicons.org/facebook/1877F2" alt="FB" className="w-full h-full" referrerPolicy="no-referrer" />
                      </div>
                      <input
                        type="url"
                        disabled={profile.status !== 'approved'}
                        value={formData.facebook_url}
                        onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Instagram URL</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                        <img src="https://cdn.simpleicons.org/instagram/E4405F" alt="IG" className="w-full h-full" referrerPolicy="no-referrer" />
                      </div>
                      <input
                        type="url"
                        disabled={profile.status !== 'approved'}
                        value={formData.instagram_url}
                        onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">YouTube URL</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                        <img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YT" className="w-full h-full" referrerPolicy="no-referrer" />
                      </div>
                      <input
                        type="url"
                        disabled={profile.status !== 'approved'}
                        value={formData.youtube_url}
                        onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Website URL</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="url"
                        disabled={profile.status !== 'approved'}
                        value={formData.website_url}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Telegram URL</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                        <img src="https://cdn.simpleicons.org/telegram/26A6E1" alt="TG" className="w-full h-full" referrerPolicy="no-referrer" />
                      </div>
                      <input
                        type="url"
                        disabled={profile.status !== 'approved'}
                        value={formData.telegram_url}
                        onChange={(e) => setFormData({ ...formData, telegram_url: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">WhatsApp Number</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                        <img src="https://cdn.simpleicons.org/whatsapp/25D366" alt="WA" className="w-full h-full" referrerPolicy="no-referrer" />
                      </div>
                      <input
                        type="text"
                        disabled={profile.status !== 'approved'}
                        value={formData.whatsapp_number}
                        onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                        placeholder="+8801234567890"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">LinkedIn URL</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0,0,256,256" className="w-full h-full">
                          <g fill="#ffffff" fillRule="nonzero" stroke="none" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" strokeDasharray="" strokeDashoffset="0" fontFamily="none" fontWeight="none" fontSize="none" textAnchor="none" style={{ mixBlendMode: 'normal' }}>
                            <g transform="scale(5.12,5.12)">
                              <path d="M41,4h-32c-2.76,0 -5,2.24 -5,5v32c0,2.76 2.24,5 5,5h32c2.76,0 5,-2.24 5,-5v-32c0,-2.76 -2.24,-5 -5,-5zM17,20v19h-6v-19zM11,14.47c0,-1.4 1.2,-2.47 3,-2.47c1.8,0 2.93,1.07 3,2.47c0,1.4 -1.12,2.53 -3,2.53c-1.8,0 -3,-1.13 -3,-2.53zM39,39h-6c0,0 0,-9.26 0,-10c0,-2 -1,-4 -3.5,-4.04h-0.08c-2.42,0 -3.42,2.06 -3.42,4.04c0,0.91 0,10 0,10h-6v-19h6v2.56c0,0 1.93,-2.56 5.81,-2.56c3.97,0 7.19,2.73 7.19,8.26z"></path>
                            </g>
                          </g>
                        </svg>
                      </div>
                      <input
                        type="url"
                        disabled={profile.status !== 'approved'}
                        value={formData.linkedin_url}
                        onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Twitter (X) URL</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                        <img src="https://cdn.simpleicons.org/x/FFFFFF" alt="TW" className="w-full h-full" referrerPolicy="no-referrer" />
                      </div>
                      <input
                        type="url"
                        disabled={profile.status !== 'approved'}
                        value={formData.twitter_url}
                        onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Pinterest URL</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                        <img src="https://cdn.simpleicons.org/pinterest/BD081C" alt="PN" className="w-full h-full" referrerPolicy="no-referrer" />
                      </div>
                      <input
                        type="url"
                        disabled={profile.status !== 'approved'}
                        value={formData.pinterest_url}
                        onChange={(e) => setFormData({ ...formData, pinterest_url: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Behance URL</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                        <img src="https://cdn.simpleicons.org/behance/0057FF" alt="BE" className="w-full h-full" referrerPolicy="no-referrer" />
                      </div>
                      <input
                        type="url"
                        disabled={profile.status !== 'approved'}
                        value={formData.behance_url}
                        onChange={(e) => setFormData({ ...formData, behance_url: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Dribbble URL</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                        <img src="https://cdn.simpleicons.org/dribbble/EA4C89" alt="DR" className="w-full h-full" referrerPolicy="no-referrer" />
                      </div>
                      <input
                        type="url"
                        disabled={profile.status !== 'approved'}
                        value={formData.dribbble_url}
                        onChange={(e) => setFormData({ ...formData, dribbble_url: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="text-lg font-bold text-gray-300">Career & Ventures</h3>
                  {profile.status === 'approved' && (
                    <button
                      type="button"
                      onClick={addWorkExperience}
                      className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      + Add Experience
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {formData.work_experience.map((exp, index) => (
                    <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative">
                      {profile.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => removeWorkExperience(index)}
                          className="absolute top-4 right-4 text-red-400 hover:text-red-300"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          placeholder="Job Title"
                          disabled={profile.status !== 'approved'}
                          value={exp.title}
                          onChange={(e) => updateWorkExperience(index, 'title', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          disabled={profile.status !== 'approved'}
                          value={exp.company}
                          onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                        />
                        <input
                          type="text"
                          placeholder="Period (e.g. Jan 2026 — Present)"
                          disabled={profile.status !== 'approved'}
                          value={exp.period || ''}
                          onChange={(e) => updateWorkExperience(index, 'period', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                        />
                      </div>
                      <textarea
                        placeholder="Description"
                        rows={2}
                        disabled={profile.status !== 'approved'}
                        value={exp.description}
                        onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 resize-none"
                      />
                    </div>
                  ))}
                  {formData.work_experience.length === 0 && (
                    <p className="text-center text-gray-500 py-4 italic">No work experience added yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="text-lg font-bold text-gray-300">Custom Links</h3>
                  {profile.status === 'approved' && (
                    <button
                      type="button"
                      onClick={addCustomLink}
                      className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      + Add Link
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {formData.custom_links.map((link, index) => (
                    <div key={index} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row gap-4 relative">
                      {profile.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => removeCustomLink(index)}
                          className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                      <div className="flex-grow">
                        <input
                          type="text"
                          placeholder="Label (e.g. My Blog)"
                          disabled={profile.status !== 'approved'}
                          value={link.label}
                          onChange={(e) => updateCustomLink(index, 'label', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                        />
                      </div>
                      <div className="flex-[2]">
                        <input
                          type="url"
                          placeholder="URL"
                          disabled={profile.status !== 'approved'}
                          value={link.url}
                          onChange={(e) => updateCustomLink(index, 'url', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>
                  ))}
                  {formData.custom_links.length === 0 && (
                    <p className="text-center text-gray-500 py-4 italic">No custom links added yet.</p>
                  )}
                </div>
              </div>

              {profile.status === 'approved' && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Changes'} <Save className="w-5 h-5" />
                </button>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
