export type PlanCategory =
  | 'Movie'
  | 'Café'
  | 'Turf'
  | 'Trip'
  | 'Trekking'
  | 'Concert'
  | 'Festival'
  | 'Study'
  | 'Food'
  | 'Gaming'
  | 'Sports'
  | 'Other';

export type TravelPreference =
  | 'Own Vehicle'
  | 'Metro/Public'
  | 'Carpool'
  | 'Cab Split'
  | 'Flexible';

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type PlanStatus = 'open' | 'full' | 'completed' | 'cancelled';
export type NotificationType =
  | 'join_request_received'
  | 'join_request_accepted'
  | 'join_request_rejected'
  | 'new_message'
  | 'system';

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  age?: number;
  bio?: string;
  interests: string[];
  location?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  notificationPreferences?: {
    joinRequests: boolean;
    messages: boolean;
    planUpdates: boolean;
    sound: boolean;
  };
  blockedUsers?: string[];
  createdAt: string;
}

export interface Plan {
  id: string;
  title: string;
  category: PlanCategory;
  date: string;
  time: string;
  location: string;
  maxPeople: number;
  joinedCount: number;
  budget: string;
  description: string;
  travelPreference: TravelPreference;
  image?: string;
  creatorId: string;
  creator?: User;
  members?: (User | string)[];
  status: PlanStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface JoinRequest {
  id: string;
  planId: string;
  plan?: Plan;
  requesterId: string;
  requester?: User;
  creatorId: string;
  creator?: User;
  status: RequestStatus;
  message?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Connection {
  id: string;
  users: [User, User];
  userIds: [string, string];
  planId: string;
  plan?: Plan;
  status: 'active' | 'blocked';
  blockedBy?: string;
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
}

export interface Message {
  id: string;
  connectionId: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  content: string;
  imageUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId?: string;
  sender?: User;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    planId?: string;
    requestId?: string;
    connectionId?: string;
    senderId?: string;
  };
  isRead: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
  user?: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
