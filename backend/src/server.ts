import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import mongoose from "mongoose";

// Import models so they are registered with Mongoose
import User from "./models/User";
import Project from "./models/Project";
import UserProject from "./models/UserProject";
import TaskAttempt from "./models/TaskAttempt";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Basic Health Check route
app.get("/", (req: Request, res: Response) => {
  res.send("Nudge Backend API is running!");
});

// Connect to MongoDB and create collections on Atlas
const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) {
      throw new Error("MONGODB_URI is not defined in .env file");
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(connStr);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);

    // Explicitly create collections on Atlas if they don't already exist
    console.log("Initializing collections on MongoDB Atlas...");
    await Promise.all([
      User.createCollection(),
      Project.createCollection(),
      UserProject.createCollection(),
      TaskAttempt.createCollection(),
    ]);
    console.log("Collections initialized successfully on MongoDB Atlas!");

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

// Connect to database and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
