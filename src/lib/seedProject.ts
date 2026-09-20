export interface TaskItem {
  order: number;
  title: string;
  description: string;
  instructions?: string;
  goal: string;
  targetFiles: string[];
  evaluationCriteria: string[];
  concepts?: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
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
    "Implement a complete authentication service with salt-based password hashing, JWT token generation & verification, user registration, credential login, and protected route middleware.",
  track: "backend",
  difficulty: "intermediate",
  tasks: [
    {
      order: 1,
      title: "Define User Model & Password Hashing",
      description:
        "Implement secure password hashing in the User model using cryptographic salt. Ensure passwords are never stored in plain text and provide a method to compare candidate passwords with stored hashes.",
      instructions:
        "1. Open `src/models/User.js`.\n2. In `hashPassword(password)`, generate a 16-byte random salt using `crypto.randomBytes(16).toString('hex')`.\n3. Hash the password with the salt using `crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')`.\n4. Return the combined string in the format `${salt}:${hash}`.\n5. In `comparePassword(password, storedHash)`, split the stored string by `:` to extract the salt and original hash. Re-hash the candidate password using the same salt and verify whether the hashes match.\n6. In `createUser`, ensure the user's password is saved via `hashPassword` and never exposed as plain text.",
      goal: "Hash passwords securely using cryptographic salt before persisting user records and provide comparison functionality.",
      targetFiles: ["src/models/User.js"],
      concepts: ["Cryptographic Salts", "PBKDF2 Hashing", "Secure Data Storage", "One-Way Functions"],
      difficulty: "beginner",
      evaluationCriteria: [
        "hashPassword generates a unique cryptographic salt and hashes the password",
        "hashPassword returns a formatted string containing both salt and hash separated by a colon",
        "comparePassword correctly verifies matching passwords against the stored salt and hash",
        "comparePassword returns false when the password does not match",
        "createUser persists the hashed password and does not expose plain text passwords",
      ],
    },
    {
      order: 2,
      title: "Implement Registration & Login Controllers",
      description:
        "Build the controller functions for POST /api/auth/register and POST /api/auth/login. Validate incoming payloads, create user records, verify credentials, and return signed JWT tokens.",
      instructions:
        "1. Open `src/controllers/authController.js`.\n2. In `register(req, res)`, validate that `name`, `email`, and `password` are present in `req.body`. If any field is missing, return HTTP status 400 Bad Request with an error message.\n3. Check if a user with the same email already exists using `findUserByEmail`. If so, return HTTP 400.\n4. Create the new user with `createUser({ name, email, password })`, generate a token using `generateToken({ userId: user.id, email: user.email })`, and return HTTP status 201 with `{ success: true, token, user }`.\n5. In `login(req, res)`, validate that `email` and `password` are provided. Find the user with `findUserByEmail` and check the password with `comparePassword(password, user.passwordHash)`. If the user does not exist or password does not match, return HTTP status 401 Unauthorized.\n6. On successful login, generate a JWT token and return HTTP status 200 with `{ success: true, token, user }`.",
      goal: "Implement registration and login route handlers that validate requests, manage credentials, and issue JWT tokens.",
      targetFiles: ["src/controllers/authController.js", "src/routes/auth.js"],
      concepts: ["REST API Controllers", "Input Validation", "HTTP Status Codes (400, 401, 201)", "JWT Token Generation"],
      difficulty: "intermediate",
      evaluationCriteria: [
        "register validates required fields and returns 400 Bad Request if missing",
        "register rejects duplicate email registrations with 400 Bad Request",
        "register creates the user, generates a JWT token, and returns 201 Created with the token",
        "login checks credentials with comparePassword and rejects invalid credentials with 401 Unauthorized",
        "login generates a signed JWT token on valid credentials and returns 200 OK",
      ],
    },
    {
      order: 3,
      title: "Build JWT Authentication Middleware",
      description:
        "Create the auth middleware function to protect private endpoints. Extract the Bearer token from headers, verify token signature, and attach the decoded user payload to req.user.",
      instructions:
        "1. Open `src/middleware/auth.js`.\n2. Extract the `Authorization` header from `req.headers` (handling case differences).\n3. Check if the header starts with `Bearer `.\n4. Extract the token substring and verify it using `verifyToken(token)`.\n5. Attach the decoded payload or user to `req.user`.\n6. Invoke `next()` to proceed to downstream route handlers.\n7. If the token is missing, malformed, or fails verification, return HTTP status 401 Unauthorized with `{ success: false, error: '...' }`.",
      goal: "Protect private routes by verifying Bearer JWT tokens in request headers and attaching decoded user context.",
      targetFiles: ["src/middleware/auth.js", "src/routes/auth.js"],
      concepts: ["Express Middleware", "Bearer Token Authentication", "Header Parsing", "Downstream Context (req.user)"],
      difficulty: "intermediate",
      evaluationCriteria: [
        "Extracts Bearer token from Authorization request header",
        "Rejects requests with missing or non-Bearer authorization header with 401 Unauthorized",
        "Verifies token signature using verifyToken and rejects invalid or expired tokens with 401 Unauthorized",
        "Attaches decoded user payload to req.user and invokes next() callback on valid token",
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
    "dev": "node server.js"
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

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

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

    const parsedUrl = req.url.split('?')[0];

    if (parsedUrl === '/api/health') {
      return res.json({
        status: 'healthy',
        service: 'Nudge Auth API',
        timestamp: new Date().toISOString()
      });
    }

    if (parsedUrl.startsWith('/api/auth')) {
      req.url = parsedUrl;
      return authRoutes.handleRequest(req, res);
    }

    res.status(404).json({
      error: 'Not Found',
      message: \`Route \${req.method} \${req.url} does not exist.\`
    });
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(\`Auth API server listening on port \${PORT}\`);
  });
}

module.exports = server;
`,
      visible: true,
      editable: true,
    },
    {
      path: "src/models/User.js",
      content: `const crypto = require('crypto');

// In-memory user store
const users = [];

/**
 * Generates a cryptographic salt and hashes a password using PBKDF2 (SHA-512).
 * @param {string} password - Plain text password
 * @returns {string} Salt and hash string formatted as \`\${salt}:\${hash}\`
 */
function hashPassword(password) {
  // TODO: Task 1 - Implement secure password hashing!
  // 1. Generate a 16-byte random salt: crypto.randomBytes(16).toString('hex')
  // 2. Hash password with salt: crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  // 3. Return \`\${salt}:\${hash}\`
  return password; // Placeholder (Implement hashing to satisfy Task 1 requirements!)
}

/**
 * Compares a plain candidate password with a stored salt:hash string.
 * @param {string} password - Plain text candidate password
 * @param {string} storedHash - Stored string containing \`salt:hash\`
 * @returns {boolean} True if candidate password matches stored hash
 */
function comparePassword(password, storedHash) {
  // TODO: Task 1 - Implement password comparison!
  // 1. Check if storedHash contains the salt separator ':'
  // 2. Split storedHash into salt and originalHash
  // 3. Hash candidate password with the salt and verify against originalHash
  return false;
}

/**
 * Creates and stores a new user record with hashed password.
 * @param {object} params - { name, email, password }
 * @returns {object} Public user record without plain password
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
 * Finds a user by email address.
 * @param {string} email
 * @returns {object|null}
 */
function findUserByEmail(email) {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  return users.find((u) => u.email === normalized) || null;
}

/**
 * Finds a user by unique ID.
 * @param {string} id
 * @returns {object|null}
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

function base64url(source) {
  let encoded = Buffer.from(source).toString('base64');
  encoded = encoded.replace(/=/g, '').replace(/\\+/g, '-').replace(/\\//g, '_');
  return encoded;
}

/**
 * Signs a payload into a JWT token (HMAC-SHA256).
 * @param {object} payload - Token payload (e.g. { userId, email })
 * @param {number} expiresInSeconds - Expiration time in seconds (default: 24 hours)
 * @returns {string} Signed JWT token string
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
 * Verifies a JWT token signature and expiration.
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

  const payloadJson = Buffer.from(encodedPayload, 'base64').toString('utf-8');
  const payload = JSON.parse(payloadJson);

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

  // TODO: Task 2 - Check for existing user by email, create user record, generate signed JWT token, and return 201 Created!
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

  // TODO: Task 2 - Find user by email, compare candidate password with comparePassword, generate signed JWT token, and return 200 OK!
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
      path: "src/middleware/auth.js",
      content: `const { verifyToken } = require('../utils/jwt');
const { findUserById } = require('../models/User');

/**
 * Express / HTTP middleware verifying Bearer JWT tokens
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  // TODO: Task 3 - Validate Bearer token header, verify with verifyToken, attach decoded user to req.user, and call next()!
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Format must be: Bearer <token>'
    });
  }

  // TODO: Verify token and attach user payload to req.user, then invoke next()
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
    let nextCalled = false;
    authMiddleware(req, res, () => {
      nextCalled = true;
      authController.getMe(req, res);
    });
    if (!nextCalled) {
      // Middleware sent 401 or handled response
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
    "Build a REST API for a community feedback board using Node.js, Express, MongoDB, and Mongoose. Implement the endpoints to fetch, create, and upvote feedback items.",
  track: "fullstack",
  difficulty: "beginner",
  tasks: [
    {
      order: 1,
      title: "Implement GET /api/feedback",
      description:
        "Connect the feedback list to the database by implementing the GET /api/feedback route handler. The endpoint must retrieve all saved feedback entries from the database and return them as a JSON array.",
      instructions:
        "1. Open `backend/src/feedback.js`.\n2. In `router.get('/', ...)` route handler, use `Feedback.find()` to query all feedback documents.\n3. Sort the items in descending order by `createdAt` or `votes`.\n4. Return the documents with HTTP status 200 as a JSON array.\n5. Handle errors gracefully by returning status 500.",
      goal: "Fetch and return all stored feedback items from the database in descending order.",
      targetFiles: ["backend/src/feedback.js", "backend/src/routes.js"],
      concepts: ["Express Router", "Mongoose Queries (find, sort)", "REST GET Convention", "Async/Await Route Handlers"],
      difficulty: "beginner",
      evaluationCriteria: [
        "GET /api/feedback retrieves all feedback entries from the database",
        "Sorts feedback items in descending order by votes or creation date",
        "Responds with HTTP status 200 and a JSON array of feedback documents",
      ],
    },
    {
      order: 2,
      title: "Implement POST /api/feedback",
      description:
        "Enable users to submit new ideas and issues by implementing the POST /api/feedback route handler. Validate incoming payload fields, create a new document in the database with initial zero votes, and respond with the created record.",
      instructions:
        "1. Open `backend/src/feedback.js`.\n2. Add a `router.post('/', ...)` route handler.\n3. Extract `title`, `description`, and `category` from `req.body`.\n4. Validate that `title` and `description` are non-empty strings; if missing, return HTTP status 400 Bad Request with an error message.\n5. Create a new document with `Feedback.create({ title, description, category, votes: 0 })`.\n6. Return HTTP status 201 Created with the newly created feedback object.",
      goal: "Validate request body, create a new feedback item in MongoDB, and return it with HTTP status 201.",
      targetFiles: ["backend/src/feedback.js", "backend/src/models/Feedback.js"],
      concepts: ["Express POST Routes", "Request Body Parsing", "Mongoose Create", "Validation & 400/201 Status Codes"],
      difficulty: "beginner",
      evaluationCriteria: [
        "POST /api/feedback validates required fields (title and description) and returns 400 Bad Request if missing",
        "Creates a new feedback item in the database with 0 initial votes",
        "Responds with HTTP status 201 and the newly created feedback document",
      ],
    },
    {
      order: 3,
      title: "Implement POST /api/feedback/:id/upvote",
      description:
        "Allow users to upvote feedback submissions by implementing the POST /api/feedback/:id/upvote route handler. Extract the item ID parameter, increment the vote counter by 1, persist the change, and return the updated document.",
      instructions:
        "1. Open `backend/src/feedback.js`.\n2. Add a `router.post('/:id/upvote', ...)` route handler.\n3. Extract `req.params.id`.\n4. Locate the item with `Feedback.findById(id)` or `Feedback.findByIdAndUpdate(id, { $inc: { votes: 1 } })`.\n5. If the item is not found, return HTTP status 404 Not Found.\n6. If found, increment votes, save, and return HTTP status 200 with the updated document.",
      goal: "Increment the vote tally of a target feedback document and return the updated record.",
      targetFiles: ["backend/src/feedback.js", "backend/src/models/Feedback.js"],
      concepts: ["URL Parameters (req.params)", "Atomic Updates ($inc)", "404 Not Found Error Handling", "Document Mutation"],
      difficulty: "intermediate",
      evaluationCriteria: [
        "POST /api/feedback/:id/upvote extracts the target item ID from parameters",
        "Increments the votes field of the item by exactly 1 and persists the update",
        "Responds with HTTP status 200 and the updated feedback document",
        "Returns HTTP status 404 if the item ID does not exist",
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
    "start": "node backend/src/server.js"
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
      path: "backend/src/server.js",
      content: `const express = require('express');
const cors = require('cors');
const feedbackRoutes = require('./feedback');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount Feedback REST API routes
app.use('/api/feedback', feedbackRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Feedback Board Backend API',
    timestamp: new Date().toISOString()
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
  });
}

module.exports = app;
`,
      visible: true,
      editable: true,
    },
    {
      path: "backend/src/feedback.js",
      content: `const express = require('express');
const router = express.Router();
const Feedback = require('./models/Feedback');

/**
 * GET /api/feedback
 * Task 1: Retrieve all feedback items
 *
 * Expected behavior:
 * - Query the database for all feedback entries using Feedback.find().
 * - Sort the items so the newest entries or highest votes appear first.
 * - Respond with HTTP status 200 and a JSON array of feedback objects.
 */
router.get('/', async (req, res) => {
  try {
    // TODO: Task 1 - Query all feedback items and return with status 200
    res.status(501).json({ message: 'GET /api/feedback not implemented yet' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TODO: Task 2 - Implement POST /api/feedback
// router.post('/', async (req, res) => { ... });

// TODO: Task 3 - Implement POST /api/feedback/:id/upvote
// router.post('/:id/upvote', async (req, res) => { ... });

module.exports = router;
`,
      visible: true,
      editable: true,
    },
    {
      path: "backend/src/routes.js",
      content: `const express = require('express');
const router = express.Router();
const feedbackRoutes = require('./feedback');

router.use('/feedback', feedbackRoutes);

module.exports = router;
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

const Feedback = {
  schema: feedbackSchema,

  find(query = {}) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return RealModel.find(query);
    }
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
};

module.exports = Feedback;
`,
      visible: true,
      editable: true,
    },
    {
      path: "README.md",
      content: `# Full-Stack Feedback Board Project

A community feedback board REST API built with Node.js, Express, and Mongoose.

## Project Structure

\`\`\`
feedback-board/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── Feedback.js   # Mongoose model for feedback items
│   │   ├── routes/
│   │   │   └── feedback.js   # API route handlers (Learner Tasks 1, 2, and 3)
│   │   └── server.js         # Express server setup
│   └── routes.js
└── package.json
\`\`\`
`,
      visible: true,
      editable: true,
    },
  ],
};

export const allSeedProjects: SeedProject[] = [
  authSeedProject,
  feedbackBoardSeedProject,
];
