import {
  ApiResponse,
  AuthResponse,
  Connection,
  JoinRequest,
  Message,
  Notification,
  Plan,
  PlanCategory,
  TravelPreference,
  User,
} from '../types/index.js';

// Render backend
const API_BASE = 'https://vibematch-301t.onrender.com/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('planmate_token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // =========================================================
  // AUTH
  // =========================================================

  async register(data: {
    name: string;
    phone: string;
    password: string;
    age?: number;
    bio?: string;
    interests?: string[];
    location?: string;
    socialLinks?: {
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
    avatar?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return res.json();
  },

  async login(
    phone: string,
    password: string
  ): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        password,
      }),
    });

    return res.json();
  },

  async getMe(): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });

    return res.json();
  },

  // =========================================================
  // PLANS
  // =========================================================

  async getPlans(params?: {
    search?: string;
    category?: string;
    location?: string;
    date?: string;
    timeFrame?: string;
    status?: string;
  }): Promise<{
    success: boolean;
    data: Plan[];
    count: number;
  }> {
    const query = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val) {
          query.append(key, val);
        }
      });
    }

    const queryString = query.toString();

    const res = await fetch(
      `${API_BASE}/plans${queryString ? `?${queryString}` : ''}`,
      {
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  async getPlanById(
    id: string
  ): Promise<{
    success: boolean;
    data: Plan & {
      remainingSlots: number;
      userRelation?: {
        isCreator: boolean;
        isMember: boolean;
        hasPendingRequest: boolean;
        joinRequestId: string | null;
        connectionId: string | null;
      };
    };
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/plans/${id}`, {
      headers: getAuthHeaders(),
    });

    return res.json();
  },

  async createPlan(planData: {
    title: string;
    category: PlanCategory;
    date: string;
    time: string;
    location: string;
    maxPeople: number;
    budget: string;
    description: string;
    travelPreference: TravelPreference;
    image?: string;
  }): Promise<ApiResponse<Plan>> {
    const res = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(planData),
    });

    return res.json();
  },

  async updatePlan(
    id: string,
    updates: Partial<Plan>
  ): Promise<ApiResponse<Plan>> {
    const res = await fetch(`${API_BASE}/plans/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    return res.json();
  },

  async deletePlan(id: string): Promise<ApiResponse> {
    const res = await fetch(`${API_BASE}/plans/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return res.json();
  },

  async getMyCreatedPlans(): Promise<{
    success: boolean;
    data: (Plan & {
      pendingRequestsCount: number;
    })[];
  }> {
    const res = await fetch(
      `${API_BASE}/plans/my/created`,
      {
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  async getMyJoinedPlans(): Promise<{
    success: boolean;
    data: Plan[];
  }> {
    const res = await fetch(
      `${API_BASE}/plans/my/joined`,
      {
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  // =========================================================
  // JOIN REQUESTS
  // =========================================================

  async createJoinRequest(
    planId: string,
    message?: string
  ): Promise<ApiResponse<JoinRequest>> {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        planId,
        message,
      }),
    });

    return res.json();
  },

  async getIncomingRequests(): Promise<{
    success: boolean;
    data: JoinRequest[];
  }> {
    const res = await fetch(
      `${API_BASE}/requests/incoming`,
      {
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  async getMySentRequests(): Promise<{
    success: boolean;
    data: JoinRequest[];
  }> {
    const res = await fetch(
      `${API_BASE}/requests/sent`,
      {
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  async acceptRequest(
    requestId: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      connectionId: string;
    };
  }> {
    const res = await fetch(
      `${API_BASE}/requests/${requestId}/accept`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  async rejectRequest(
    requestId: string
  ): Promise<ApiResponse> {
    const res = await fetch(
      `${API_BASE}/requests/${requestId}/reject`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  // =========================================================
  // CONNECTIONS / SQUAD
  // =========================================================

  async getConnections(): Promise<{
    success: boolean;
    data: Connection[];
  }> {
    const res = await fetch(
      `${API_BASE}/connections`,
      {
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  async getConnectionById(
    id: string
  ): Promise<{
    success: boolean;
    data: Connection;
    error?: string;
  }> {
    const res = await fetch(
      `${API_BASE}/connections/${id}`,
      {
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  async toggleBlockConnection(
    id: string
  ): Promise<{
    success: boolean;
    message: string;
    data: Connection;
  }> {
    const res = await fetch(
      `${API_BASE}/connections/${id}/block`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  async reportUser(
    reportedUserId: string,
    reason: string,
    details?: string
  ): Promise<ApiResponse> {
    const res = await fetch(
      `${API_BASE}/connections/report`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reportedUserId,
          reason,
          details,
        }),
      }
    );

    return res.json();
  },

  // =========================================================
  // CHAT
  // =========================================================

  async getMessages(
    connectionId: string
  ): Promise<{
    success: boolean;
    data: Message[];
    error?: string;
  }> {
    const res = await fetch(
      `${API_BASE}/chat/${connectionId}/messages`,
      {
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  async sendMessage(
    connectionId: string,
    content?: string,
    imageUrl?: string
  ): Promise<{
    success: boolean;
    data: Message;
    error?: string;
  }> {
    const res = await fetch(
      `${API_BASE}/chat/${connectionId}/messages`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content,
          imageUrl,
        }),
      }
    );

    return res.json();
  },

  async markMessagesRead(
    connectionId: string
  ): Promise<ApiResponse> {
    const res = await fetch(
      `${API_BASE}/chat/${connectionId}/read`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  async getNotifications(): Promise<{
    success: boolean;
    data: Notification[];
    unreadCount: number;
  }> {
    const res = await fetch(
      `${API_BASE}/notifications`,
      {
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  async markNotificationRead(
    id: string
  ): Promise<ApiResponse> {
    const res = await fetch(
      `${API_BASE}/notifications/${id}/read`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  async markAllNotificationsRead(): Promise<ApiResponse> {
    const res = await fetch(
      `${API_BASE}/notifications/read-all`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  // =========================================================
  // USER PROFILE / SETTINGS
  // =========================================================

  async getUserProfile(
    id: string
  ): Promise<{
    success: boolean;
    data: {
      user: User;
      createdPlans: Plan[];
      joinedPlans: Plan[];
      stats: {
        createdCount: number;
        joinedCount: number;
      };
    };
    error?: string;
  }> {
    const res = await fetch(
      `${API_BASE}/users/${id}`,
      {
        headers: getAuthHeaders(),
      }
    );

    return res.json();
  },

  async updateProfile(
    profileData: Partial<User>
  ): Promise<ApiResponse<User>> {
    const res = await fetch(
      `${API_BASE}/users/profile`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
      }
    );

    return res.json();
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    const res = await fetch(
      `${API_BASE}/users/password`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      }
    );

    return res.json();
  },

  async updateNotificationPreferences(
    preferences: {
      joinRequests?: boolean;
      messages?: boolean;
      planUpdates?: boolean;
      sound?: boolean;
    }
  ): Promise<ApiResponse> {
    const res = await fetch(
      `${API_BASE}/users/notification-preferences`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          preferences,
        }),
      }
    );

    return res.json();
  },

  // =========================================================
  // IMAGE UPLOAD
  // =========================================================

  async uploadImage(
    image: string,
    folder: 'avatars' | 'plans' | 'chat' = 'plans'
  ): Promise<{
    success: boolean;
    url: string;
    error?: string;
  }> {
    const res = await fetch(
      `${API_BASE}/upload`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          image,
          folder,
        }),
      }
    );

    return res.json();
  },
};