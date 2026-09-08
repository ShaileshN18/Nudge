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
  cached = global.mongooseCache = { conn: null, promise: null };
}

export function getCleanMongoUri(): string {
  const uri = process.env.MONGODB_URI || "";

  // Detect unconfigured placeholder credentials in URI
  const isPlaceholder =
    uri.includes("<username>") ||
    uri.includes("<password>") ||
    uri.includes("<cluster>");

  if (isPlaceholder || !uri) {
    // If invalid placeholder or missing, fallback to local MongoDB instance
    return "mongodb://127.0.0.1:27017/nudge";
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
      serverSelectionTimeoutMS: 5000, // 5s timeout instead of 30s
    };

    cached!.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    cached!.conn = null;
    throw e;
  }

  return cached!.conn;
}

export function getDatabaseInfo() {
  const isConnected = mongoose.connection.readyState === 1;
  const host = mongoose.connection.host || "unknown";
  const isAtlas = host.includes("mongodb.net") || host.includes("atlas");
  const dbName = mongoose.connection.name || "nudge";

  return {
    isConnected,
    host,
    isAtlas,
    dbName,
    readyState: mongoose.connection.readyState,
  };
}

export default connectToDatabase;
