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
  // TODO: Task 1 - Implement secure password hashing!
  // 1. Generate a 16-byte random salt using crypto.randomBytes(16).toString('hex')
  // 2. Hash the password with the salt using crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  // 3. Return the combined string \`\${salt}:\${hash}\`
  return password; // Insecure plain text placeholder (Implement hashing to pass!)
}

/**
 * Compares a plain password against a stored salt:hash string
 * @param {string} password - Plain text candidate password
 * @param {string} storedHash - Salt and hash string from database
 * @returns {boolean} True if password matches
 */
function comparePassword(password, storedHash) {
  // TODO: Task 1 - Implement password comparison!
  // 1. Check if storedHash contains the salt separator ':'
  // 2. Split storedHash into salt and originalHash
  // 3. Hash candidate password with the salt and verify against originalHash
  return false;
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

  // TODO: Task 3 - Validate Bearer token header, verify with verifyToken, attach req.user, and call next()!
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Format must be: Bearer <token>'
    });
  }

  // TODO: Verify token and attach user
  return res.status(501).json({
    success: false,
    error: 'JWT authentication middleware not implemented'
  });
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

  // TODO: Task 2 - Validate password length, create user with passwordHash, generate signed JWT token, and return 201!
  return res.status(501).json({
    success: false,
    error: 'Registration handler not implemented'
  });
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

  // TODO: Task 2 - Find user by email, compare password hash, generate signed JWT token, and return token!
  return res.status(501).json({
    success: false,
    error: 'Login handler not implemented'
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

export const feedbackBoardSeedProject: SeedProject = {
  _id: "feedback-board",
  slug: "feedback-board",
  title: "Full-Stack Feedback Board",
  description:
    "Build a production-style REST API for a community feedback board using Node.js, Express, MongoDB, and Mongoose. The frontend is already pre-built and live; implement the endpoints to fetch, create, and upvote feedback items.",
  track: "fullstack",
  difficulty: "beginner",
  tasks: [
    {
      order: 1,
      title: "Implement GET /api/feedback",
      description:
        "Connect the feedback list to the database by implementing the GET /api/feedback route handler. The endpoint must retrieve all saved feedback entries from the database and return them as a JSON array.",
      goal: "Fetch and return all stored feedback items from the database in descending order.",
      targetFiles: ["backend/src/routes/feedback.js", "backend/src/models/Feedback.js"],
      evaluationCriteria: [
        "GET /api/feedback responds with HTTP status 200",
        "Response body is an array of feedback documents",
        "Each feedback item contains title, description, category, and votes",
        "Feedback items are sorted in descending order",
      ],
    },
    {
      order: 2,
      title: "Implement POST /api/feedback",
      description:
        "Enable users to submit new ideas and issues by implementing the POST /api/feedback route handler. Validate incoming payload fields, create a new document in the database with initial zero votes, and respond with the created record.",
      goal: "Validate request body, create a new feedback item in MongoDB, and return it with HTTP status 201.",
      targetFiles: ["backend/src/routes/feedback.js", "backend/src/models/Feedback.js"],
      evaluationCriteria: [
        "POST /api/feedback responds with HTTP status 201 on valid submission",
        "Response body contains the newly created feedback object with an _id",
        "Newly created feedback initializes with votes: 0",
        "Returns HTTP 400 Bad Request if title or description is missing",
      ],
    },
    {
      order: 3,
      title: "Implement POST /api/feedback/:id/upvote",
      description:
        "Allow users to upvote feedback submissions by implementing the POST /api/feedback/:id/upvote route handler. Extract the item ID parameter, increment the vote counter by 1, persist the change, and return the updated document.",
      goal: "Increment the vote tally of a target feedback document and return the updated record.",
      targetFiles: ["backend/src/routes/feedback.js", "backend/src/models/Feedback.js"],
      evaluationCriteria: [
        "POST /api/feedback/:id/upvote responds with HTTP status 200",
        "Increments the votes field of the target item by exactly 1",
        "Returns the updated feedback object in the response",
        "Responds with HTTP status 404 if the feedback :id does not exist",
      ],
    },
  ],
  files: [
    {
      path: "package.json",
      content: `{
  "name": "feedback-board",
  "version": "1.0.0",
  "description": "Full-Stack Feedback Board Project",
  "main": "backend/src/server.js",
  "scripts": {
    "dev": "node backend/src/server.js",
    "start": "node backend/src/server.js",
    "test": "node backend/test.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "mongoose": "^8.3.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5"
  }
}
`,
      visible: true,
      editable: true,
    },
    {
      path: "backend/package.json",
      content: `{
  "name": "feedback-board-backend",
  "version": "1.0.0",
  "description": "Backend API for Community Feedback Board",
  "main": "src/server.js",
  "scripts": {
    "dev": "node src/server.js",
    "start": "node src/server.js",
    "test": "node test.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "mongoose": "^8.3.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5"
  }
}
`,
      visible: true,
      editable: true,
    },
    {
      path: "backend/.env.example",
      content: `PORT=5000
MONGODB_URI=mongodb://localhost:27017/feedback_board
`,
      visible: true,
      editable: true,
    },
    {
      path: "backend/src/server.js",
      content: `const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const feedbackRoutes = require('./routes/feedback');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for client requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve the pre-built, ready-to-use frontend
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Mount Feedback REST API routes
app.use('/api/feedback', feedbackRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Feedback Board Backend API',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET  /api/feedback',
      'POST /api/feedback',
      'POST /api/feedback/:id/upvote'
    ]
  });
});

// Fallback to frontend index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(\`🚀 Feedback Board Server running at http://localhost:\${PORT}\`);
    console.log(\`📖 Live Preview available at http://localhost:\${PORT}\`);
  });
}

module.exports = app;
`,
      visible: true,
      editable: true,
    },
    {
      path: "backend/src/models/Feedback.js",
      content: `const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['feature', 'bug', 'improvement', 'general'],
    default: 'general',
  },
  votes: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Resilient WebContainer & in-memory store adapter:
// Allows standard Mongoose queries (find, create, findById, findByIdAndUpdate)
// to work seamlessly with or without an active standalone MongoDB daemon.
let inMemoryStore = [
  {
    _id: 'fb-001',
    title: 'Add Dark Mode Theme Support',
    description: 'Provide an eye-friendly dark color scheme for late-night sessions.',
    category: 'feature',
    votes: 14,
    createdAt: new Date(Date.now() - 3600000 * 24),
  },
  {
    _id: 'fb-002',
    title: 'Export Feedback to CSV/Excel',
    description: 'Allow administrators and users to download all feedback items as spreadsheet files.',
    category: 'improvement',
    votes: 9,
    createdAt: new Date(Date.now() - 3600000 * 12),
  },
  {
    _id: 'fb-003',
    title: 'Fix Mobile Sidebar Overlay Bug',
    description: 'On smaller mobile screens, the navigation overlay occasionally blocks the submit button.',
    category: 'bug',
    votes: 4,
    createdAt: new Date(Date.now() - 3600000 * 4),
  },
];

let RealModel;
try {
  RealModel = mongoose.model('Feedback', feedbackSchema);
} catch (e) {
  RealModel = mongoose.models.Feedback;
}

// Model wrapper providing standard Mongoose methods with resilient fallback
const Feedback = {
  schema: feedbackSchema,

  async find(query = {}) {
    // If connected to real MongoDB, delegate to Mongoose
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return RealModel.find(query);
    }
    // In-memory clone with chainable query helper (e.g. .sort())
    let results = inMemoryStore.map((item) => ({ ...item }));
    const chain = {
      sort(sortOptions = {}) {
        if (sortOptions.votes === -1) {
          results.sort((a, b) => b.votes - a.votes);
        } else if (sortOptions.votes === 1) {
          results.sort((a, b) => a.votes - b.votes);
        } else if (sortOptions.createdAt === -1) {
          results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return Promise.resolve(results);
      },
      then(resolve, reject) {
        return Promise.resolve(results).then(resolve, reject);
      },
      catch(reject) {
        return Promise.resolve(results).catch(reject);
      }
    };
    return chain;
  },

  async findById(id) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return RealModel.findById(id);
    }
    const item = inMemoryStore.find((it) => it._id === String(id));
    if (!item) return null;
    return {
      ...item,
      async save() {
        const idx = inMemoryStore.findIndex((it) => it._id === String(id));
        if (idx !== -1) inMemoryStore[idx] = { ...this };
        return this;
      }
    };
  },

  async create(data) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return RealModel.create(data);
    }
    if (!data.title || !data.description) {
      throw new Error('Title and description are required fields.');
    }
    const newDoc = {
      _id: 'fb-' + Math.random().toString(36).substring(2, 9),
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category || 'general',
      votes: typeof data.votes === 'number' ? data.votes : 0,
      createdAt: new Date(),
    };
    inMemoryStore.push(newDoc);
    return { ...newDoc };
  },

  async findByIdAndUpdate(id, update, options = {}) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return RealModel.findByIdAndUpdate(id, update, options);
    }
    const idx = inMemoryStore.findIndex((it) => it._id === String(id));
    if (idx === -1) return null;

    if (update.$inc && typeof update.$inc.votes === 'number') {
      inMemoryStore[idx].votes += update.$inc.votes;
    } else if (typeof update.votes === 'number') {
      inMemoryStore[idx].votes = update.votes;
    }
    return { ...inMemoryStore[idx] };
  },

  _resetStore() {
    inMemoryStore = [
      {
        _id: 'fb-001',
        title: 'Add Dark Mode Theme Support',
        description: 'Provide an eye-friendly dark color scheme for late-night sessions.',
        category: 'feature',
        votes: 14,
        createdAt: new Date(Date.now() - 3600000 * 24),
      },
      {
        _id: 'fb-002',
        title: 'Export Feedback to CSV/Excel',
        description: 'Allow administrators and users to download all feedback items as spreadsheet files.',
        category: 'improvement',
        votes: 9,
        createdAt: new Date(Date.now() - 3600000 * 12),
      },
      {
        _id: 'fb-003',
        title: 'Fix Mobile Sidebar Overlay Bug',
        description: 'On smaller mobile screens, the navigation overlay occasionally blocks the submit button.',
        category: 'bug',
        votes: 4,
        createdAt: new Date(Date.now() - 3600000 * 4),
      },
    ];
  }
};

module.exports = Feedback;
`,
      visible: true,
      editable: true,
    },
    {
      path: "backend/src/routes/feedback.js",
      content: `const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

/**
 * GET /api/feedback
 * Task 1: Retrieve all feedback items
 *
 * Expected behavior:
 * - Query the database for all feedback entries.
 * - Sort the items so the highest votes or newest entries appear first.
 * - Respond with HTTP status 200 and a JSON array of feedback objects.
 */
router.get('/', async (req, res) => {
  try {
    // TODO: Task 1 - Retrieve all feedback documents from the database.
    // Query the database, sort the items, and return the array with HTTP 200.

    res.status(501).json({
      error: 'Not Implemented',
      message: 'TODO: Implement GET /api/feedback in backend/src/routes/feedback.js'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/feedback
 * Task 2: Create a new feedback item
 *
 * Expected behavior:
 * - Extract title, description, and optional category from req.body.
 * - Validate that title and description are present and not empty.
 * - If validation fails, respond with HTTP status 400 Bad Request.
 * - Create a new feedback document in the database with votes initialized to 0.
 * - Respond with HTTP status 201 Created and the newly created feedback object.
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, category } = req.body;

    // TODO: Task 2 - Validate required fields (title, description).
    // If validation fails, return HTTP 400 Bad Request.
    // Otherwise, create and save the new feedback item, and respond with HTTP 201 Created.

    res.status(501).json({
      error: 'Not Implemented',
      message: 'TODO: Implement POST /api/feedback in backend/src/routes/feedback.js'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/feedback/:id/upvote
 * Task 3: Upvote an existing feedback item
 *
 * Expected behavior:
 * - Extract the feedback ID from req.params.id.
 * - Find the feedback document in the database.
 * - If no document is found with that ID, respond with HTTP status 404 Not Found.
 * - If found, increment its votes count by 1 and save the update.
 * - Respond with HTTP status 200 OK and the updated feedback document.
 */
router.post('/:id/upvote', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Task 3 - Find feedback by ID, increment votes by 1, and persist changes.
    // If not found, return HTTP 404. Otherwise, return HTTP 200 with updated document.

    res.status(501).json({
      error: 'Not Implemented',
      message: 'TODO: Implement POST /api/feedback/:id/upvote in backend/src/routes/feedback.js'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
`,
      visible: true,
      editable: true,
    },
    {
      path: "frontend/index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Community Feedback Board</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #07090e;
      --card-bg: #0e1320;
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --accent-feature: #38bdf8;
      --accent-bug: #f43f5e;
      --accent-improvement: #10b981;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 24px 16px 48px;
    }

    .container {
      max-width: 1040px;
      margin: 0 auto;
    }

    /* Header */
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 28px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 13px;
      color: var(--text-muted);
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }

    /* Notice Banner */
    .notice-card {
      background: #0f1526;
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 14px;
      padding: 14px 18px;
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      font-size: 13px;
    }
    .notice-left {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #c7d2fe;
    }
    .notice-badge {
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Layout Grid */
    .grid-layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 28px;
      align-items: start;
    }
    @media (max-width: 860px) {
      .grid-layout { grid-template-columns: 1fr; }
    }

    /* Sidebar: Form */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
    }
    .card-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .card-desc {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 16px;
      line-height: 1.4;
    }

    .form-group {
      margin-bottom: 14px;
    }
    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 6px;
    }
    input, select, textarea {
      width: 100%;
      background: #080c14;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 10px 12px;
      color: var(--text);
      font-family: inherit;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus, select:focus, textarea:focus {
      border-color: var(--primary);
    }
    textarea {
      resize: vertical;
      min-height: 80px;
    }

    .btn-submit {
      width: 100%;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      border: none;
      color: white;
      font-weight: 700;
      font-size: 13px;
      padding: 11px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      transition: all 0.2s;
    }
    .btn-submit:hover {
      background: linear-gradient(135deg, #4f46e5, #4338ca);
      transform: translateY(-1px);
    }
    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    /* Right column: Filter & List */
    .filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .filter-tabs {
      display: flex;
      align-items: center;
      background: #080c14;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 3px;
      gap: 4px;
    }
    .filter-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 7px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn.active {
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
    }

    .feedback-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feedback-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 16px 18px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: all 0.2s;
    }
    .feedback-card:hover {
      border-color: rgba(99, 102, 241, 0.35);
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }

    /* Upvote button */
    .upvote-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #080c14;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      min-width: 48px;
      height: 52px;
      padding: 4px 8px;
      cursor: pointer;
      color: #cbd5e1;
      font-family: inherit;
      font-weight: 700;
      font-size: 12px;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .upvote-btn:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.5);
      color: #818cf8;
      transform: scale(1.05);
    }
    .upvote-icon {
      font-size: 14px;
      line-height: 1;
      margin-bottom: 2px;
    }

    .feedback-body {
      flex: 1;
      min-width: 0;
    }
    .feedback-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .feedback-title {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .category-pill {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 9999px;
      letter-spacing: 0.04em;
    }
    .category-feature { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .category-bug { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }
    .category-improvement { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .category-general { background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }

    .feedback-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1e1b4b;
      border: 1px solid #4f46e5;
      color: #e0e7ff;
      padding: 12px 18px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      gap: 10px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      background: var(--card-bg);
      border: 1px dashed var(--card-border);
      border-radius: 16px;
      color: var(--text-muted);
    }
    .empty-state h3 {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 6px;
    }
    .empty-state p {
      font-size: 13px;
      max-width: 420px;
      margin: 0 auto;
      line-height: 1.5;
    }
    .code-pill {
      font-family: 'JetBrains Mono', monospace;
      background: #080c14;
      padding: 2px 6px;
      border-radius: 4px;
      color: #a5b4fc;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Top Header -->
    <header>
      <div class="brand">
        <div class="brand-icon">💡</div>
        <div>
          <h1>Community Feedback Board</h1>
          <div class="subtitle">Pre-built interactive frontend connected to your Node/Express backend</div>
        </div>
      </div>
      <div class="status-badge">
        <div class="status-dot"></div>
        <span id="backend-status">Checking API Status...</span>
      </div>
    </header>

    <!-- Notice Card -->
    <div class="notice-card">
      <div class="notice-left">
        <span class="notice-badge">Workspace Info</span>
        <span>This frontend is ready. Implement the backend route handlers in <span class="code-pill">backend/src/routes/feedback.js</span> to power it!</span>
      </div>
      <button class="filter-btn" onclick="fetchFeedback()" style="background: rgba(255,255,255,0.06); color: #fff;">↻ Refresh API</button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid-layout">
      <!-- Left: Create Form -->
      <aside class="card">
        <h2 class="card-title">Submit Feedback</h2>
        <p class="card-desc">Users submit issues and feature requests through this form (<span class="code-pill">POST /api/feedback</span>).</p>

        <form id="feedback-form" onsubmit="handleCreateFeedback(event)">
          <div class="form-group">
            <label for="fb-title">Title</label>
            <input type="text" id="fb-title" placeholder="e.g. Export data to CSV" required>
          </div>

          <div class="form-group">
            <label for="fb-category">Category</label>
            <select id="fb-category">
              <option value="feature">Feature Request</option>
              <option value="improvement">Improvement</option>
              <option value="bug">Bug Report</option>
              <option value="general">General</option>
            </select>
          </div>

          <div class="form-group">
            <label for="fb-desc">Description</label>
            <textarea id="fb-desc" placeholder="Describe the feature or problem in detail..." required></textarea>
          </div>

          <button type="submit" id="btn-submit" class="btn-submit">
            <span>Submit Feedback</span>
            <span>&rarr;</span>
          </button>
        </form>
      </aside>

      <!-- Right: List & Filters -->
      <main>
        <div class="filter-bar">
          <div class="filter-tabs">
            <button class="filter-btn active" onclick="setCategoryFilter('all', this)">All</button>
            <button class="filter-btn" onclick="setCategoryFilter('feature', this)">Features</button>
            <button class="filter-btn" onclick="setCategoryFilter('improvement', this)">Improvements</button>
            <button class="filter-btn" onclick="setCategoryFilter('bug', this)">Bugs</button>
          </div>
          <span id="items-count" style="font-size: 12px; color: var(--text-muted); font-weight: 600;">0 items</span>
        </div>

        <div id="feedback-container" class="feedback-list">
          <div class="empty-state">
            <h3>Loading Feedback...</h3>
            <p>Calling <span class="code-pill">GET /api/feedback</span> from your backend.</p>
          </div>
        </div>
      </main>
    </div>
  </div>

  <!-- Floating Toast -->
  <div id="toast" class="toast">
    <span id="toast-message">Message</span>
  </div>

  <script>
    let feedbackItems = [];
    let activeFilter = 'all';

    function showToast(msg) {
      const toast = document.getElementById('toast');
      const toastMsg = document.getElementById('toast-message');
      toastMsg.innerText = msg;
      toast.style.display = 'flex';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 3500);
    }

    async function checkHealth() {
      const statusEl = document.getElementById('backend-status');
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          statusEl.innerText = 'API Online (Port 5000)';
          statusEl.parentElement.style.background = 'rgba(16, 185, 129, 0.12)';
          statusEl.parentElement.style.color = '#34d399';
        } else {
          statusEl.innerText = 'API Responding (HTTP ' + res.status + ')';
        }
      } catch (err) {
        statusEl.innerText = 'API Disconnected';
        statusEl.parentElement.style.background = 'rgba(244, 63, 94, 0.12)';
        statusEl.parentElement.style.color = '#fb7185';
      }
    }

    async function fetchFeedback() {
      const container = document.getElementById('feedback-container');
      try {
        const res = await fetch('/api/feedback');
        if (res.status === 501) {
          const data = await res.json();
          container.innerHTML = \`
            <div class="empty-state">
              <div style="font-size: 32px; margin-bottom: 8px;">⏳</div>
              <h3>GET /api/feedback Not Implemented</h3>
              <p style="margin-bottom: 12px;">\${data.message || 'Complete Task 1 in backend/src/routes/feedback.js'}</p>
              <span class="code-pill">router.get('/', async (req, res) => { ... })</span>
            </div>
          \`;
          document.getElementById('items-count').innerText = '0 items';
          return;
        }

        if (!res.ok) throw new Error('HTTP ' + res.status);

        const data = await res.json();
        feedbackItems = Array.isArray(data) ? data : [];
        renderList();
      } catch (err) {
        container.innerHTML = \`
          <div class="empty-state">
            <div style="font-size: 32px; margin-bottom: 8px;">🔌</div>
            <h3>Could Not Connect to Backend</h3>
            <p>Ensure your dev server is running on port 5000 (<span class="code-pill">npm run dev</span>).</p>
          </div>
        \`;
      }
    }

    function setCategoryFilter(cat, btn) {
      activeFilter = cat;
      document.querySelectorAll('.filter-tabs .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderList();
    }

    function renderList() {
      const container = document.getElementById('feedback-container');
      const filtered = activeFilter === 'all'
        ? feedbackItems
        : feedbackItems.filter(item => (item.category || '').toLowerCase() === activeFilter);

      document.getElementById('items-count').innerText = filtered.length + ' item' + (filtered.length === 1 ? '' : 's');

      if (filtered.length === 0) {
        container.innerHTML = \`
          <div class="empty-state">
            <h3>No feedback entries found</h3>
            <p>Be the first to submit an idea using the form on the left!</p>
          </div>
        \`;
        return;
      }

      container.innerHTML = filtered.map(item => {
        const cat = (item.category || 'general').toLowerCase();
        const catClass = 'category-' + cat;
        return \`
          <div class="feedback-card" id="card-\${item._id}">
            <button class="upvote-btn" onclick="handleUpvote('\${item._id}')" title="Upvote this idea">
              <span class="upvote-icon">▲</span>
              <span id="votes-\${item._id}">\${item.votes || 0}</span>
            </button>
            <div class="feedback-body">
              <div class="feedback-header">
                <span class="feedback-title">\${escapeHtml(item.title)}</span>
                <span class="category-pill \${catClass}">\${cat}</span>
              </div>
              <p class="feedback-desc">\${escapeHtml(item.description)}</p>
            </div>
          </div>
        \`;
      }).join('');
    }

    async function handleCreateFeedback(e) {
      e.preventDefault();
      const titleInput = document.getElementById('fb-title');
      const descInput = document.getElementById('fb-desc');
      const categoryInput = document.getElementById('fb-category');
      const submitBtn = document.getElementById('btn-submit');

      const payload = {
        title: titleInput.value.trim(),
        description: descInput.value.trim(),
        category: categoryInput.value,
      };

      submitBtn.disabled = true;
      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.status === 501) {
          const errData = await res.json();
          showToast('⚠️ Task 2: ' + (errData.message || 'POST /api/feedback not implemented yet.'));
          return;
        }

        if (!res.ok) {
          const errData = await res.json();
          showToast('❌ Error: ' + (errData.error || 'Failed to create feedback'));
          return;
        }

        const created = await res.json();
        showToast('✔ Feedback submitted successfully!');
        titleInput.value = '';
        descInput.value = '';
        await fetchFeedback();
      } catch (err) {
        showToast('❌ Network error submitting feedback.');
      } finally {
        submitBtn.disabled = false;
      }
    }

    async function handleUpvote(id) {
      try {
        const res = await fetch('/api/feedback/' + id + '/upvote', {
          method: 'POST'
        });

        if (res.status === 501) {
          const errData = await res.json();
          showToast('⚠️ Task 3: ' + (errData.message || 'POST /api/feedback/:id/upvote not implemented yet.'));
          return;
        }

        if (!res.ok) {
          const errData = await res.json();
          showToast('❌ Upvote failed: ' + (errData.error || errData.message || 'Error'));
          return;
        }

        const updated = await res.json();
        const voteSpan = document.getElementById('votes-' + id);
        if (voteSpan && typeof updated.votes === 'number') {
          voteSpan.innerText = updated.votes;
        }
        showToast('▲ Vote recorded! Total: ' + (updated.votes || 0));
      } catch (err) {
        showToast('❌ Network error upvoting item.');
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // Initial load
    checkHealth();
    fetchFeedback();
  </script>
</body>
</html>
`,
      visible: true,
      editable: false,
    },
    {
      path: "backend/test.js",
      content: `/**
 * Automated Test Suite for Feedback Board Backend
 * Run with: node backend/test.js
 */

const feedbackRoutes = require('./src/routes/feedback');
const Feedback = require('./src/models/Feedback');

// Minimal in-memory HTTP harness for testing Express route handlers
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

async function dispatchRoute(router, method, url, body = {}, params = {}) {
  const req = {
    method,
    url,
    body,
    params,
    headers: { 'content-type': 'application/json' },
  };
  const res = createMockRes();

  return new Promise((resolve) => {
    // Find matching route handler in Express router stack
    let matched = false;
    for (const layer of router.stack) {
      if (layer.route) {
        const routeMethod = Object.keys(layer.route.methods)[0]?.toUpperCase();
        if (routeMethod === method) {
          // Check route path matching
          const routePath = layer.route.path;
          let isMatch = false;

          if (routePath === '/' && url === '/') {
            isMatch = true;
          } else if (routePath === '/:id/upvote' && url.includes('/upvote')) {
            isMatch = true;
            const parts = url.split('/');
            req.params = { id: parts[1] };
          }

          if (isMatch) {
            matched = true;
            const handler = layer.route.stack[0].handle;
            handler(req, res, () => {}).then(() => resolve(res)).catch(() => resolve(res));
            break;
          }
        }
      }
    }
    if (!matched) {
      res.statusCode = 404;
      res.body = { error: 'Route not found in test harness' };
      resolve(res);
    }
  });
}

async function runFeedbackTestSuite() {
  console.log('======================================================');
  console.log('🧪 Starting Feedback Board Test Suite (Node.js)');
  console.log('======================================================');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(\`  ✔ [PASS] \${message}\`);
      passed++;
    } else {
      console.log(\`  ❌ [FAIL] \${message}\`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  console.log('\\n📌 Task 1 Tests: GET /api/feedback');
  console.log('-----------------------------------------------------');
  const getRes = await dispatchRoute(feedbackRoutes, 'GET', '/');
  assert(getRes.statusCode === 200, 'GET /api/feedback responds with status 200');
  assert(Array.isArray(getRes.body), 'Response body is an array of feedback items');
  if (Array.isArray(getRes.body) && getRes.body.length > 0) {
    const first = getRes.body[0];
    assert(first.title && first.description, 'Feedback objects contain title and description');
    assert(typeof first.votes === 'number', 'Feedback objects contain numerical votes');
  } else {
    assert(false, 'Feedback array should contain items (implement GET in routes/feedback.js)');
  }

  // ─────────────────────────────────────────────────────────────
  console.log('\\n📌 Task 2 Tests: POST /api/feedback');
  console.log('-----------------------------------------------------');
  // Validation rejection test
  const invalidPost = await dispatchRoute(feedbackRoutes, 'POST', '/', {});
  assert(invalidPost.statusCode === 400, 'Rejects empty payload with 400 Bad Request');

  // Valid creation test
  const validPost = await dispatchRoute(feedbackRoutes, 'POST', '/', {
    title: 'Automated Test Idea',
    description: 'Verifying feedback creation pipeline',
    category: 'feature'
  });
  assert(validPost.statusCode === 201, 'POST /api/feedback responds with 201 Created');
  assert(validPost.body && validPost.body._id, 'Created feedback document returns generated _id');
  assert(validPost.body && validPost.body.votes === 0, 'Newly created feedback document has 0 initial votes');

  // ─────────────────────────────────────────────────────────────
  console.log('\\n📌 Task 3 Tests: POST /api/feedback/:id/upvote');
  console.log('-----------------------------------------------------');
  // Invalid ID test
  const invalidUpvote = await dispatchRoute(feedbackRoutes, 'POST', '/non-existent-id/upvote');
  assert(invalidUpvote.statusCode === 404, 'Returns 404 Not Found for non-existent feedback ID');

  // Valid upvote test
  const testId = (validPost.body && validPost.body._id) ? validPost.body._id : 'fb-001';
  const initialVotes = (validPost.body && typeof validPost.body.votes === 'number') ? validPost.body.votes : 14;
  const upvoteRes = await dispatchRoute(feedbackRoutes, 'POST', \`/\${testId}/upvote\`);
  assert(upvoteRes.statusCode === 200, 'POST /api/feedback/:id/upvote responds with status 200');
  assert(
    upvoteRes.body && upvoteRes.body.votes === initialVotes + 1,
    'Vote count incremented by exactly 1'
  );

  console.log('======================================================');
  console.log(\`Test Results: \${passed} of \${total} tests passed.\`);
  console.log('======================================================');

  process.exit(passed === total ? 0 : 1);
}

runFeedbackTestSuite().catch((err) => {
  console.error('Test suite execution error:', err);
  process.exit(1);
});
`,
      visible: true,
      editable: true,
    },
    {
      path: "README.md",
      content: `# Full-Stack Feedback Board Project

A product feedback board built with a pre-built frontend and an Express + Node.js + Mongoose backend.

## Project Structure

\`\`\`
feedback-board/
├── frontend/
│   └── index.html             # Pre-built interactive client (Do not edit)
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── Feedback.js   # Mongoose model for feedback items
│   │   ├── routes/
│   │   │   └── feedback.js   # API route handlers (Learner Tasks 1, 2, and 3)
│   │   └── server.js         # Express server & static asset mount
│   ├── test.js               # Automated test runner
│   ├── .env.example
│   └── package.json
└── package.json
\`\`\`

## Running the Application

### 1. Start Development Server:
\`\`\`bash
npm run dev
\`\`\`
Access the Live Preview on port 5000 to interact with the frontend board.

### 2. Run the Test Suite:
\`\`\`bash
npm test
# or
node backend/test.js
\`\`\`

## Sequential Tasks:

1. **Task 1: Implement GET /api/feedback**
   - Query all feedback documents from the database and return as JSON.
2. **Task 2: Implement POST /api/feedback**
   - Validate incoming title and description, create a document with 0 initial votes, and return HTTP 201.
3. **Task 3: Implement POST /api/feedback/:id/upvote**
   - Locate the target feedback by ID and increment its vote count by 1.
`,
      visible: true,
      editable: true,
    }
  ],
};

export const allSeedProjects: SeedProject[] = [
  authSeedProject,
  feedbackBoardSeedProject,
];

