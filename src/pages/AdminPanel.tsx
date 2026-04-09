import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ClipboardList, 
  Settings as SettingsIcon, 
  Check, 
  X, 
  Pause, 
  Trash2, 
  ExternalLink,
  Search,
  Globe,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Trash,
  Copy
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Profile, User, Settings } from '../types';
import { cn } from '../lib/utils';

export default function AdminPanel() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'settings' | 'analytics'>('requests');
  const [requests, setRequests] = useState<Profile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<{ global: { total_visits: number, unique_devices: number }, profiles: any[] } | null>(null);
  const [bypassCode, setBypassCode] = useState<{ code: string, uses: number, max_uses: number } | null>(null);
  const [settings, setSettings] = useState<any>({ 
    demo_profile_url: '', 
    logo_url: '',
    signup_enabled: 'true',
    daily_signup_limit: '0'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState<{ type: string, profileId?: number, userId?: number } | null>(null);
  const [adminMsg, setAdminMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: number, step: number, code: string }>({ userId: 0, step: 0, code: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [reqsRes, usersRes, settingsRes, statsRes, bypassRes] = await Promise.all([
        fetch('/api/admin/requests', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/settings'),
        fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/bypass-code', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (!reqsRes.ok) {
        const errorData = await reqsRes.json().catch(() => ({ error: 'Failed to fetch requests' }));
        throw new Error(errorData.error || 'Failed to fetch requests');
      }
      if (!usersRes.ok) {
        const errorData = await usersRes.json().catch(() => ({ error: 'Failed to fetch users' }));
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      if (!settingsRes.ok) {
        const errorData = await settingsRes.json().catch(() => ({ error: 'Failed to fetch settings' }));
        throw new Error(errorData.error || 'Failed to fetch settings');
      }

      const reqsData = await reqsRes.json();
      const usersData = await usersRes.json();
      const settingsData = await settingsRes.json();
      const statsData = statsRes.ok ? await statsRes.json() : null;
      const bypassData = bypassRes.ok ? await bypassRes.json() : null;

      setRequests(Array.isArray(reqsData) ? reqsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setSettings(settingsData);
      setStats(statsData);
      setBypassCode(bypassData);
    } catch (err: any) {
      console.error('AdminPanel fetchData error:', err);
      if (!silent) {
        alert(err.message === 'Failed to fetch' ? 'Server connection failed. Please try again.' : `Error: ${err.message}`);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (profileId: number, status: string) => {
    if ((status === 'hold' || status === 'canceled' || status === 'suspended') && !adminMsg) {
      setModal({ type: status, profileId });
      return;
    }

    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          profileId: Number(profileId), 
          status, 
          message: status === 'approved' ? '' : adminMsg 
        }),
      });
      
      if (res.ok) {
        setModal(null);
        setAdminMsg('');
        // Optimistic update
        setRequests(prev => prev.map(r => r.id === profileId ? { ...r, status: status as any } : r));
        await fetchData(true);
      } else {
        const text = await res.text();
        let errorMessage = 'Failed to update status';
        try {
          const data = JSON.parse(text);
          errorMessage = data.error || errorMessage;
        } catch (e) {
          errorMessage = text || errorMessage;
        }
        alert(errorMessage);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating status');
    }
  };

  const handleUserAction = async (userId: number, action: 'suspend' | 'delete') => {
    if (action === 'suspend') {
      const profile = requests.find(r => r.user_id === userId);
      if (profile) {
        setModal({ type: 'suspended', profileId: profile.id });
      }
    } else {
      setDeleteConfirm({ userId, step: 1, code: '' });
    }
  };

  const confirmDeletion = async () => {
    if (deleteConfirm.code !== '@DelU$er') {
      alert('Incorrect secret code!');
      return;
    }

    try {
      const res = await fetch(`/api/admin/user/${deleteConfirm.userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteConfirm({ userId: 0, step: 0, code: '' });
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete user');
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setShowSuccess(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(prev => ({ ...prev, logo_url: data.url }));
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed');
    }
  };

  const generateBypassCode = async () => {
    try {
      const res = await fetch('/api/admin/generate-bypass-code', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBypassCode(data);
      } else {
        alert('Failed to generate code');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating code');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('requests')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all",
              activeTab === 'requests' ? "bg-blue-600 text-white" : "glass text-gray-400 hover:bg-white/10"
            )}
          >
            <ClipboardList className="w-5 h-5" /> Requests
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all",
              activeTab === 'users' ? "bg-blue-600 text-white" : "glass text-gray-400 hover:bg-white/10"
            )}
          >
            <Users className="w-5 h-5" /> Users
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all",
              activeTab === 'analytics' ? "bg-blue-600 text-white" : "glass text-gray-400 hover:bg-white/10"
            )}
          >
            <Globe className="w-5 h-5" /> Analytics
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all",
              activeTab === 'settings' ? "bg-blue-600 text-white" : "glass text-gray-400 hover:bg-white/10"
            )}
          >
            <SettingsIcon className="w-5 h-5" /> Settings
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow">
          {activeTab === 'requests' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <h2 className="text-xl font-bold">Profile Requests</h2>
                <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold">
                  {requests.filter(r => r.status === 'pending').length} Pending
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-sm border-b border-white/10">
                      <th className="px-6 py-4 font-medium uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider">Username</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-200">{req.user_email}</div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{new Date(req.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-mono">@{req.username}</span>
                            {(req.facebook_url || req.portfolio_url) && (
                              <div className="flex gap-1">
                                {req.facebook_url && <a href={req.facebook_url} target="_blank" className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-blue-400 transition-all"><Globe className="w-3 h-3" /></a>}
                                {req.portfolio_url && <a href={req.portfolio_url} target="_blank" className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-blue-400 transition-all"><ExternalLink className="w-3 h-3" /></a>}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                            req.status === 'pending' ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" :
                            req.status === 'approved' ? "bg-green-400/10 text-green-400 border-green-400/20" :
                            req.status === 'hold' ? "bg-orange-400/10 text-orange-400 border-orange-400/20" : "bg-red-400/10 text-red-400 border-red-400/20"
                          )}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                            {req.status === 'pending' && (
                              <>
                                <button 
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); handleStatusUpdate(req.id, 'approved'); }} 
                                  className="p-2 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-lg" 
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); setModal({ type: 'hold', profileId: req.id }); }} 
                                  className="p-2 bg-orange-500/10 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-lg" 
                                  title="Hold"
                                >
                                  <Pause className="w-4 h-4" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); setModal({ type: 'canceled', profileId: req.id }); }} 
                                  className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg" 
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {req.status === 'approved' && (
                              <button 
                                onClick={() => setModal({ type: 'suspended', profileId: req.id })} 
                                className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg" 
                                title="Suspend"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <h2 className="text-xl font-bold">User Management</h2>
                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                  {users.length} Total Users
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-sm border-b border-white/10">
                      <th className="px-6 py-4 font-medium uppercase tracking-wider">User Info</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider">Profile Link</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold">
                              {u.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-200">{u.email}</div>
                              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Joined {new Date(u.created_at as string).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.profile_link ? (
                            <a href={`/${u.profile_link}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-medium">
                              @{u.profile_link} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : <span className="text-gray-600 text-sm italic">No active profile</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleUserAction(u.id, 'delete')}
                            disabled={u.role === 'admin'}
                            className={cn(
                              "p-2.5 rounded-xl transition-all shadow-lg opacity-0 group-hover:opacity-100",
                              u.role === 'admin' 
                                ? "bg-gray-500/10 text-gray-500 cursor-not-allowed" 
                                : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                            )}
                            title={u.role === 'admin' ? "Admin accounts cannot be deleted" : "Delete User Forever"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {/* Global Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-8 rounded-3xl text-center"
                >
                  <div className="text-4xl font-bold text-blue-400 mb-2">{stats?.global.total_visits || 0}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-[0.2em]">Total Site Visits</div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass p-8 rounded-3xl text-center"
                >
                  <div className="text-4xl font-bold text-purple-400 mb-2">{stats?.global.unique_devices || 0}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-[0.2em]">Total Unique Devices</div>
                </motion.div>
              </div>

              {/* Profile Stats Table */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-3xl overflow-hidden"
              >
                <div className="p-6 border-b border-white/10 bg-white/5">
                  <h2 className="text-xl font-bold">Per-Profile Analytics</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-gray-500 text-sm border-b border-white/10">
                        <th className="px-6 py-4 font-medium uppercase tracking-wider">Profile</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider">Profession</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-center">Visits</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-center">Unique Devices</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {stats?.profiles.map((p: any) => (
                        <tr key={p.username} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-blue-400">@{p.username}</td>
                          <td className="px-6 py-4 text-gray-400 text-sm">{p.profession || 'N/A'}</td>
                          <td className="px-6 py-4 text-center font-mono">{p.total_visits}</td>
                          <td className="px-6 py-4 text-center font-mono">{p.unique_devices}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-8 rounded-3xl max-w-2xl">
              <h2 className="text-2xl font-bold mb-8">Global Settings</h2>
              <form onSubmit={handleSettingsUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Website Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
                      {settings.logo_url ? (
                        <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-2xl font-bold text-blue-500">M</span>
                      )}
                    </div>
                    <div className="flex-grow space-y-2">
                      <label className="flex items-center justify-center gap-2 w-full bg-white/5 border border-white/10 border-dashed rounded-xl py-3 px-4 hover:bg-white/10 transition-all cursor-pointer">
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-400">Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      {settings.logo_url && (
                        <button 
                          type="button"
                          onClick={() => setSettings({ ...settings, logo_url: '' })}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash className="w-3 h-3" /> Remove logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {settings.signup_enabled === 'false' && (
                  <div className="pt-6 border-t border-white/10">
                    <h3 className="text-lg font-bold mb-4 text-orange-400">Signup Bypass System</h3>
                    <div className="glass p-6 rounded-2xl border border-orange-500/20">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1 text-center md:text-left">
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Active Bypass Code</p>
                          {bypassCode ? (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                                <span className="text-3xl font-mono font-bold text-white tracking-widest">{bypassCode.code}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(bypassCode.code)}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-blue-400"
                                  title="Copy to clipboard"
                                >
                                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                </button>
                              </div>
                              <div className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase">
                                {bypassCode.uses} / {bypassCode.max_uses} Uses
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-600 italic">No active bypass code</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={generateBypassCode}
                          className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all shadow-lg shadow-orange-900/20 flex items-center gap-2"
                        >
                          <SettingsIcon className="w-4 h-4" /> Generate New Code
                        </button>
                      </div>
                      <p className="mt-4 text-[10px] text-gray-500 italic">
                        * Generating a new code will immediately invalidate all previous codes. Each code can be used to create up to 2 accounts.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Demo Profile URL</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="url"
                      value={settings.demo_profile_url}
                      onChange={(e) => setSettings({ ...settings, demo_profile_url: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-lg font-bold mb-4 text-blue-400">Signup Controls</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Daily Signup Limit (0 = Unlimited)</label>
                      <div className="relative">
                        <SettingsIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="number"
                          min="0"
                          value={settings.daily_signup_limit}
                          onChange={(e) => setSettings({ ...settings, daily_signup_limit: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Signup Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, signup_enabled: 'true' })}
                          className={cn(
                            "py-3 px-4 rounded-xl font-bold transition-all border",
                            settings.signup_enabled === 'true' 
                              ? "bg-green-500/20 border-green-500 text-green-500" 
                              : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/10"
                          )}
                        >
                          Enabled
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, signup_enabled: 'false' })}
                          className={cn(
                            "py-3 px-4 rounded-xl font-bold transition-all border",
                            settings.signup_enabled === 'false' 
                              ? "bg-red-500/20 border-red-500 text-red-500" 
                              : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/10"
                          )}
                        >
                          Disabled
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSaving || showSuccess}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                    showSuccess ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500"
                  )}
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : showSuccess ? (
                    <>
                      <Check className="w-5 h-5" />
                      Settings Saved!
                    </>
                  ) : 'Save Settings'}
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </div>

      {/* User Deletion Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.step > 0 && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass p-8 rounded-3xl w-full max-w-md border border-red-500/30"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              
              {deleteConfirm.step === 1 && (
                <div className="text-center space-y-6">
                  <h3 className="text-2xl font-bold text-white">Dangerous Action!</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    You are about to permanently delete this user and all their associated data (profile, links, visits). This action <span className="text-red-500 font-bold underline">CANNOT BE UNDONE</span>.
                  </p>
                  <div className="flex gap-4">
                    <button onClick={() => setDeleteConfirm({ userId: 0, step: 0, code: '' })} className="flex-grow py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-all">Cancel</button>
                    <button onClick={() => setDeleteConfirm(prev => ({ ...prev, step: 2 }))} className="flex-grow py-3 rounded-xl bg-red-600 hover:bg-red-700 font-bold transition-all">I Understand</button>
                  </div>
                </div>
              )}

              {deleteConfirm.step === 2 && (
                <div className="text-center space-y-6">
                  <h3 className="text-2xl font-bold text-white">Final Confirmation</h3>
                  <p className="text-gray-400 text-sm">
                    Please enter the secret deletion code to proceed:
                  </p>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={deleteConfirm.code}
                      onChange={(e) => setDeleteConfirm(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Enter secret code..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-500 text-center font-mono"
                    />
                    <div className="flex gap-4">
                      <button onClick={() => setDeleteConfirm(prev => ({ ...prev, step: 1 }))} className="flex-grow py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-all">Back</button>
                      <button 
                        onClick={confirmDeletion}
                        disabled={deleteConfirm.code !== '@DelU$er'}
                        className="flex-grow py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all"
                      >
                        Delete Forever
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Message Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass p-8 rounded-3xl w-full max-w-md"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-orange-400" />
                Reason for {modal.type}
              </h3>
              <textarea
                required
                rows={4}
                value={adminMsg}
                onChange={(e) => setAdminMsg(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 transition-all mb-6 resize-none"
                placeholder="Enter a message for the user..."
              />
              <div className="flex gap-4">
                <button onClick={() => { setModal(null); setAdminMsg(''); }} className="flex-grow py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-all">Cancel</button>
                <button 
                  onClick={() => modal.profileId && handleStatusUpdate(modal.profileId, modal.type)}
                  className="flex-grow py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold transition-all"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
