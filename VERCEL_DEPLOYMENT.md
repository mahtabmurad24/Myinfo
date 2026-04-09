# Vercel Deployment Guide

## Overview
This project is configured for Vercel deployment with a React frontend (Vite) and Express backend.

## Current Issues & Solutions

### Issue: API returns 500 errors
**Cause**: Missing environment variables in Vercel  
**Solution**: Set environment variables as shown below

## Step-by-Step Deployment

### 1. Connect GitHub Repository to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `mahtabmurad24/MyInfo`
4. Vercel will auto-detect the configuration

### 2. Set Environment Variables in Vercel
Go to Project Settings → Environment Variables and add these variables:

```
NEON_DATABASE_URL
postgresql://neondb_owner:npg_ivl19dUAmRqo@ep-snowy-brook-an7qswun-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_SECRET
5646697a0a05f50adc602c99ba01daaa382c9fb9b3f9d99f3d9698c98dbd5c4887445cc6485b2325ff4ff5869c9c314aedec6cb3dd46ac5d298286cf07e86e1bbbe50a6da018230665dbf31bd3f6b1035d15a575aece3af9e9fb2c05a40df53d2b634204a651b2ca

GEMINI_API_KEY
(Optional - add your Google Gemini API key if using AI features)
```

⚠️ **IMPORTANT**: Store sensitive values in Vercel's secure environment variables, not in version control.

### 3. Database Setup
The application automatically creates tables on first connection:
- `users` - User accounts and auth
- `profiles` - User public profiles
- `settings` - Global app settings
- `site_visits` - Analytics
- `profile_visits` - Profile-specific analytics
- `signup_bypass_codes` - Admin bypass codes

**First Admin Account**:
- Email: `Secure@admin.com`
- Password: `donthack@admin` (Change this immediately after login!)

### 4. API Endpoints

#### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/signup-status` - Check signup availability

#### Profiles
- `GET /api/profile/check-username/:username` - Verify username availability
- `POST /api/profile/claim` - Create/claim profile
- `GET /api/profile/me` - Get user's profile
- `PUT /api/profile/update` - Update profile
- `GET /api/public/profile/:username` - Get public profile

#### File Upload
- `POST /api/upload` - Upload profile avatar

#### Admin
- `GET /api/admin/stats` - View analytics
- `GET /api/admin/requests` - View pending profile requests
- `POST /api/admin/update-status` - Approve/reject profiles
- `POST /api/admin/settings` - Update app settings
- `GET /api/settings` - Get public settings

#### Tracking
- `POST /api/track-site-visit` - Track page visits
- `POST /api/profile/:username/visit` - Track profile visits

### 5. Deployment Status
After pushing to GitHub:
1. Vercel will automatically build your project
2. Check deployment status at vercel.com
3. Your app will be available at: `https://<project-name>.vercel.app`

### 6. Build Configuration
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

These are automatically detected from `vercel.json` and `package.json`.

## Troubleshooting

### "Database not connected" error
- Verify `NEON_DATABASE_URL` is set in Vercel environment variables
- Check database connection string is correct
- Ensure SSL connections are enabled (`sslmode=require`)

### File uploads not working
- On Vercel, uploads are stored in `/tmp` (temporary)
- For persistent storage, consider integrating AWS S3 or similar

### CORS errors
- CORS is enabled for all origins (can be restricted in `server.ts`)
- Check browser console for detailed error messages

### Large chunk warning during build
- This is normal for the initial deployment
- Consider code-splitting if the bundle grows further

## Production Best Practices

1. **Change admin password** immediately after first login
2. **Backup database** regularly (check Neon console)
3. **Monitor logs** in Vercel dashboard
4. **Set up analytics** in Vercel project settings
5. **Enable HTTPS** (automatic on Vercel)
6. **Implement rate limiting** for public APIs (optional enhancement)

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Stack Information
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Neon)
- **Auth**: JWT + bcryptjs
- **Deployment**: Vercel
- **Storage**: Temporary (`/tmp` on Vercel)

## Support
- Check server logs in Vercel dashboard
- Review `.env.example` for required variables
- Check `vercel.json` for build configuration

---
Deploy and enjoy! 🚀
