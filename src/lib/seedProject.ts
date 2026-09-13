export interface TaskItem {
  order: number;
  title: string;
  description: string;
  goal: string;
  targetFiles: string[];
  evaluationCriteria: string[];
}

export interface ProjectFile {
  path: string;
  content: string;
  visible?: boolean;
  editable?: boolean;
}

export interface SeedProject {
  _id: string;
  slug: string;
  title: string;
  description: string;
  track: "frontend" | "backend" | "fullstack";
  difficulty: "beginner" | "intermediate" | "advanced";
  tasks: TaskItem[];
  files: ProjectFile[];
}

export const authSeedProject: SeedProject = {
  _id: "build-auth",
  slug: "build-auth",
  title: "Build JWT Auth with Express & Node.js",
  description:
    "Implement a complete, production-ready authentication service with salt-based password hashing, JWT token generation & validation, user registration, credential login, and protected route middleware.",
  track: "backend",
  difficulty: "intermediate",
  tasks: [
    {
      order: 1,
      title: "Define User Model & Password Hashing",
      description:
        "Implement secure password hashing in the User model using salt rounds. Ensure passwords are never stored in plain text and provide a method to compare plain passwords with hashes.",
      goal: "Hash passwords securely using cryptographic salt before persisting user records.",
      targetFiles: ["src/models/User.js"],
      evaluationCriteria: [
        "User schema defines name, email, and passwordHash fields",
        "hashPassword function encrypts plain passwords with salt",
        "comparePassword function accurately validates matched and mismatched passwords",
        "Plain text passwords are never stored or returned in responses",
      ],
    },
    {
      order: 2,
      title: "Implement Registration & Login Routes",
      description:
        "Build the controller and route handlers for POST /api/auth/register and POST /api/auth/login. Verify incoming credentials and issue signed JWT access tokens.",
      goal: "Create registration and login endpoints returning JWT tokens on success.",
      targetFiles: ["src/controllers/authController.js", "src/routes/auth.js"],
      evaluationCriteria: [
        "POST /api/auth/register creates a new user and returns a signed JWT token",
        "POST /api/auth/login checks credentials and returns a signed JWT token",
        "Rejects duplicate email registrations with a 400 Bad Request",
        "Rejects invalid email or password combinations with 401 Unauthorized",
      ],
    },
    {
      order: 3,
      title: "Build JWT Authentication Middleware",
      description:
        "Create the auth middleware function to protect private endpoints. Extract the Bearer token from headers, verify token signature, and attach the decoded user payload to req.user.",
      goal: "Protect private routes by verifying Bearer JWT tokens in request headers.",
      targetFiles: ["src/middleware/auth.js", "src/routes/auth.js"],
      evaluationCriteria: [
        "Extracts Bearer token from the Authorization header",
        "Verifies token validity against process.env.JWT_SECRET",
        "Attaches decoded user payload to req.user for downstream handlers",
        "Rejects missing, expired, or tampered tokens with 401 Unauthorized",
      ],
    },
  ],
  files: [
    {
      path: "package.json",
      content: `{
  "name": "build-auth-express",
  "version": "1.0.0",
  "description": "Production-grade JWT Authentication with Express and Node.js",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "test": "node test.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5"
  }
}
`,
      visible: true,
      editable: true,
    },
    {
      path: "server.js",
      content: `const http = require('http');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./src/routes/auth');

const PORT = process.env.PORT || 5000;

// Lightweight HTTP server supporting pure Node and Express interfaces
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Parse JSON body for POST/PUT requests
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    if (body) {
      try {
        req.body = JSON.parse(body);
      } catch (e) {
        req.body = {};
      }
    } else {
      req.body = {};
    }

    // Helper to send JSON responses
    res.json = (data, statusCode = 200) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data, null, 2));
    };

    res.status = (code) => {
      res.statusCode = code;
      return {
        json: (data) => res.json(data, code)
      };
    };

    // Serve public/index.html on root "/"
    const parsedUrl = req.url.split('?')[0];
    if (parsedUrl === '/' || parsedUrl === '/index.html' || parsedUrl === '') {
      const htmlFile = path.join(__dirname, 'public', 'index.html');
      if (fs.existsSync(htmlFile)) {
        const content = fs.readFileSync(htmlFile, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(content);
      }
    }

    // Health check endpoint
    if (parsedUrl === '/api/health') {
      return res.json({
        status: 'healthy',
        service: 'Nudge Auth API',
        timestamp: new Date().toISOString(),
        endpoints: [
          'POST /api/auth/register',
          'POST /api/auth/login',
          'GET  /api/auth/me'
        ]
      });
    }

    // Delegate to auth routes
    if (parsedUrl.startsWith('/api/auth')) {
      req.url = parsedUrl;
      return authRoutes.handleRequest(req, res);
    }

    // 404 Route Not Found
    res.status(404).json({
      error: 'Not Found',
      message: \`Route \${req.method} \${req.url} does not exist.\`
    });
  });
});

server.listen(PORT, () => {
  console.log(\`🚀 Server running at http://localhost:\${PORT}\`);
  console.log(\`📖 Live Preview available at http://localhost:\${PORT}\`);
});

module.exports = server;
`,
      visible: true,
      editable: true,
    },
    {
      path: "public/index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Frontend Sandbox &bull; Interactive Boxes</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #080c14;
      color: #f1f5f9;
      padding: 24px 20px;
      min-height: 100vh;
    }
    .container { max-width: 860px; margin: 0 auto; }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 16px;
      margin-bottom: 18px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 18px; color: white;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
    }
    .title { font-size: 18px; font-weight: 700; color: #fff; }
    .subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;
      background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399;
    }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; }

    .banner {
      background: #0f1422; border: 1px dashed #334155; border-radius: 12px; padding: 12px 16px;
      margin-bottom: 20px; font-size: 12px; color: #94a3b8; display: flex; align-items: center; justify-content: space-between;
    }
    .banner code {
      background: #1e293b; color: #a5b4fc; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .box {
      background: #0f1422;
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 18px;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 170px;
    }
    .box:hover {
      border-color: #4338ca;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
    .box-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .box-title { font-size: 14px; font-weight: 700; color: #f8fafc; }
    .box-tag { font-size: 10px; font-weight: 700; font-family: monospace; padding: 2px 6px; border-radius: 4px; }
    .box-desc { font-size: 11px; color: #64748b; margin-bottom: 12px; }

    /* Box 1: Counter */
    .counter-val {
      font-size: 32px; font-weight: 800; font-family: monospace; color: #818cf8; text-align: center; margin: 6px 0;
    }
    .btn-group { display: flex; gap: 8px; }
    .btn {
      flex: 1; padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
      border: 1px solid transparent; transition: all 0.15s; text-align: center;
    }
    .btn-indigo { background: #4f46e5; color: white; }
    .btn-indigo:hover { background: #4338ca; }
    .btn-slate { background: #1e293b; color: #cbd5e1; border-color: #334155; }
    .btn-slate:hover { background: #334155; color: white; }

    /* Box 2: Color Box */
    .color-swatch {
      height: 44px; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center;
      font-family: monospace; font-size: 12px; font-weight: 700; transition: background-color 0.3s;
    }

    /* Box 3: Toggle Lamp */
    .lamp {
      padding: 10px; border-radius: 8px; text-align: center; font-size: 12px; font-weight: 600; margin-bottom: 10px;
      transition: all 0.3s;
    }
    .lamp-on {
      background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #34d399;
      box-shadow: 0 0 16px rgba(16, 185, 129, 0.3);
    }
    .lamp-off {
      background: #131826; border: 1px solid #1e293b; color: #64748b;
    }

    /* Box 4: Bounce Card */
    .bounce-target {
      padding: 12px; border-radius: 8px; background: #ec4899; color: white; text-align: center;
      font-weight: 700; font-size: 13px; cursor: pointer; margin-bottom: 8px; user-select: none;
      transition: transform 0.15s;
    }
    .bounce-target:hover { transform: scale(1.03); }
    .bounce-target:active { transform: scale(0.95); }

    /* Box 5: Live Timer */
    .timer-display {
      font-size: 26px; font-weight: 800; font-family: monospace; color: #38bdf8; text-align: center; margin: 8px 0;
    }

    /* Box 6: API Ping */
    .api-response {
      font-size: 11px; font-family: monospace; padding: 6px 10px; background: #05070d; border-radius: 6px;
      border: 1px solid #1e293b; color: #34d399; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="logo">✦</div>
        <div>
          <div class="title">Mini Frontend Sandbox</div>
          <div class="subtitle">Interactive boxes rendered via WebContainer live server</div>
        </div>
      </div>
      <div class="badge"><span class="dot"></span> Live Preview Active</div>
    </div>

    <div class="banner">
      <span>✏️ <strong>Live Editing Tip:</strong> Open <code>public/index.html</code> in the code editor, change colors or text, and click <strong>Reload</strong>!</span>
    </div>

    <div class="grid">
      <!-- Box 1: Click Counter -->
      <div class="box">
        <div>
          <div class="box-header">
            <span class="box-title">Box 1: Counter</span>
            <span class="box-tag" style="background:rgba(99,102,241,0.2);color:#a5b4fc;">INTERACTIVE</span>
          </div>
          <div class="box-desc">Track clicks with state</div>
          <div id="counter" class="counter-val">0</div>
        </div>
        <div class="btn-group">
          <button class="btn btn-indigo" onclick="changeCount(1)">+ Add</button>
          <button class="btn btn-slate" onclick="changeCount(-1)">- Sub</button>
          <button class="btn btn-slate" onclick="resetCount()">Reset</button>
        </div>
      </div>

      <!-- Box 2: Color Changer -->
      <div class="box">
        <div>
          <div class="box-header">
            <span class="box-title">Box 2: Color Shift</span>
            <span class="box-tag" style="background:rgba(236,72,153,0.2);color:#f472b6;">STYLE</span>
          </div>
          <div class="box-desc">Dynamic background switcher</div>
          <div id="swatch" class="color-swatch" style="background:#6366f1;color:white;">#6366F1</div>
        </div>
        <button class="btn btn-indigo" style="width:100%;" onclick="randomizeColor()">🎲 Random Color</button>
      </div>

      <!-- Box 3: Toggle Lamp -->
      <div class="box">
        <div>
          <div class="box-header">
            <span class="box-title">Box 3: Glow Switch</span>
            <span class="box-tag" style="background:rgba(16,185,129,0.2);color:#34d399;">TOGGLE</span>
          </div>
          <div class="box-desc">Glow lighting effect</div>
          <div id="lamp" class="lamp lamp-on">💡 Glow is Active</div>
        </div>
        <button class="btn btn-slate" style="width:100%;" onclick="toggleLamp()">Toggle Light</button>
      </div>

      <!-- Box 4: Bounce Card -->
      <div class="box">
        <div>
          <div class="box-header">
            <span class="box-title">Box 4: Physics Bounce</span>
            <span class="box-tag" style="background:rgba(244,63,94,0.2);color:#fb7185;">ANIMATION</span>
          </div>
          <div class="box-desc">Click the card to animate</div>
          <div id="bounceBtn" class="bounce-target" onclick="triggerBounce()">🎉 Tap to Bounce!</div>
        </div>
        <div style="font-size:11px;color:#64748b;text-align:center;">Bounce Count: <span id="bounces" style="color:#f43f5e;font-weight:700;">0</span></div>
      </div>

      <!-- Box 5: Live Timer -->
      <div class="box">
        <div>
          <div class="box-header">
            <span class="box-title">Box 5: Live Timer</span>
            <span class="box-tag" style="background:rgba(14,165,233,0.2);color:#38bdf8;">REALTIME</span>
          </div>
          <div class="box-desc">Seconds running on page</div>
          <div id="timer" class="timer-display">00:00</div>
        </div>
        <div style="font-size:11px;color:#64748b;text-align:center;">Updates every second</div>
      </div>

      <!-- Box 6: Backend API Ping -->
      <div class="box">
        <div>
          <div class="box-header">
            <span class="box-title">Box 6: API Ping</span>
            <span class="box-tag" style="background:rgba(168,85,247,0.2);color:#c084fc;">REST API</span>
          </div>
          <div class="box-desc">Hits GET /api/health</div>
          <div id="apiResp" class="api-response">Status: Ready</div>
        </div>
        <button class="btn btn-indigo" style="width:100%;" onclick="pingApi()">⚡ Ping Server</button>
      </div>
    </div>
  </div>

  <script>
    // Box 1: Counter
    let count = 0;
    function changeCount(delta) {
      count += delta;
      document.getElementById('counter').textContent = count;
    }
    function resetCount() {
      count = 0;
      document.getElementById('counter').textContent = count;
    }

    // Box 2: Color Changer
    const colors = ['#6366f1', '#ec4899', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#e11d48'];
    let cIdx = 0;
    function randomizeColor() {
      cIdx = (cIdx + 1) % colors.length;
      const el = document.getElementById('swatch');
      el.style.backgroundColor = colors[cIdx];
      el.textContent = colors[cIdx].toUpperCase();
    }

    // Box 3: Toggle Lamp
    let lampOn = true;
    function toggleLamp() {
      lampOn = !lampOn;
      const el = document.getElementById('lamp');
      if (lampOn) {
        el.className = 'lamp lamp-on';
        el.textContent = '💡 Glow is Active';
      } else {
        el.className = 'lamp lamp-off';
        el.textContent = '🌙 Light is OFF';
      }
    }

    // Box 4: Bounce
    let bounces = 0;
    function triggerBounce() {
      bounces++;
      document.getElementById('bounces').textContent = bounces;
      const el = document.getElementById('bounceBtn');
      el.style.transform = 'scale(1.15) rotate(' + (bounces % 2 === 0 ? '3deg' : '-3deg') + ')';
      setTimeout(() => { el.style.transform = 'scale(1)'; }, 150);
    }

    // Box 5: Live Timer
    let seconds = 0;
    setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      document.getElementById('timer').textContent = mins + ':' + secs;
    }, 1000);

    // Box 6: API Ping
    async function pingApi() {
      const el = document.getElementById('apiResp');
      el.textContent = 'Pinging /api/health...';
      try {
        const res = await fetch('/api/health');
        const json = await res.json();
        el.textContent = '🟢 ' + json.status + ' (' + new Date().toLocaleTimeString() + ')';
      } catch (err) {
        el.textContent = '❌ Error: ' + err.message;
      }
    }
  </script>
</body>
</html>
`,
      visible: true,
      editable: true,
    },
    {
      path: "src/models/User.js",
      content: `const crypto = require('crypto');

// In-memory data store for users
const users = [];

/**
 * Generates a salt and hashes a password using PBKDF2 (SHA-512)
 * @param {string} password - Plain text password
 * @returns {string} Stored password hash with salt
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return \`\${salt}:\${hash}\`;
}

/**
 * Compares a plain password against a stored salt:hash string
 * @param {string} password - Plain text candidate password
 * @param {string} storedHash - Salt and hash string from database
 * @returns {boolean} True if password matches
 */
function comparePassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const candidateHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return candidateHash === originalHash;
}

/**
 * Creates and stores a new user record
 */
function createUser({ name, email, password }) {
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error('Email is already registered');
  }

  const user = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name,
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  users.push(user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

/**
 * Finds user by email address
 */
function findUserByEmail(email) {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  return users.find((u) => u.email === normalized) || null;
}

/**
 * Finds user by unique ID
 */
function findUserById(id) {
  return users.find((u) => u.id === id) || null;
}

module.exports = {
  hashPassword,
  comparePassword,
  createUser,
  findUserByEmail,
  findUserById,
  _users: users
};
`,
      visible: true,
      editable: true,
    },
    {
      path: "src/utils/jwt.js",
      content: `const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'nudge-super-secure-jwt-auth-secret-key-2026';

/**
 * Base64URL encoding helper
 */
function base64url(source) {
  let encoded = Buffer.from(source).toString('base64');
  encoded = encoded.replace(/=/g, '').replace(/\\+/g, '-').replace(/\\//g, '_');
  return encoded;
}

/**
 * Signs a payload into a JWT token (HMAC-SHA256)
 * @param {object} payload - Token payload
 * @param {number} expiresInSeconds - Token validity in seconds (default: 24h)
 * @returns {string} Signed JWT token
 */
function generateToken(payload, expiresInSeconds = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));

  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };
  const encodedPayload = base64url(JSON.stringify(tokenPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(\`\${encodedHeader}.\${encodedPayload}\`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_');

  return \`\${encodedHeader}.\${encodedPayload}.\${signature}\`;
}

/**
 * Verifies a JWT token signature and expiration
 * @param {string} token - JWT token string
 * @returns {object} Decoded payload
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('No token provided');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token structure');
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  // Re-compute expected signature
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(\`\${encodedHeader}.\${encodedPayload}\`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_');

  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature');
  }

  // Parse payload
  const payloadJson = Buffer.from(encodedPayload, 'base64').toString('utf-8');
  const payload = JSON.parse(payloadJson);

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token has expired');
  }

  return payload;
}

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET
};
`,
      visible: true,
      editable: true,
    },
    {
      path: "src/middleware/auth.js",
      content: `const { verifyToken } = require('../utils/jwt');
const { findUserById } = require('../models/User');

/**
 * Express / HTTP middleware verifying Bearer JWT tokens
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No authorization header provided.'
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Format must be: Bearer <token>'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    const user = findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User associated with this token no longer exists.'
      });
    }

    // Attach decoded user info to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    if (typeof next === 'function') {
      next();
    }
    return true;
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err.message || 'Invalid or expired authentication token.'
    });
  }
}

module.exports = authMiddleware;
`,
      visible: true,
      editable: true,
    },
    {
      path: "src/controllers/authController.js",
      content: `const { createUser, findUserByEmail, comparePassword } = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * Handles user registration: POST /api/auth/register
 */
function register(req, res) {
  const { name, email, password } = req.body || {};

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide name, email, and password.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long.'
    });
  }

  try {
    const user = createUser({ name, email, password });
    const token = generateToken({ userId: user.id, email: user.email });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Registration failed'
    });
  }
}

/**
 * Handles user login: POST /api/auth/login
 */
function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide both email and password.'
    });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password.'
    });
  }

  const isValidPassword = comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password.'
    });
  }

  const token = generateToken({ userId: user.id, email: user.email });

  return res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
}

/**
 * Returns current authenticated user: GET /api/auth/me
 */
function getMe(req, res) {
  return res.json({
    success: true,
    user: req.user
  });
}

module.exports = {
  register,
  login,
  getMe
};
`,
      visible: true,
      editable: true,
    },
    {
      path: "src/routes/auth.js",
      content: `const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

/**
 * Dispatches auth endpoint requests
 */
function handleRequest(req, res) {
  const path = req.url.split('?')[0];

  // POST /api/auth/register
  if (req.method === 'POST' && path === '/api/auth/register') {
    return authController.register(req, res);
  }

  // POST /api/auth/login
  if (req.method === 'POST' && path === '/api/auth/login') {
    return authController.login(req, res);
  }

  // GET /api/auth/me (Protected by authMiddleware)
  if (req.method === 'GET' && path === '/api/auth/me') {
    // authMiddleware calls next() on success, which executes getMe directly.
    // If it returns true (middleware executed without calling next), call getMe now.
    let nextCalled = false;
    authMiddleware(req, res, () => {
      nextCalled = true;
      authController.getMe(req, res);
    });
    if (!nextCalled) {
      // Middleware either rejected the request (sent 401) or is pending
      // Do not call getMe again.
    }
    return;
  }

  res.status(404).json({
    error: 'Not Found',
    message: \`Auth endpoint \${req.method} \${path} does not exist.\`
  });
}

module.exports = {
  handleRequest
};
`,
      visible: true,
      editable: true,
    },
    {
      path: "test.js",
      content: `const { hashPassword, comparePassword, createUser, findUserByEmail } = require('./src/models/User');
const { generateToken, verifyToken } = require('./src/utils/jwt');
const authMiddleware = require('./src/middleware/auth');

console.log('\\n======================================================');
console.log('🧪 Starting Auth Service Test Suite (Node.js)');
console.log('======================================================\\n');

let passed = 0;
let total = 0;

function assert(description, condition) {
  total++;
  if (condition) {
    passed++;
    console.log(\`  ✔ [PASS] \${description}\`);
  } else {
    console.error(\`  ❌ [FAIL] \${description}\`);
  }
}

try {
  // Test 1: Password hashing with salt
  console.log('📌 Test Group 1: Password Hashing & Salt Verification');
  const plainPassword = 'superSecretPassword123!';
  const hash1 = hashPassword(plainPassword);
  const hash2 = hashPassword(plainPassword);

  assert('Password hash must not equal plain text', hash1 !== plainPassword);
  assert('Hashes contain salt separator ":"', hash1.includes(':'));
  assert('Two hashes of the same password produce distinct salts', hash1 !== hash2);
  assert('comparePassword returns true for matching password', comparePassword(plainPassword, hash1));
  assert('comparePassword returns false for wrong password', !comparePassword('wrongPassword', hash1));

  // Test 2: User Creation & Persistence
  console.log('\\n📌 Test Group 2: User Registration & Persistence');
  const user = createUser({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'analytical-engine'
  });

  assert('User ID is generated', Boolean(user.id));
  assert('User email is saved correctly', user.email === 'ada@example.com');
  assert('User record does not return plain password', !user.password);

  const lookup = findUserByEmail('ada@example.com');
  assert('User can be retrieved by email', lookup !== null && lookup.name === 'Ada Lovelace');

  // Test 3: JWT Token Generation & Verification
  console.log('\\n📌 Test Group 3: JWT Token Generation & Validation');
  const token = generateToken({ userId: user.id, email: user.email });
  assert('JWT Token is a string with 3 segments separated by dots', token.split('.').length === 3);

  const decoded = verifyToken(token);
  assert('Decoded token contains matching userId', decoded.userId === user.id);
  assert('Decoded token contains matching email', decoded.email === user.email);
  assert('Decoded token contains valid expiration time', typeof decoded.exp === 'number');

  // Test 4: Token Rejection on Tampering
  console.log('\\n📌 Test Group 4: Tampered & Malformed Token Rejection');
  let tamperedCaught = false;
  try {
    const tamperedToken = token.slice(0, -4) + 'abcd';
    verifyToken(tamperedToken);
  } catch (err) {
    tamperedCaught = true;
  }
  assert('Tampered signature is strictly rejected', tamperedCaught);

  // Test 5: Authentication Middleware Validation
  console.log('\\n📌 Test Group 5: Route Protection Middleware');
  let rejectedWithoutHeader = false;
  const mockReqNoAuth = { headers: {} };
  const mockResNoAuth = {
    status: (code) => {
      if (code === 401) rejectedWithoutHeader = true;
      return { json: () => {} };
    }
  };
  authMiddleware(mockReqNoAuth, mockResNoAuth);
  assert('Rejects requests missing Authorization header with 401', rejectedWithoutHeader);

  let acceptedWithValidAuth = false;
  const mockReqValid = {
    headers: { authorization: \`Bearer \${token}\` }
  };
  const mockResValid = {
    status: () => ({ json: () => {} })
  };
  authMiddleware(mockReqValid, mockResValid, () => {
    acceptedWithValidAuth = true;
  });
  assert('Accepts requests with valid Bearer token and attaches req.user', Boolean(mockReqValid.user && mockReqValid.user.email === 'ada@example.com'));

  console.log('\\n======================================================');
  console.log(\`🎉 All Done: \${passed} of \${total} tests passed!\`);
  console.log('======================================================\\n');
  process.exit(0);
} catch (err) {
  console.error('\\n💥 Unhandled error in test suite:', err);
  process.exit(1);
}
`,
      visible: true,
      editable: true,
    },
    {
      path: ".env",
      content: `PORT=5000
JWT_SECRET=nudge_super_secure_jwt_auth_secret_key_2026
NODE_ENV=development
`,
      visible: true,
      editable: true,
    },
    {
      path: "README.md",
      content: `# JWT Authentication System with Express & Node.js

A production-ready authentication microservice built for Nudge.

## Architecture

- **Password Hashing**: Cryptographic PBKDF2 salt-based password encryption (\`src/models/User.js\`).
- **Token Security**: Cryptographically signed HMAC-SHA256 JWT tokens with automatic expiry (\`src/utils/jwt.js\`).
- **Route Protection**: Bearer token middleware protecting private endpoints (\`src/middleware/auth.js\`).
- **REST Endpoints**:
  - \`POST /api/auth/register\`: Create user account and receive token
  - \`POST /api/auth/login\`: Authenticate with credentials and receive token
  - \`GET  /api/auth/me\`: Access protected profile data

## Running the Code

### Run Automated Tests:
\`\`\`bash
node test.js
\`\`\`

### Start the Auth Server:
\`\`\`bash
node server.js
\`\`\`
`,
      visible: true,
      editable: true,
    },
  ],
};
