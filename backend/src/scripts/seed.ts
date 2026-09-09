import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import Project from "../models/Project";

const sampleProjects = [
  {
    slug: "build-express-mongodb-auth",
    title: "Build JWT Auth with Express & Mongoose",
    description: "Implement user authentication, password hashing with bcrypt, and JWT middleware token validation.",
    track: "backend",
    difficulty: "beginner",
    tasks: [
      {
        order: 1,
        title: "Setup User Model",
        description: "Define the Mongoose schema for User with name, email, and passwordHash.",
        goal: "Complete User.js with required schema fields.",
        targetFiles: ["models/User.js"],
        evaluationCriteria: ["User schema contains email with unique: true", "Password field is named passwordHash"],
      },
      {
        order: 2,
        title: "Create Registration Endpoint",
        description: "Implement POST /register to hash password with bcrypt and save user.",
        goal: "Hash password using bcrypt and return user object without passwordHash.",
        targetFiles: ["routes/auth.js"],
        evaluationCriteria: ["Password is encrypted with bcrypt", "Returns 201 status code on success"],
      },
    ],
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "express-auth-project",
            version: "1.0.0",
            main: "index.js",
            scripts: {
              dev: "node index.js",
              start: "node index.js",
            },
            dependencies: {
              express: "^4.19.2",
            },
          },
          null,
          2
        ),
        type: "json",
        visible: true,
        editable: false,
      },
      {
        path: "index.js",
        content: `const express = require('express');\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\n\napp.get('/', (req, res) => {\n  res.send({ status: 'API is live!' });\n});\n\napp.listen(PORT, () => {\n  console.log('Server running on port ' + PORT);\n});\n`,
        type: "javascript",
        visible: true,
        editable: true,
      },
      {
        path: "models/User.js",
        content: `// TODO: Implement User Schema\nconst mongoose = require('mongoose');\n\nconst UserSchema = new mongoose.Schema({\n  // Define fields here\n});\n\nmodule.exports = mongoose.model('User', UserSchema);\n`,
        type: "javascript",
        visible: true,
        editable: true,
      },
      {
        path: "routes/auth.js",
        content: `const express = require('express');\nconst router = express.Router();\n\n// TODO: Implement register & login endpoints\n\nmodule.exports = router;\n`,
        type: "javascript",
        visible: true,
        editable: true,
      },
      {
        path: ".test/evaluator.js",
        content: `// Hidden automated evaluator script\nconsole.log('Evaluation suite initialized');\n`,
        type: "javascript",
        visible: false,
        editable: false,
      },
    ],
  },
  {
    slug: "react-task-board",
    title: "Interactive React Task Kanban Board",
    description: "Build an interactive Kanban board with drag-and-drop task columns, state management, and real-time status updates.",
    track: "frontend",
    difficulty: "intermediate",
    tasks: [
      {
        order: 1,
        title: "Task Column Component",
        description: "Render columns for To Do, In Progress, and Done.",
        goal: "Filter tasks by status and render inside Column components.",
        targetFiles: ["src/App.jsx"],
        evaluationCriteria: ["Renders 3 columns", "Each column shows correct task counts"],
      },
    ],
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "react-task-board",
            version: "1.0.0",
            scripts: {
              dev: "node server.js",
            },
          },
          null,
          2
        ),
        type: "json",
        visible: true,
        editable: false,
      },
      {
        path: "src/App.jsx",
        content: `import React, { useState } from 'react';\n\nexport default function App() {\n  const [tasks, setTasks] = useState([]);\n  return (\n    <div>\n      <h1>Kanban Board</h1>\n    </div>\n  );\n}\n`,
        type: "javascript",
        visible: true,
        editable: true,
      },
      {
        path: ".env.hidden",
        content: "API_SECRET=super_secret_evaluation_token\n",
        type: "text",
        visible: false,
        editable: false,
      },
    ],
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in .env or .env.local");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("Connected to database.");

    for (const p of sampleProjects) {
      const existing = await Project.findOne({ slug: p.slug });
      if (existing) {
        await Project.updateOne({ slug: p.slug }, p);
        console.log(`Updated project: ${p.title} (${p.slug})`);
      } else {
        await Project.create(p);
        console.log(`Created project: ${p.title} (${p.slug})`);
      }
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

seed();
