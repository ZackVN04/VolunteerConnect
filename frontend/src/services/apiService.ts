import api from './api';
import type { User, UserProfile, Activity, Registration, OrganizerRequest, Post } from '../context/AppContext';

// Helper to translate E164 phone formats
export const formatPhoneE164 = (phone: string): string => {
  let cleaned = phone.replace(/\s+/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+84' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
};

// Helper mapper to translate backend models to frontend types
export const mapBackendUserToFrontend = (beUser: any): User => {
  const roleMap: Record<string, 'Volunteer' | 'Organizer' | 'Admin'> = {
    'admin': 'Admin',
    'organizer': 'Organizer',
    'volunteer': 'Volunteer'
  };
  const statusMap: Record<string, 'None' | 'Pending' | 'Approved' | 'Rejected'> = {
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected'
  };

  return {
    _id: beUser.id || beUser._id,
    phone: beUser.phone_number,
    is_phone_verified: beUser.status === 'active',
    otp_code: null,
    otp_expires_at: null,
    otp_send_count: 0,
    otp_cooldown_until: null,
    email: beUser.email,
    password_hash: '',
    role: roleMap[beUser.role] || 'Volunteer',
    profile: {
      full_name: beUser.full_name || 'Người dùng',
      avatar_url: beUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150',
      bio: beUser.bio || 'Thành viên Volunteer Connect',
      joined_activity_count: beUser.joined_activity_count || 0,
      skills: beUser.skills || [],
      area_of_interest: beUser.area_of_interest || null,
      organizer_request_status: statusMap[beUser.organizer_request_status] || 'None',
      organizer_request_feedback: beUser.organizer_request_feedback || null
    },
    created_at: beUser.created_at,
    updated_at: beUser.updated_at || beUser.created_at
  };
};

// Auth Services
export const authService = {
  login: async (email: string, password_raw: string): Promise<{ token: string; user: User }> => {
    // Backend: POST /api/v1/auth/login, body: { email, password }
    const res = await api.post('/auth/login', { email, password: password_raw });
    const token = res.data.access_token;
    
    // Immediately save token to localStorage for axios interceptor
    localStorage.setItem('token', token);
    
    // Fetch profile details
    const user = await authService.getCurrentUser();
    return { token, user };
  },
  register: async (email: string, phone: string, password_raw: string): Promise<{ message: string; user_id: string }> => {
    const formattedPhone = formatPhoneE164(phone);
    // Backend: POST /api/v1/auth/register, body: { email, password, phone_number }
    const res = await api.post('/auth/register', { 
      email, 
      phone_number: formattedPhone, 
      password: password_raw 
    });
    return res.data;
  },
  verifyOtp: async (phone: string, otpCode: string): Promise<any> => {
    const formattedPhone = formatPhoneE164(phone);
    // Backend: POST /api/v1/auth/verify-otp, body: { phone_number, otp_code }
    const res = await api.post('/auth/verify-otp', { 
      phone_number: formattedPhone, 
      otp_code: otpCode 
    });
    return res.data;
  },
  getCurrentUser: async (): Promise<User> => {
    // Backend: GET /api/v1/users/me
    const res = await api.get('/users/me');
    return mapBackendUserToFrontend(res.data);
  }
};

// Activity Services
export const activityService = {
  getAll: async (): Promise<Activity[]> => {
    const res = await api.get('/activities');
    return res.data;
  },
  getById: async (id: string): Promise<Activity> => {
    const res = await api.get(`/activities/${id}`);
    return res.data;
  },
  create: async (activityData: Partial<Activity>, submitForReview: boolean): Promise<Activity> => {
    const res = await api.post('/activities', activityData);
    if (submitForReview && res.data._id) {
      const submitRes = await api.post(`/activities/${res.data._id}/submit`);
      return submitRes.data;
    }
    return res.data;
  },
  edit: async (id: string, activityData: Partial<Activity>): Promise<Activity> => {
    const res = await api.patch(`/activities/${id}`, activityData);
    return res.data;
  },
  submit: async (id: string): Promise<Activity> => {
    const res = await api.post(`/activities/${id}/submit`);
    return res.data;
  },
  cancel: async (id: string): Promise<void> => {
    await api.post(`/activities/${id}/cancel`);
  },
  getOrganizerActivities: async (): Promise<Activity[]> => {
    const res = await api.get('/organizer/activities');
    return res.data;
  }
};

// Registration & Attendance Services
export const registrationService = {
  getVolunteerRegistrations: async (): Promise<Registration[]> => {
    const res = await api.get('/users/me/registrations');
    return res.data;
  },
  getActivityRegistrations: async (activityId: string): Promise<Registration[]> => {
    const res = await api.get(`/activities/${activityId}/registrations`);
    return res.data;
  },
  register: async (activityId: string): Promise<Registration> => {
    const res = await api.post(`/activities/${activityId}/registrations`);
    return res.data;
  },
  cancel: async (registrationId: string): Promise<Registration> => {
    const res = await api.post(`/registrations/${registrationId}/cancel`);
    return res.data;
  },
  approve: async (registrationId: string): Promise<Registration> => {
    const res = await api.post(`/registrations/${registrationId}/approve`);
    return res.data;
  },
  reject: async (registrationId: string, reason?: string): Promise<Registration> => {
    const res = await api.post(`/registrations/${registrationId}/reject`, { reason });
    return res.data;
  },
  updateParticipation: async (registrationId: string, status: 'Completed' | 'Absent'): Promise<Registration> => {
    const res = await api.post(`/registrations/${registrationId}/check-in`, { status });
    return res.data;
  }
};

// Organizer Upgrade Role Requests Services
export const organizerService = {
  getMyRequest: async (): Promise<any> => {
    // Backend: GET /api/v1/organizer-requests/my-request
    const res = await api.get('/organizer-requests/my-request');
    return res.data;
  },
  submitRequest: async (reason: string, experience: string, contactPhone: string): Promise<any> => {
    const formattedPhone = formatPhoneE164(contactPhone);
    // Backend: POST /api/v1/organizer-requests/request-upgrade, body: { organization_name, documents }
    const res = await api.post('/organizer-requests/request-upgrade', { 
      organization_name: reason,
      documents: [experience, formattedPhone]
    });
    return res.data;
  }
};

// Post Services
export const postService = {
  getAll: async (): Promise<Post[]> => {
    const res = await api.get('/posts');
    return res.data;
  },
  create: async (content: string, images: string[], hashtags: string[]): Promise<Post> => {
    const res = await api.post('/posts', { content, images, hashtags });
    return res.data;
  },
  like: async (postId: string): Promise<Post> => {
    const res = await api.post(`/posts/${postId}/like`);
    return res.data;
  }
};

// User Profile Services
export const userService = {
  updateProfile: async (updatedProfile: Partial<UserProfile>): Promise<User> => {
    // Backend: PUT /api/v1/users/me, body: { full_name, avatar_url }
    const res = await api.put('/users/me', { 
      full_name: updatedProfile.full_name,
      avatar_url: updatedProfile.avatar_url
    });
    return mapBackendUserToFrontend(res.data);
  }
};

// Admin Workflows Services
export const adminService = {
  getOrganizerRequests: async (): Promise<OrganizerRequest[]> => {
    const res = await api.get('/admin/organizer-requests');
    return res.data;
  },
  approveOrganizerRequest: async (requestId: string, approve: boolean, feedback?: string): Promise<OrganizerRequest> => {
    const res = await api.post(`/admin/organizer-requests/${requestId}/approve`, { approve, feedback });
    return res.data;
  },
  getActivities: async (): Promise<Activity[]> => {
    const res = await api.get('/admin/activities');
    return res.data;
  },
  approveActivity: async (activityId: string, approve: boolean): Promise<Activity> => {
    const res = await api.post(`/admin/activities/${activityId}/approve`, { approve });
    return res.data;
  },
  getStatistics: async (): Promise<any> => {
    const res = await api.get('/admin/statistics');
    return res.data;
  }
};
