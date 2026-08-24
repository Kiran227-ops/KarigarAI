import mongoose from 'mongoose';
import dns from 'dns';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI in .env.local');
}

// Use public DNS instead of the problematic local DNS resolver
dns.setServers(['1.1.1.1']);

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global._mongooseCache ?? {
    conn: null,
    promise: null,
  };

global._mongooseCache = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      family: 4,
    }).then((m) => m);
  }

  cached.conn = await cached.promise;

  return cached.conn;
}