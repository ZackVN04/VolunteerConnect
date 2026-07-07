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

const fixImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  return url.replace('http://localhost:3000/', 'http://localhost:8000/');
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

  const userId = beUser.id || beUser._id;
  // Dữ liệu profile được đọc trực tiếp từ API backend, không còn lưu cache localStorage

  return {
    _id: userId,
    phone: beUser.phone_number || '',
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
      avatar_url: fixImageUrl(beUser.avatar_url),
      bio: beUser.bio || null,
      joined_activity_count: beUser.joined_activity_count || 0,
      skills: beUser.skills || [],
      area_of_interest: beUser.area_of_interest || null,
      organizer_request_status: statusMap[beUser.organizer_request_status] || 'None',
      organizer_request_feedback: beUser.organizer_request_feedback || null,
      age: beUser.age ?? undefined,
      gender: beUser.gender || undefined
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
  register: async (fullname: string, email: string, phone: string, password_raw: string): Promise<{ message: string; user_id: string }> => {
    const formattedPhone = formatPhoneE164(phone);
    // Backend: POST /api/v1/auth/register, body: { email, password, phone_number, full_name }
    const res = await api.post('/auth/register', { 
      email, 
      phone_number: formattedPhone, 
      password: password_raw,
      full_name: fullname
    });
    return res.data;
  },
  verifyOtp: async (email: string, otpCode: string): Promise<any> => {
    // Backend: POST /api/v1/auth/verify-otp, body: { email, otp_code }
    const res = await api.post('/auth/verify-otp', { 
      email, 
      otp_code: otpCode 
    });
    return res.data;
  },
  getCurrentUser: async (): Promise<User> => {
    // Backend: GET /api/v1/users/me
    const res = await api.get('/users/me');
    return mapBackendUserToFrontend(res.data);
  },
  forgotPassword: async (email: string): Promise<any> => {
    // Backend: POST /api/v1/auth/forgot-password, body: { email }
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (email: string, otpCode: string, newPasswordRaw: string): Promise<any> => {
    // Backend: POST /api/v1/auth/reset-password, body: { email, otp_code, new_password }
    const res = await api.post('/auth/reset-password', { 
      email, 
      otp_code: otpCode, 
      new_password: newPasswordRaw 
    });
    return res.data;
  },
  resendOtp: async (email: string): Promise<any> => {
    // Backend: POST /api/v1/auth/resend-otp, body: { email }
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
  },
  refreshToken: async (token: string): Promise<any> => {
    // Backend: POST /api/v1/auth/refresh-token, body: { refresh_token }
    const res = await api.post('/auth/refresh-token', { refresh_token: token });
    return res.data;
  },
  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
  }
};


const STATUS_MAP: Record<string, Activity['status']> = {
  'draft': 'Draft',
  'pending_review': 'Pending Review',
  'open': 'Open',
  'full': 'Full',
  'ongoing': 'Ongoing',
  'completed': 'Completed',
  'rejected': 'Rejected',
  'cancelled': 'Cancelled'
};

const mapActivity = (act: any): Activity => {
  if (!act) return act;
  const rawStatus = (act.status || '').toLowerCase().replace(/ /g, '_');
  return {
    ...act,
    _id: act._id || act.id,
    image_url: fixImageUrl(act.image_url),
    status: STATUS_MAP[rawStatus] || act.status
  };
};

const mapRegistration = (reg: any): Registration => {
  if (!reg) return reg;
  return {
    ...reg,
    _id: reg._id || reg.id
  };
};

// Activity Services
export const activityService = {
  getAll: async (): Promise<Activity[]> => {
    const res = await api.get('/activities?limit=100');
    const acts = res.data?.data?.activities || [];
    return acts.map(mapActivity);
  },
  getById: async (id: string): Promise<Activity> => {
    const res = await api.get(`/activities/${id}`);
    return mapActivity(res.data?.data);
  },
  create: async (activityData: Partial<Activity>, submitForReview: boolean): Promise<Activity> => {
    const res = await api.post('/activities', activityData);
    const created = mapActivity(res.data?.data);
    if (submitForReview && created?._id) {
      const submitRes = await api.post(`/activities/${created._id}/submit`);
      return mapActivity(submitRes.data?.data);
    }
    return created;
  },
  edit: async (id: string, activityData: Partial<Activity>): Promise<Activity> => {
    const res = await api.patch(`/activities/${id}`, activityData);
    return mapActivity(res.data?.data);
  },
  submit: async (id: string): Promise<Activity> => {
    const res = await api.post(`/activities/${id}/submit`);
    return mapActivity(res.data?.data);
  },
  cancel: async (id: string): Promise<void> => {
    await api.post(`/activities/${id}/cancel`);
  },
  getOrganizerActivities: async (): Promise<Activity[]> => {
    const res = await api.get('/organizer/activities?limit=100');
    const acts = res.data?.data?.activities || [];
    return acts.map(mapActivity);
  }
};

// Registration & Attendance Services
export const registrationService = {
  getVolunteerRegistrations: async (): Promise<Registration[]> => {
    const res = await api.get('/users/me/registrations?limit=100');
    const regs = res.data?.data?.registrations || [];
    return regs.map(mapRegistration);
  },
  getActivityRegistrations: async (activityId: string): Promise<Registration[]> => {
    const res = await api.get(`/activities/${activityId}/registrations?limit=100`);
    const regs = res.data?.data?.registrations || [];
    return regs.map(mapRegistration);
  },
  register: async (activityId: string): Promise<Registration> => {
    const res = await api.post(`/activities/${activityId}/registrations`);
    return mapRegistration(res.data?.data);
  },
  cancel: async (registrationId: string): Promise<Registration> => {
    const res = await api.post(`/registrations/${registrationId}/cancel`);
    return mapRegistration(res.data?.data);
  },
  approve: async (registrationId: string): Promise<Registration> => {
    const res = await api.post(`/registrations/${registrationId}/approve`);
    return mapRegistration(res.data?.data);
  },
  reject: async (registrationId: string, reason?: string): Promise<Registration> => {
    const res = await api.post(`/registrations/${registrationId}/reject`, { reason });
    return mapRegistration(res.data?.data);
  },
  updateParticipation: async (registrationId: string, status: 'Completed' | 'Absent'): Promise<Registration> => {
    const res = await api.post(`/registrations/${registrationId}/check-in`, { status });
    return mapRegistration(res.data?.data);
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
  },
  delete: async (postId: string): Promise<void> => {
    // Backend: DELETE /api/v1/posts/{id}
    await api.delete(`/posts/${postId}`);
  },
  share: async (postId: string): Promise<Post> => {
    // Backend: POST /api/v1/posts/{id}/share
    const res = await api.post(`/posts/${postId}/share`);
    return res.data;
  }
};

// User Profile Services
export const userService = {
  updateProfile: async (
    updatedProfile: Partial<UserProfile> & { phone?: string; age?: number; gender?: string }
  ): Promise<User> => {
    // Backend: PUT /api/v1/users/me, body: { full_name, avatar_url, bio, skills, area_of_interest, phone_number, age, gender }
    const res = await api.put('/users/me', { 
      full_name: updatedProfile.full_name,
      avatar_url: updatedProfile.avatar_url,
      bio: updatedProfile.bio,
      skills: updatedProfile.skills,
      area_of_interest: updatedProfile.area_of_interest,
      phone_number: updatedProfile.phone,
      age: updatedProfile.age,
      gender: updatedProfile.gender
    });
    return mapBackendUserToFrontend(res.data);
  },
  getById: async (userId: string): Promise<User> => {
    // Backend: GET /api/v1/users/{id}
    const res = await api.get(`/users/${userId}`);
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
    const endpoint = approve ? `/admin/requests/${requestId}/approve` : `/admin/requests/${requestId}/reject`;
    const res = await api.patch(endpoint, {
      status: approve ? 'approved' : 'rejected',
      reason: feedback
    });
    return res.data;
  },
  getActivities: async (): Promise<Activity[]> => {
    const res = await api.get('/admin/activities');
    return res.data;
  },
  approveActivity: async (activityId: string, approve: boolean): Promise<Activity> => {
    const res = await api.patch(`/admin/activities/${activityId}/approve`, {
      is_approved: approve
    });
    return res.data;
  },
  getStatistics: async (): Promise<any> => {
    const res = await api.get('/admin/statistics');
    return res.data;
  }
};

// Media/File Upload Services
export const mediaService = {
  upload: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  }
};
