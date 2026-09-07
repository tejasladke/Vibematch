import mongoose, { Schema, Model } from 'mongoose';
import {
  Connection,
  JoinRequest,
  Message,
  Notification,
  Plan,
  User,
} from '../src/types/index.js';

/**
 * MongoDB user document.
 *
 * The rest of the application uses Map-style access (db.users.get/set/etc.).
 * PersistentUserMap keeps that existing API while automatically syncing users
 * to the MongoDB `users` collection.
 */
type UserWithPassword = User & { passwordHash: string };

const userSchema = new Schema<UserWithPassword>(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String },
    age: { type: Number },
    bio: { type: String },
    interests: { type: [String], default: [] },
    location: { type: String },
    socialLinks: {
      instagram: { type: String },
      twitter: { type: String },
      linkedin: { type: String },
    },
    notificationPreferences: {
      joinRequests: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      planUpdates: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
    },
    blockedUsers: { type: [String], default: [] },
    createdAt: { type: String, required: true },
  },
  {
    collection: 'users',
    versionKey: false,
    timestamps: false,
  }
);

const UserModel: Model<UserWithPassword> =
  (mongoose.models.PlanMateUser as Model<UserWithPassword>) ||
  mongoose.model<UserWithPassword>('PlanMateUser', userSchema);

/**
 * A Map that also persists every user change to MongoDB.
 *
 * This lets the existing controllers continue to use:
 *   db.users.get(...)
 *   db.users.set(...)
 *   db.users.values()
 *
 * without rewriting the whole application.
 */
class PersistentUserMap extends Map<string, UserWithPassword> {
  private mongoReady = false;

  public markMongoReady(): void {
    this.mongoReady = true;
  }

  public async loadFromMongo(): Promise<number> {
    const documents = await UserModel.find().lean();

    // Clear only the in-memory user cache and repopulate it from MongoDB.
    super.clear();

    for (const document of documents) {
      const user = document as unknown as UserWithPassword;
      const id = user.id || String((document as { _id?: unknown })._id);

      if (id) {
        super.set(id, {
          ...user,
          id,
        });
      }
    }

    return documents.length;
  }

  public override set(key: string, value: UserWithPassword): this {
    super.set(key, value);

    if (this.mongoReady) {
      void this.saveUser(key, value).catch((error) => {
        console.error('[DB] Background user save failed:', error);
      });
    }

    return this;
  }

  public async saveUser(key: string, value: UserWithPassword): Promise<void> {
    if (!this.mongoReady) {
      throw new Error('MongoDB is not ready. Cannot save user.');
    }
    await this.persistUser(key, value);
  }

  public override delete(key: string): boolean {
    const deleted = super.delete(key);

    if (deleted && this.mongoReady) {
      void UserModel.deleteOne({ _id: key }).catch((error) => {
        console.error('[DB] Failed to delete user from MongoDB:', error);
      });
    }

    return deleted;
  }

  private async persistUser(
    key: string,
    value: UserWithPassword
  ): Promise<void> {
    try {
      const document = {
        ...value,
        _id: key,
        id: key,
      };

      await UserModel.replaceOne(
        { _id: key },
        document,
        { upsert: true }
      );

      console.log(`[DB] User saved to MongoDB: ${value.phone}`);
    } catch (error) {
      console.error(
        `[DB] Failed to save user ${key} to MongoDB:`,
        error instanceof Error ? error.message : error
      );
    }
  }
}

// MongoDB / Mongoose connection handler
export async function connectMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    console.error(
      '[DB] MONGODB_URI is missing. MongoDB is required for PlanMate persistence.'
    );
    throw new Error('MONGODB_URI is missing from .env');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    const databaseName = mongoose.connection.db?.databaseName || 'unknown';
    console.log(`[DB] Connected successfully to MongoDB Atlas.`);
    console.log(`[DB] Database: ${databaseName}`);
    console.log(`[DB] User collection: users`);

    const count = await db.users.loadFromMongo();
    db.users.markMongoReady();

    console.log(`[DB] Loaded ${count} user(s) from MongoDB collection "users".`);

    return true;
  } catch (error) {
    console.error(
      '[DB] MongoDB connection failed:',
      error instanceof Error ? error.message : error
    );

    // Do not silently fall back to memory. That was the reason user data
    // appeared in the app but MongoDB Atlas showed 0 documents.
    throw error;
  }
}

// In-Memory stores for the rest of the application's existing features.
// Users are backed by MongoDB through PersistentUserMap above.
export interface ReportRecord {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  details?: string;
  createdAt: string;
}

class InMemoryDB {
  users: PersistentUserMap = new PersistentUserMap();
  plans: Map<string, Plan> = new Map();
  joinRequests: Map<string, JoinRequest> = new Map();
  connections: Map<string, Connection> = new Map();
  messages: Map<string, Message> = new Map();
  notifications: Map<string, Notification> = new Map();
  reports: Map<string, ReportRecord> = new Map();
}

export const db = new InMemoryDB();
