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
const authRoutes = require('./src/routes/auth');

const PORT = process.env.PORT || 5000;

// Lightweight HTTP server supporting both pure Node and Express interfaces
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

    // Health check endpoint
    if (req.url === '/' || req.url === '/api/health') {
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
    if (req.url.startsWith('/api/auth')) {
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
  console.log(\`🚀 Auth Server running at http://localhost:\${PORT}\`);
  console.log(\`📖 Health check available at http://localhost:\${PORT}/api/health\`);
  console.log('⚡ Ready to process authentication requests!');
});

module.exports = server;
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
