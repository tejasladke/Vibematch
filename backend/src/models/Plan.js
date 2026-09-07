import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Plan title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Movie',
        'Café',
        'Turf',
        'Trip',
        'Trekking',
        'Concert',
        'Festival',
        'Study',
        'Food',
        'Gaming',
        'Sports',
        'Other',
      ],
    },
    date: {
      type: String,
      required: [true, 'Plan date is required'],
    },
    time: {
      type: String,
      required: [true, 'Plan time is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    maxPeople: {
      type: Number,
      required: [true, 'Maximum number of people is required'],
      min: 2,
    },
    joinedCount: {
      type: Number,
      default: 1,
    },
    budget: {
      type: String,
      default: 'Split evenly',
    },
    description: {
      type: String,
      trim: true,
    },
    travelPreference: {
      type: String,
      enum: ['Own Vehicle', 'Metro/Public', 'Carpool', 'Cab Split', 'Flexible'],
      default: 'Flexible',
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['open', 'full', 'completed', 'cancelled'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

export const Plan = mongoose.model('Plan', planSchema);
