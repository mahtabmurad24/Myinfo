import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Globe, 
  Briefcase, 
  Mail, 
  ExternalLink, 
  Share2,
  ArrowLeft,
  AlertCircle,
  Phone,
  CheckCircle2,
  Download,
  Clock,
  MapPin,
  Link as LinkIcon
} from 'lucide-react';
import { Profile } from '../types';
import { cn } from '../lib/utils';

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/public/profile/${username}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setProfile(data);

        // Record visit
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
          deviceId = 'dev_' + Math.random().toString(36).substring(2, 15);
          localStorage.setItem('device_id', deviceId);
        }

        fetch(`/api/profile/${username}/visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_id: deviceId })
        }).catch(console.error);
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [username]);

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-gray-500 mb-8">{error || "This profile is either inactive or doesn't exist."}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-blue-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const themeConfig = {
    default: { 
      gradient: 'from-blue-600 to-indigo-600', 
      solid: 'bg-blue-600', 
      text: 'text-blue-400', 
      border: 'border-blue-500/20',
      button: 'bg-blue-600 hover:bg-blue-700',
      icon: 'text-blue-500'
    },
    purple: { 
      gradient: 'from-purple-600 to-indigo-600', 
      solid: 'bg-purple-600', 
      text: 'text-purple-400', 
      border: 'border-purple-500/20',
      button: 'bg-purple-600 hover:bg-purple-700',
      icon: 'text-purple-500'
    },
    pink: { 
      gradient: 'from-pink-600 to-rose-600', 
      solid: 'bg-pink-600', 
      text: 'text-pink-400', 
      border: 'border-pink-500/20',
      button: 'bg-pink-600 hover:bg-pink-700',
      icon: 'text-pink-500'
    },
    green: { 
      gradient: 'from-emerald-600 to-teal-600', 
      solid: 'bg-emerald-600', 
      text: 'text-emerald-400', 
      border: 'border-emerald-500/20',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      icon: 'text-emerald-500'
    },
    yellow: { 
      gradient: 'from-yellow-500 to-orange-500', 
      solid: 'bg-yellow-500', 
      text: 'text-yellow-400', 
      border: 'border-yellow-500/20',
      button: 'bg-yellow-500 hover:bg-yellow-600',
      icon: 'text-yellow-500'
    }
  };

  const currentTheme = themeConfig[profile.theme as keyof typeof themeConfig] || themeConfig.default;
  const hasCustomColor = profile.custom_color && profile.custom_color.startsWith('#');
  
  const themeColor = hasCustomColor ? `from-[${profile.custom_color}] to-[${profile.custom_color}]` : currentTheme.gradient;
  const solidColor = hasCustomColor ? `bg-[${profile.custom_color}]` : currentTheme.solid;
  const themeTextColor = hasCustomColor ? `text-[${profile.custom_color}]` : currentTheme.text;
  const themeButtonColor = hasCustomColor ? `bg-[${profile.custom_color}] hover:opacity-90` : currentTheme.button;
  const themeIconColor = hasCustomColor ? `text-[${profile.custom_color}]` : currentTheme.icon;

  const customSolidStyle = hasCustomColor ? { backgroundColor: profile.custom_color } : {};
  const customTextStyle = hasCustomColor ? { color: profile.custom_color } : {};
  const customButtonStyle = hasCustomColor ? { backgroundColor: profile.custom_color } : {};
  const customBorderStyle = hasCustomColor ? { borderColor: `${profile.custom_color}33` } : {};

  const socialLinks = [
    { 
      id: 'facebook', 
      url: profile.facebook_url, 
      icon: <img src="https://cdn.simpleicons.org/facebook/1877F2" alt="Facebook" className="w-5 h-5" referrerPolicy="no-referrer" />, 
      label: 'Facebook', 
      bg: 'bg-[#1877F2]/10' 
    },
    { 
      id: 'instagram', 
      url: profile.instagram_url, 
      icon: <img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" className="w-5 h-5" referrerPolicy="no-referrer" />, 
      label: 'Instagram', 
      bg: 'bg-[#E4405F]/10' 
    },
    { 
      id: 'twitter', 
      url: profile.twitter_url, 
      icon: <img src="https://cdn.simpleicons.org/x/FFFFFF" alt="Twitter" className="w-5 h-5" referrerPolicy="no-referrer" />, 
      label: 'Twitter (X)', 
      bg: 'bg-white/10' 
    },
    { 
      id: 'linkedin', 
      url: profile.linkedin_url, 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0,0,256,256" className="w-5 h-5">
          <g fill="#ffffff" fillRule="nonzero" stroke="none" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" strokeDasharray="" strokeDashoffset="0" fontFamily="none" fontWeight="none" fontSize="none" textAnchor="none" style={{ mixBlendMode: 'normal' }}>
            <g transform="scale(5.12,5.12)">
              <path d="M41,4h-32c-2.76,0 -5,2.24 -5,5v32c0,2.76 2.24,5 5,5h32c2.76,0 5,-2.24 5,-5v-32c0,-2.76 -2.24,-5 -5,-5zM17,20v19h-6v-19zM11,14.47c0,-1.4 1.2,-2.47 3,-2.47c1.8,0 2.93,1.07 3,2.47c0,1.4 -1.12,2.53 -3,2.53c-1.8,0 -3,-1.13 -3,-2.53zM39,39h-6c0,0 0,-9.26 0,-10c0,-2 -1,-4 -3.5,-4.04h-0.08c-2.42,0 -3.42,2.06 -3.42,4.04c0,0.91 0,10 0,10h-6v-19h6v2.56c0,0 1.93,-2.56 5.81,-2.56c3.97,0 7.19,2.73 7.19,8.26z"></path>
            </g>
          </g>
        </svg>
      ), 
      label: 'LinkedIn', 
      bg: 'bg-[#0077B5]/10' 
    },
    { 
      id: 'youtube', 
      url: profile.youtube_url, 
      icon: <img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" className="w-5 h-5" referrerPolicy="no-referrer" />, 
      label: 'YouTube', 
      bg: 'bg-[#FF0000]/10' 
    },
    { 
      id: 'telegram', 
      url: profile.telegram_url, 
      icon: <img src="https://cdn.simpleicons.org/telegram/26A6E1" alt="Telegram" className="w-5 h-5" referrerPolicy="no-referrer" />, 
      label: 'Telegram', 
      bg: 'bg-[#26A6E1]/10' 
    },
    { 
      id: 'whatsapp', 
      url: profile.whatsapp_number ? `https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}` : null, 
      icon: <img src="https://cdn.simpleicons.org/whatsapp/25D366" alt="WhatsApp" className="w-5 h-5" referrerPolicy="no-referrer" />, 
      label: 'WhatsApp', 
      bg: 'bg-[#25D366]/10' 
    },
    { 
      id: 'website', 
      url: profile.website_url, 
      icon: <Globe className="w-5 h-5 text-[#444444]" />, 
      label: 'Website', 
      bg: 'bg-white/5' 
    },
    { 
      id: 'pinterest', 
      url: profile.pinterest_url, 
      icon: <img src="https://cdn.simpleicons.org/pinterest/BD081C" alt="Pinterest" className="w-5 h-5" referrerPolicy="no-referrer" />, 
      label: 'Pinterest', 
      bg: 'bg-[#BD081C]/10' 
    },
    { 
      id: 'behance', 
      url: profile.behance_url, 
      icon: <img src="https://cdn.simpleicons.org/behance/0057FF" alt="Behance" className="w-5 h-5" referrerPolicy="no-referrer" />, 
      label: 'Behance', 
      bg: 'bg-[#0057FF]/10' 
    },
    { 
      id: 'dribbble', 
      url: profile.dribbble_url, 
      icon: <img src="https://cdn.simpleicons.org/dribbble/EA4C89" alt="Dribbble" className="w-5 h-5" referrerPolicy="no-referrer" />, 
      label: 'Dribbble', 
      bg: 'bg-[#EA4C89]/10' 
    },
  ].filter(link => link.url);

  const customLinks = Array.isArray(profile.custom_links) ? profile.custom_links : (typeof profile.custom_links === 'string' ? JSON.parse(profile.custom_links) : []);
  const workExperience = Array.isArray(profile.work_experience) ? profile.work_experience : (typeof profile.work_experience === 'string' ? JSON.parse(profile.work_experience) : []);

  return (
    <div 
      className="min-h-screen pb-20 bg-[#050505] relative overflow-hidden"
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className={cn("absolute -top-[10%] -left-[10%] w-[70%] h-[70%] blur-[150px] opacity-20 rounded-full", solidColor)} 
          style={customSolidStyle}
        />
        <div 
          className={cn("absolute top-[20%] -right-[10%] w-[50%] h-[50%] blur-[120px] opacity-10 rounded-full", solidColor)} 
          style={customSolidStyle}
        />
        <div 
          className={cn("absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] blur-[100px] opacity-10 rounded-full", solidColor)} 
          style={customSolidStyle}
        />
      </div>

      {/* Header / Banner */}
      <div 
        className={cn("h-48 md:h-64 relative overflow-hidden", solidColor)}
        style={customSolidStyle}
      >
        {/* Glassy Particles Design */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large blurred glass shapes */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
          
          {/* Glassy Particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0,
                x: Math.random() * 100 + "%",
                y: Math.random() * 100 + "%",
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{
                y: [null, (Math.random() - 0.5) * 40 + "px"],
                x: [null, (Math.random() - 0.5) * 40 + "px"],
                opacity: [0.1, 0.4, 0.1],
                rotate: [0, 180],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 5
              }}
              className="absolute w-4 h-4 bg-white/20 backdrop-blur-md rounded-sm border border-white/10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}

          {/* Floating Glass Circles */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={`circle-${i}`}
              animate={{
                y: [0, -30, 0],
                opacity: [0.05, 0.15, 0.05],
              }}
              transition={{
                duration: 8 + Math.random() * 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 5
              }}
              className="absolute rounded-full bg-white/5 backdrop-blur-xl border border-white/5"
              style={{
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
        
        {/* Subtle Overlay for depth */}
        <div className="absolute inset-0 bg-linear-to-b from-black/10 to-transparent"></div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        <div className="relative -mt-24 text-center">
          {/* Avatar */}
          <div className="w-32 h-32 md:w-40 md:h-40 bg-[#0a0a0a] rounded-3xl p-2 mx-auto shadow-2xl overflow-hidden relative group">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={cn("w-full h-full rounded-2xl flex items-center justify-center text-4xl md:text-5xl font-bold bg-linear-to-br overflow-hidden relative z-10", themeColor)}
              style={customSolidStyle}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                profile.username[0].toUpperCase()
              )}
            </motion.div>
            {/* Animated Glow behind avatar */}
            <motion.div 
              animate={{ 
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.3, 1]
              }}
              transition={{ 
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={cn("absolute inset-0 blur-3xl opacity-60 z-0", solidColor)}
              style={customSolidStyle}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight">@{profile.username}</h1>
              <CheckCircle2 
                className={cn("w-6 h-6", themeIconColor)} 
                style={customTextStyle}
                title="Verified Identity" 
              />
            </div>
            
            <div 
              className={cn("flex items-center justify-center gap-2 font-medium mb-6", themeTextColor)}
              style={customTextStyle}
            >
              <Briefcase className="w-4 h-4" />
              {profile.profession}
            </div>

            {profile.bio && (
              <p className="text-gray-400 text-lg leading-relaxed max-w-xl mx-auto mb-8">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <a 
                href={`/api/public/profile/${profile.username}/vcard`}
                className={cn("flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg", themeButtonColor)}
                style={customButtonStyle}
              >
                <Download className="w-4 h-4" /> Save Contact
              </a>
            </div>

            {/* Contact Info Card */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  {profile.phone_number && (
                    <a href={`tel:${profile.phone_number}`} className="flex items-center gap-6 group hover:bg-white/5 p-2 -m-2 rounded-2xl transition-all">
                      <div className="w-12 h-12 rounded-full bg-[#FACC15]/10 flex items-center justify-center border border-[#FACC15]/20 group-hover:bg-[#FACC15]/20 transition-all shrink-0">
                        <Phone className="w-5 h-5 text-[#FACC15]" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-0.5">Direct Line</div>
                        <div className="text-lg font-bold text-white tracking-tight">{profile.phone_number}</div>
                      </div>
                    </a>
                  )}

                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="flex items-center gap-6 group hover:bg-white/5 p-2 -m-2 rounded-2xl transition-all">
                      <div className="w-12 h-12 rounded-full bg-[#6366F1]/10 flex items-center justify-center border border-[#6366F1]/20 group-hover:bg-[#6366F1]/20 transition-all shrink-0">
                        <Mail className="w-5 h-5 text-[#6366F1]" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-0.5">Email</div>
                        <div className="text-lg font-bold text-white tracking-tight break-all">{profile.email}</div>
                      </div>
                    </a>
                  )}

                  {profile.website_url && (
                    <a 
                      href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-6 group hover:bg-white/5 p-2 -m-2 rounded-2xl transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#EC4899]/10 flex items-center justify-center border border-[#EC4899]/20 group-hover:bg-[#EC4899]/20 transition-all shrink-0">
                        <Globe className="w-5 h-5 text-[#EC4899]" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-0.5">Website</div>
                        <div className="text-lg font-bold text-white tracking-tight break-all">{profile.website_url.replace(/^https?:\/\//, '')}</div>
                      </div>
                    </a>
                  )}

                  {profile.location && (
                    <div className="flex items-center gap-6 group hover:bg-white/5 p-2 -m-2 rounded-2xl transition-all">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all shrink-0">
                        <MapPin className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-0.5">Location</div>
                        <div className="text-lg font-bold text-white tracking-tight">{profile.location}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Social & Links Section */}
            <div className="max-w-2xl mx-auto mb-16">
              <h2 className="text-[11px] font-black tracking-[0.3em] text-gray-500 uppercase mb-8 text-center">Social & Links</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {socialLinks.filter(l => l.url).map((link) => (
                  <a 
                    key={link.id}
                    href={link.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative w-14 h-14 rounded-full bg-[#121212]/80 backdrop-blur-xl border border-white/5 flex items-center justify-center hover:bg-[#1a1a1a] hover:border-white/20 transition-all shadow-lg"
                    title={link.label}
                  >
                    <div className="w-6 h-6 flex items-center justify-center brightness-0 invert opacity-70 group-hover:opacity-100 group-hover:brightness-100 group-hover:invert-0 transition-all">
                      {link.icon}
                    </div>
                    
                    {/* Hover Label */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/90 border border-white/10 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                      {link.label}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Custom Links */}
            {customLinks.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-16">
                {customLinks.map((link: any, index: number) => (
                  <a 
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all border-dashed border-white/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5">
                        <LinkIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <span className="font-bold">{link.label}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            )}

            {/* Work Experience Section */}
            {workExperience && workExperience.length > 0 && (
              <div className="text-left max-w-2xl mx-auto mb-16 px-2 sm:px-0">
                <h2 className="text-2xl font-bold mb-8 border-b border-white/10 pb-4">Career & Ventures</h2>
                <div className="space-y-6">
                  {workExperience.map((exp: any, index: number) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group"
                    >
                      {/* Left Border Accent */}
                      <div 
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl z-10",
                          "bg-linear-to-b",
                          themeColor
                        )} 
                        style={customSolidStyle}
                      />
                      
                      <div className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 sm:p-8 pl-8 sm:pl-10 relative overflow-hidden transition-all hover:bg-[#1a1a1a]/90 hover:border-white/10 shadow-xl">
                        {/* Period Badge */}
                        {exp.period && (
                          <div className="absolute top-6 right-6 hidden sm:block">
                            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] font-black tracking-widest text-gray-300 uppercase whitespace-nowrap">
                              {exp.period}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between sm:hidden mb-2">
                            {exp.period && (
                              <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-[9px] font-black tracking-widest text-gray-400 uppercase">
                                {exp.period}
                              </div>
                            )}
                          </div>
                          
                          <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                            {exp.title}
                          </h3>
                          
                          <div 
                            className={cn("text-base sm:text-lg font-bold mb-4", themeTextColor)}
                            style={customTextStyle}
                          >
                            {exp.company}
                          </div>
                          
                          <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-medium">
                            {exp.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 flex flex-col items-center gap-8">
              <button 
                onClick={async () => {
                  const shareData = {
                    title: `${profile.name} | MyInfoPro`,
                    text: `Check out ${profile.name}'s professional profile on MyInfoPro!`,
                    url: window.location.href,
                  };

                  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                    try {
                      await navigator.share(shareData);
                    } catch (err) {
                      if ((err as Error).name !== 'AbortError') {
                        console.error('Error sharing:', err);
                      }
                    }
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl glass hover:bg-white/10 transition-all text-gray-400 hover:text-white font-bold"
              >
                <Share2 className="w-5 h-5" /> Share Profile
              </button>

              <div className="pt-12 border-t border-white/10 w-full flex flex-col items-center">
                <p className="text-gray-500 text-sm mb-4">Powered by MyInfoPro</p>
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-gray-300 transition-all"
                >
                  <Globe 
                    className={cn("w-4 h-4", themeIconColor)} 
                    style={customTextStyle}
                  /> Create your own profile
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
