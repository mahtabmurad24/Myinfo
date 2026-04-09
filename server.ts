import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const isVercel = process.env.VERCEL === '1';
const uploadsDir = isVercel ? '/tmp' : path.join(process.cwd(), 'uploads');
if (!isVercel && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const DATABASE_URL = process.env.NEON_DATABASE_URL;

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed!"));
  }
});

// Initialize database
const sql = DATABASE_URL ? postgres(DATABASE_URL, { ssl: 'require' }) : null;

async function initDb() {
  if (!sql) {
    console.warn("NEON_DATABASE_URL not found. Database features will be disabled.");
    return;
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        phone_number TEXT,
        username TEXT UNIQUE,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Ensure users table has name and phone_number columns
    await sql.unsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`);
    await sql.unsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT`);

    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username TEXT UNIQUE NOT NULL,
        facebook_url TEXT,
        portfolio_url TEXT,
        profession TEXT,
        bio TEXT,
        theme TEXT DEFAULT 'default',
        status TEXT DEFAULT 'pending', -- pending, approved, hold, canceled, suspended
        admin_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        avatar_url TEXT,
        phone_number TEXT,
        email TEXT,
        website_url TEXT,
        instagram_url TEXT,
        youtube_url TEXT,
        telegram_url TEXT,
        whatsapp_number TEXT,
        pinterest_url TEXT,
        linkedin_url TEXT,
        twitter_url TEXT,
        location TEXT,
        work_experience JSONB DEFAULT '[]'::jsonb,
        custom_links JSONB DEFAULT '[]'::jsonb
      )
    `;

    // Ensure all columns exist for older tables
    const columns = [
      { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' },
      { name: 'avatar_url', type: 'TEXT' },
      { name: 'phone_number', type: 'TEXT' },
      { name: 'email', type: 'TEXT' },
      { name: 'website_url', type: 'TEXT' },
      { name: 'instagram_url', type: 'TEXT' },
      { name: 'youtube_url', type: 'TEXT' },
      { name: 'telegram_url', type: 'TEXT' },
      { name: 'whatsapp_number', type: 'TEXT' },
      { name: 'pinterest_url', type: 'TEXT' },
      { name: 'behance_url', type: 'TEXT' },
      { name: 'dribbble_url', type: 'TEXT' },
      { name: 'linkedin_url', type: 'TEXT' },
      { name: 'twitter_url', type: 'TEXT' },
      { name: 'location', type: 'TEXT' },
      { name: 'custom_color', type: 'TEXT' },
      { name: 'work_experience', type: 'JSONB DEFAULT \'[]\'::jsonb' },
      { name: 'custom_links', type: 'JSONB DEFAULT \'[]\'::jsonb' }
    ];

    for (const col of columns) {
      try {
        await sql.unsafe(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      } catch (err) {
        console.warn(`Could not add ${col.name} column to profiles:`, err);
      }
    }

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS signup_logs (
        date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
        count INTEGER DEFAULT 0
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS profile_visits (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
        device_id TEXT,
        visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS site_visits (
        id SERIAL PRIMARY KEY,
        device_id TEXT,
        path TEXT,
        visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS signup_bypass_codes (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        uses INTEGER DEFAULT 0,
        max_uses INTEGER DEFAULT 2,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Seed admin if not exists
    await sql`DELETE FROM users WHERE email = 'demo@admin.com'`; // Remove old admin
    const adminExists = await sql`SELECT id FROM users WHERE email = 'Secure@admin.com'`;
    if (adminExists.length === 0) {
      const hashedPassword = await bcrypt.hash('donthack@admin', 10);
      await sql`INSERT INTO users (email, password, role) VALUES ('Secure@admin.com', ${hashedPassword}, 'admin')`;
    }

    // Seed default settings
    await sql`INSERT INTO settings (key, value) VALUES ('demo_profile_url', '#') ON CONFLICT (key) DO NOTHING`;
    await sql`INSERT INTO settings (key, value) VALUES ('logo_url', '') ON CONFLICT (key) DO NOTHING`;
    await sql`INSERT INTO settings (key, value) VALUES ('signup_enabled', 'true') ON CONFLICT (key) DO NOTHING`;
    await sql`INSERT INTO settings (key, value) VALUES ('daily_signup_limit', '0') ON CONFLICT (key) DO NOTHING`;

    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
}

async function startServer() {
  try {
    await initDb();

    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/uploads', express.static(uploadsDir));

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.get("/api/auth/signup-status", async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    try {
      const settings = await sql`SELECT key, value FROM settings WHERE key IN ('signup_enabled', 'daily_signup_limit')`;
      const signupEnabled = settings.find(s => s.key === 'signup_enabled')?.value === 'true';
      const dailyLimit = parseInt(settings.find(s => s.key === 'daily_signup_limit')?.value || '0');
      
      const [log] = await sql`SELECT count FROM signup_logs WHERE date = CURRENT_DATE`;
      const currentCount = log?.count || 0;
      
      const [activeBypass] = await sql`SELECT code FROM signup_bypass_codes WHERE active = TRUE AND uses < max_uses LIMIT 1`;

      res.json({
        enabled: signupEnabled,
        limit: dailyLimit,
        current: currentCount,
        remaining: dailyLimit > 0 ? Math.max(0, dailyLimit - currentCount) : null,
        bypass_required: !signupEnabled,
        has_active_bypass: !!activeBypass
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/verify-bypass", async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    const { code } = req.body;
    try {
      const [codeRecord] = await sql`
        SELECT id FROM signup_bypass_codes 
        WHERE code = ${code} AND active = TRUE AND uses < max_uses
      `;
      if (!codeRecord) {
        return res.status(403).json({ error: "Invalid or expired bypass code." });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    const { email, password, name, phone_number, bypass_code } = req.body;
    try {
      // Check signup status
      const settings = await sql`SELECT key, value FROM settings WHERE key IN ('signup_enabled', 'daily_signup_limit')`;
      const signupEnabled = settings.find(s => s.key === 'signup_enabled')?.value === 'true';
      const dailyLimit = parseInt(settings.find(s => s.key === 'daily_signup_limit')?.value || '0');

      let bypassUsed = false;

      if (!signupEnabled) {
        if (!bypass_code) {
          return res.status(403).json({ error: "Signup is currently disabled. A bypass code is required." });
        }
        
        const [codeRecord] = await sql`
          SELECT id, uses, max_uses FROM signup_bypass_codes 
          WHERE code = ${bypass_code} AND active = TRUE AND uses < max_uses
        `;

        if (!codeRecord) {
          return res.status(403).json({ error: "Invalid or expired bypass code." });
        }
        bypassUsed = true;
      }

      if (!bypassUsed && dailyLimit > 0) {
        const [log] = await sql`SELECT count FROM signup_logs WHERE date = CURRENT_DATE`;
        if (log && log.count >= dailyLimit) {
          return res.status(403).json({ error: "Daily signup limit reached." });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const [user] = await sql`
        INSERT INTO users (email, password, name, phone_number)
        VALUES (${email}, ${hashedPassword}, ${name || null}, ${phone_number || null})
        RETURNING id, email, role, name, phone_number
      `;

      if (bypassUsed) {
        await sql`UPDATE signup_bypass_codes SET uses = uses + 1 WHERE code = ${bypass_code}`;
      } else {
        // Update signup log
        await sql`
          INSERT INTO signup_logs (date, count)
          VALUES (CURRENT_DATE, 1)
          ON CONFLICT (date) DO UPDATE SET count = signup_logs.count + 1
        `;
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ token, user });
    } catch (err: any) {
      if (err.code === '23505') return res.status(400).json({ error: "Email already exists" });
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    const { email, password } = req.body;
    try {
      const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (!user) return res.status(400).json({ error: "User not found" });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: "Invalid password" });

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/verify", authenticateToken, (req: any, res) => {
    res.json(req.user);
  });

  // File Upload Route
  app.post("/api/upload", authenticateToken, upload.single('file'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Profile Routes
  app.get("/api/profile/check-username/:username", async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    const { username } = req.params;
    try {
      const [profile] = await sql`SELECT id FROM profiles WHERE username = ${username.toLowerCase()}`;
      res.json({ available: !profile });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/profile/claim", authenticateToken, async (req: any, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    const { 
      username, facebook_url, portfolio_url, profession,
      avatar_url, phone_number, email, linkedin_url, twitter_url
    } = req.body;
    const userId = req.user.id;

    try {
      // Check if user already has a profile that isn't canceled
      const [existing] = await sql`SELECT id FROM profiles WHERE user_id = ${userId} AND status != 'canceled'`;
      if (existing) return res.status(400).json({ error: "You already have an active profile request." });

      const [profile] = await sql`
        INSERT INTO profiles (
          user_id, username, facebook_url, portfolio_url, profession, status,
          avatar_url, phone_number, email, linkedin_url, twitter_url, custom_color
        )
        VALUES (
          ${userId}, ${username.toLowerCase()}, ${facebook_url}, ${portfolio_url}, ${profession}, 'pending',
          ${avatar_url}, ${phone_number}, ${email}, ${linkedin_url}, ${twitter_url}, '#3b82f6'
        )
        RETURNING *
      `;
      res.json(profile);
    } catch (err: any) {
      if (err.code === '23505') return res.status(400).json({ error: "Username already taken" });
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/profile/me", authenticateToken, async (req: any, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    try {
      const [profile] = await sql`
        SELECT 
          id, user_id, username, facebook_url, portfolio_url, profession, bio, theme, status, admin_message, created_at, updated_at,
          avatar_url, phone_number, email, website_url, instagram_url, youtube_url, telegram_url, whatsapp_number, pinterest_url, behance_url, dribbble_url, linkedin_url, twitter_url, location, custom_color, work_experience, custom_links
        FROM profiles 
        WHERE user_id = ${req.user.id} 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      res.json(profile || null);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/profile/update", authenticateToken, async (req: any, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    const { 
      facebook_url, portfolio_url, profession, bio, theme,
      avatar_url, phone_number, email, website_url, instagram_url,
      youtube_url, telegram_url, whatsapp_number, pinterest_url,
      behance_url, dribbble_url, linkedin_url, twitter_url, location, custom_color, work_experience, custom_links
    } = req.body;
    try {
      const [profile] = await sql`
        UPDATE profiles 
        SET 
          facebook_url = ${facebook_url}, 
          portfolio_url = ${portfolio_url}, 
          profession = ${profession}, 
          bio = ${bio}, 
          theme = ${theme},
          avatar_url = ${avatar_url},
          phone_number = ${phone_number},
          email = ${email},
          website_url = ${website_url},
          instagram_url = ${instagram_url},
          youtube_url = ${youtube_url},
          telegram_url = ${telegram_url},
          whatsapp_number = ${whatsapp_number},
          pinterest_url = ${pinterest_url},
          behance_url = ${behance_url},
          dribbble_url = ${dribbble_url},
          linkedin_url = ${linkedin_url},
          twitter_url = ${twitter_url},
          location = ${location},
          custom_color = ${custom_color},
          work_experience = ${JSON.stringify(work_experience || [])},
          custom_links = ${JSON.stringify(custom_links || [])},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${req.user.id} AND status = 'approved'
        RETURNING *
      `;
      if (!profile) return res.status(400).json({ error: "Profile not found or not approved" });
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public Profile
  app.get("/api/public/profile/:username", async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    const { username } = req.params;
    try {
      const [profile] = await sql`
        SELECT 
          id, user_id, username, facebook_url, portfolio_url, profession, bio, theme, status, admin_message, created_at, updated_at,
          avatar_url, phone_number, email, website_url, instagram_url, youtube_url, telegram_url, whatsapp_number, pinterest_url, behance_url, dribbble_url, linkedin_url, twitter_url, location, custom_color, work_experience, custom_links
        FROM profiles 
        WHERE username = ${username.toLowerCase()} AND status = 'approved'
      `;
      if (!profile) return res.status(404).json({ error: "Profile not found or not active" });
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Profile Visits API
  app.post("/api/track-site-visit", async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    const { device_id, path } = req.body;
    try {
      await sql`INSERT INTO site_visits (device_id, path) VALUES (${device_id}, ${path})`;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Routes
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    next();
  };

  app.get("/api/admin/stats", authenticateToken, isAdmin, async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    try {
      const [globalVisits] = await sql`SELECT COUNT(*) as total FROM site_visits`;
      const [uniqueDevices] = await sql`SELECT COUNT(DISTINCT device_id) as total FROM site_visits`;
      
      const profileStats = await sql`
        SELECT 
          p.username,
          p.profession,
          COUNT(pv.id) as total_visits,
          COUNT(DISTINCT pv.device_id) as unique_devices
        FROM profiles p
        LEFT JOIN profile_visits pv ON p.id = pv.profile_id
        GROUP BY p.id, p.username, p.profession
        ORDER BY total_visits DESC
      `;

      res.json({
        global: {
          total_visits: parseInt(globalVisits.total),
          unique_devices: parseInt(uniqueDevices.total)
        },
        profiles: profileStats
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/bypass-code", authenticateToken, isAdmin, async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    try {
      const [code] = await sql`SELECT code, uses, max_uses FROM signup_bypass_codes WHERE active = TRUE ORDER BY created_at DESC LIMIT 1`;
      res.json(code || null);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/generate-bypass-code", authenticateToken, isAdmin, async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    try {
      // Deactivate all old codes
      await sql`UPDATE signup_bypass_codes SET active = FALSE`;
      
      // Generate 6 digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      const [newCode] = await sql`
        INSERT INTO signup_bypass_codes (code, max_uses)
        VALUES (${code}, 2)
        RETURNING code, uses, max_uses
      `;
      
      res.json(newCode);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/profile/:username/visit", async (req, res) => {
    if (!sql) return res.status(503).json({ error: "Database not available" });
    const { username } = req.params;
    const { device_id } = req.body;

    try {
      const [profile] = await sql`SELECT id FROM profiles WHERE username = ${username.toLowerCase()}`;
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      await sql`
        INSERT INTO profile_visits (profile_id, device_id)
        VALUES (${profile.id}, ${device_id})
      `;
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to record visit" });
    }
  });

  app.get("/api/profile/me/stats", authenticateToken, async (req: any, res: any) => {
    if (!sql) return res.status(503).json({ error: "Database not available" });
    
    try {
      const [profile] = await sql`SELECT id FROM profiles WHERE user_id = ${req.user.id}`;
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const [stats] = await sql`
        SELECT 
          COUNT(*) as total_visits,
          COUNT(DISTINCT device_id) as unique_devices
        FROM profile_visits
        WHERE profile_id = ${profile.id}
      `;

      res.json({
        total_visits: parseInt(stats.total_visits || '0'),
        unique_devices: parseInt(stats.unique_devices || '0')
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin Routes
  app.get("/api/admin/requests", authenticateToken, isAdmin, async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    try {
      const requests = await sql`
        SELECT 
          p.id, p.user_id, p.username, p.facebook_url, p.portfolio_url, p.profession, p.bio, p.theme, p.status, p.admin_message, p.created_at, p.updated_at, 
          p.avatar_url, p.phone_number, p.email, p.website_url, p.instagram_url, p.youtube_url, p.telegram_url, p.whatsapp_number, p.pinterest_url, p.behance_url, p.dribbble_url, p.linkedin_url, p.twitter_url, p.location, p.custom_color, p.work_experience, p.custom_links,
          u.email as user_email 
        FROM profiles p 
        JOIN users u ON p.user_id = u.id 
        ORDER BY p.created_at DESC
      `;
      res.json(requests);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/update-status", authenticateToken, isAdmin, async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    const { profileId, status, message } = req.body;
    try {
      const [profile] = await sql`
        UPDATE profiles 
        SET status = ${status}, admin_message = ${message}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${profileId}
        RETURNING *
      `;
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/users", authenticateToken, isAdmin, async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    try {
      const users = await sql`
        SELECT u.id, u.email, u.role, u.created_at, p.username as profile_link
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id AND p.status = 'approved'
      `;
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/user/:id", authenticateToken, isAdmin, async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    const { id } = req.params;
    try {
      // Check if user is admin
      const [userToDelete] = await sql`SELECT role FROM users WHERE id = ${id}`;
      if (!userToDelete) return res.status(404).json({ error: "User not found" });
      if (userToDelete.role === 'admin') {
        return res.status(403).json({ error: "Admin accounts cannot be deleted for security reasons." });
      }

      await sql`DELETE FROM users WHERE id = ${id}`;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/settings", async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    try {
      const settings = await sql`SELECT key, value FROM settings`;
      const settingsMap = settings.reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
      res.json(settingsMap);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/settings", authenticateToken, isAdmin, async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    const { demo_profile_url, logo_url, signup_enabled, daily_signup_limit } = req.body;
    try {
      await sql`INSERT INTO settings (key, value) VALUES ('demo_profile_url', ${demo_profile_url}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
      await sql`INSERT INTO settings (key, value) VALUES ('logo_url', ${logo_url || ''}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
      await sql`INSERT INTO settings (key, value) VALUES ('signup_enabled', ${signup_enabled || 'true'}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
      await sql`INSERT INTO settings (key, value) VALUES ('daily_signup_limit', ${daily_signup_limit || '0'}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/public/profile/:username/vcard", async (req, res) => {
    if (!sql) return res.status(500).json({ error: "Database not connected" });
    const { username } = req.params;
    try {
      const [profile] = await sql`
        SELECT username, profession, phone_number, email, website_url 
        FROM profiles 
        WHERE username = ${username.toLowerCase()} AND status = 'approved'
      `;
      if (!profile) return res.status(404).send("Profile not found");

      const vcard = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${profile.username}`,
        `TITLE:${profile.profession || ""}`,
        `TEL;TYPE=CELL:${profile.phone_number || ""}`,
        `EMAIL:${profile.email || ""}`,
        `URL:${profile.website_url || ""}`,
        "END:VCARD"
      ].join("\n");

      res.setHeader("Content-Type", "text/vcard");
      res.setHeader("Content-Disposition", `attachment; filename="${profile.username}.vcf"`);
      res.send(vcard);
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.error("Vite middleware failed to load:", viteErr);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  
  return app;
  } catch (err) {
    console.error("Failed to start server:", err);
    throw err;
  }
}

// For Vercel: Initialize app once and cache it
let appPromise: Promise<Express.Application> | null = null;

function initializeApp() {
  if (!appPromise) {
    appPromise = startServer();
  }
  return appPromise;
}

// Export handler for Vercel
export default async (req: any, res: any) => {
  try {
    const app = await initializeApp();
    app(req, res);
  } catch (error: any) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
