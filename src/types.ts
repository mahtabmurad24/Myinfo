export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
}

export interface WorkExperience {
  title: string;
  company: string;
  period?: string;
  description: string;
}

export interface CustomLink {
  label: string;
  url: string;
}

export interface Profile {
  id: number;
  user_id: number;
  username: string;
  facebook_url: string;
  portfolio_url: string;
  profession: string;
  bio: string;
  theme: 'default' | 'purple' | 'pink' | 'green' | 'yellow';
  status: 'pending' | 'approved' | 'hold' | 'canceled' | 'suspended';
  admin_message: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  // New fields
  avatar_url?: string;
  phone_number?: string;
  email?: string;
  website_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  telegram_url?: string;
  whatsapp_number?: string;
  pinterest_url?: string;
  behance_url?: string;
  dribbble_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  location?: string;
  custom_color?: string;
  work_experience?: WorkExperience[];
  custom_links?: CustomLink[];
}

export interface Settings {
  demo_profile_url: string;
  logo_url?: string;
}
