import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = {
    conn: null,
    promise: null,
  };
}

export function getCleanMongoUri(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined. Check your .env file."
    );
  }

  return uri;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached!.conn && mongoose.connection.readyState === 1) {
    return cached!.conn;
  }

  const uri = getCleanMongoUri();

  if (!cached!.promise || mongoose.connection.readyState === 0) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached!.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        console.log("MongoDB connected");
        console.log("MongoDB host:", mongoose.connection.host);
        console.log("MongoDB database:", mongoose.connection.name);

        return mongooseInstance;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (error) {
    cached!.promise = null;
    cached!.conn = null;

    console.error("MongoDB connection failed:", error);

    throw error;
  }

  return cached!.conn;
}

export function getDatabaseInfo() {
  const isConnected = mongoose.connection.readyState === 1;
  const host = mongoose.connection.host || "unknown";
  const dbName = mongoose.connection.name || "unknown";

  const isAtlas =
    host.includes("mongodb.net") || host.includes("atlas");

  return {
    isConnected,
    host,
    isAtlas,
    dbName,
    readyState: mongoose.connection.readyState,
  };
}

export default connectToDatabase;