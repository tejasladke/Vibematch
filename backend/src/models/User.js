import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    age: {
      type: Number,
      min: 13,
      max: 100,
    },
    bio: {
      type: String,
      maxlength: 300,
      default: 'Planning spontaneous activities! ⚡',
    },
    interests: [
      {
        type: String,
      },
    ],
    location: {
      type: String,
      trim: true,
    },
    socialLinks: {
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    notificationPreferences: {
      joinRequests: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      planUpdates: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
