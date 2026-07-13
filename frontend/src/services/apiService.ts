import api, { rootApi } from './api';
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
      avatar_url: fixImageUrl(beUser.avatar_url) ?? undefined,
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
    updated_at: beUser.updated_at || beUser.created_at,
    status: beUser.status || 'active'
  };
};


// Auth Services
export const authService = {
  changePassword: async (old_password: string, new_password: string): Promise<any> => {
    const res = await api.post('/auth/change-password', { old_password, new_password });
    return res.data;
  },
  login: async (email: string, password_raw: string): Promise<{ token: string; user: User }> => {
    // Backend: POST /api/v1/auth/login, body: { email, password }
    const res = await api.post('/auth/login', { email, password: password_raw });
    const token = res.data.access_token;
    const refreshToken = res.data.refresh_token;

    // Immediately save tokens to localStorage for axios interceptor
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }

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
  verifyResetOtp: async (email: string, otpCode: string): Promise<any> => {
    const res = await api.post('/auth/verify-reset-otp', { email, otp_code: otpCode });
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
    // Backend: POST /api/v1/auth/refresh, body: { refresh_token }
    const res = await api.post('/auth/refresh', { refresh_token: token });
    return res.data;
  },
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn("Server logout failed", e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
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
  'cancelled': 'Cancelled',
  'approved': 'Open'
};

const mapActivity = (act: any): Activity => {
  if (!act) return act;
  const rawStatus = (act.status || '').toLowerCase().replace(/ /g, '_');
  return {
    ...act,
    _id: act._id || act.id,
    image_url: fixImageUrl(act.image_url),
    status: STATUS_MAP[rawStatus] || act.status,
    denormalized_organizer: act.denormalized_organizer || {
      name: act.organizer_name || 'Ban tổ chức'
    }
  };
};

const REGISTRATION_STATUS_MAP: Record<string, Registration['status']> = {
  'pending': 'Pending',
  'approved': 'Approved',
  'rejected': 'Rejected',
  'completed': 'Completed',
  'absent': 'Absent',
  'cancelled': 'Cancelled'
};

const mapRegistration = (reg: any): Registration => {
  if (!reg) return reg;
  const rawStatus = (reg.status || '').toLowerCase();
  const activityInfo = reg.denormalized_activity || reg.activity || {};
  return {
    ...reg,
    _id: reg._id || reg.id,
    status: REGISTRATION_STATUS_MAP[rawStatus] || reg.status,
    reject_reason: reg.rejection_reason,
    denormalized_volunteer: reg.denormalized_volunteer || reg.volunteer || {
      name: '',
      phone: '',
      email: ''
    },
    denormalized_activity: {
      title: activityInfo.title || '',
      status: activityInfo.status || '',
      start_date: activityInfo.start_date || '',
      end_date: activityInfo.end_date || '',
      organizer_id: activityInfo.organizer_id || reg.organizer_id || null,
      organizer_name: activityInfo.organizer_name || reg.organizer_name || null
    }
  };
};

const REQUEST_STATUS_MAP: Record<string, OrganizerRequest['status']> = {
  'pending': 'Pending',
  'approved': 'Approved',
  'rejected': 'Rejected'
};

const mapOrganizerRequest = (req: any): OrganizerRequest => ({
  ...req,
  _id: req._id || req.id,
  status: REQUEST_STATUS_MAP[(req.status || '').toLowerCase()] || req.status,
  denormalized_volunteer: req.denormalized_volunteer || {
    name: req.denormalized_volunteer?.name || '',
    email: req.denormalized_volunteer?.email || ''
  }
});

const mapPost = (post: any): Post => ({
  _id: post._id || post.id,
  title: post.title,
  author_id: post.author_id,
  content: post.content,
  images: post.images || [],
  video_url: fixImageUrl(post.video_url),
  visibility: 'Public',
  status: 'Active',
  hashtags: post.hashtags || [],
  like_count: post.like_count ?? post.likes ?? 0,
  comment_count: post.comment_count ?? 0,
  share_count: post.share_count ?? post.shares ?? 0,
  created_at: post.created_at,
  updated_at: post.updated_at,
  deleted_at: post.deleted_at ?? null,
  denormalized_author: post.denormalized_author || {
    name: 'Thành viên',
    role: 'Volunteer',
    organization_name: null
  },
  likedByUserIds: post.likedByUserIds || []
});

// Activity Services
export const activityService = {
  getAll: async (): Promise<Activity[]> => {
    const res = await api.get('/activities?limit=100');
    const acts = res.data?.data?.activities || [];
    return acts.map(mapActivity);
  },
  list: async (params: { search?: string; category?: string; province?: string; status?: string; page?: number; limit?: number }): Promise<{ activities: Activity[]; total: number }> => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.province && params.province !== 'All') query.append('province', params.province);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    const res = await api.get(`/activities?${query.toString()}`);
    const data = res.data?.data || {};
    const acts = data.activities || [];
    return {
      activities: acts.map(mapActivity),
      total: data.total || 0
    };
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
    return mapRegistration(res.data?.data || res.data);
  },
  approve: async (registrationId: string): Promise<Registration> => {
    const res = await api.patch(`/registrations/${registrationId}/approve`);
    return mapRegistration(res.data?.data || res.data);
  },
  reject: async (registrationId: string, reason?: string): Promise<Registration> => {
    const res = await api.patch(`/registrations/${registrationId}/reject`, { rejection_reason: reason });
    return mapRegistration(res.data?.data || res.data);
  },
  updateParticipation: async (registrationId: string, status: 'Completed' | 'Absent'): Promise<Registration> => {
    const res = await api.patch(`/registrations/${registrationId}/attendance`, { status: status.toLowerCase() });
    return mapRegistration(res.data?.data || res.data);
  },
  bulkApprove: async (activityId: string, registrationIds: string[]): Promise<any> => {
    const res = await api.patch(`/activities/${activityId}/registrations/bulk-approve`, {
      registration_ids: registrationIds
    });
    return res.data;
  },
  bulkReject: async (activityId: string, registrationIds: string[], reason: string): Promise<any> => {
    const res = await api.patch(`/activities/${activityId}/registrations/bulk-reject`, {
      registration_ids: registrationIds,
      rejection_reason: reason
    });
    return res.data;
  }
};

// Organizer Upgrade Role Requests Services
export const organizerService = {
  getMyRequest: async (): Promise<any> => {
    // Backend: GET /api/v1/organizer-requests/my-request
    // Returns null if no request found (404 is expected when volunteer has no request)
    try {
      const res = await api.get('/organizer-requests/my-request');
      return mapOrganizerRequest(res.data);
    } catch (e: any) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  },
  submitRequest: async (reason: string, experience: string, contactPhone: string): Promise<any> => {
    const formattedPhone = formatPhoneE164(contactPhone);
    // Backend schema: OrganizerRequestCreate { reason, experience, contact_phone }
    const res = await api.post('/organizer-requests/request-upgrade', {
      reason,
      experience,
      contact_phone: formattedPhone
    });
    return mapOrganizerRequest(res.data);
  }
};

// Post Services
export const postService = {
  getAll: async (): Promise<Post[]> => {
    const res = await rootApi.get('/posts/');
    const posts = res.data?.items || [];
    return posts.map(mapPost);
  },
  create: async (title: string, content: string, images: string[], video_url: string | null, hashtags: string[]): Promise<Post> => {
    const res = await rootApi.post('/posts/', { title, content, images, video_url, hashtags });
    return mapPost(res.data);
  },
  update: async (postId: string, title: string, content: string, images: string[], hashtags: string[]): Promise<Post> => {
    const res = await rootApi.put(`/posts/${postId}`, { title, content, images, hashtags });
    return mapPost(res.data);
  },
  like: async (postId: string): Promise<Post> => {
    const res = await rootApi.patch(`/posts/${postId}/like`);
    return mapPost(res.data);
  },
  delete: async (postId: string): Promise<void> => {
    await rootApi.delete(`/posts/${postId}`);
  },
  share: async (postId: string): Promise<Post> => {
    const res = await rootApi.patch(`/posts/${postId}/share`);
    return mapPost(res.data);
  }
};

// Comment Services
export const commentService = {
  getComments: async (postId: string, page = 1, limit = 10): Promise<any[]> => {
    const res = await api.get(`/posts/${postId}/comments/`, { params: { page, limit } });
    return res.data.items || res.data.data?.items || res.data;
  },
  createComment: async (postId: string, content: string): Promise<any> => {
    const res = await api.post(`/posts/${postId}/comments/`, { content });
    return res.data.data || res.data;
  },
  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    await api.delete(`/posts/${postId}/comments/${commentId}`);
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
  getAllRegistrations: async (): Promise<Registration[]> => {
    const res = await rootApi.get('/admin/registrations?limit=500');
    const regs = res.data?.data?.registrations || [];
    return regs.map(mapRegistration);
  },
  getOrganizerRequests: async (): Promise<OrganizerRequest[]> => {
    const res = await rootApi.get('/admin/organizer-requests?limit=100');
    const reqs = res.data?.data?.requests || [];
    return reqs.map(mapOrganizerRequest);
  },
  approveOrganizerRequest: async (requestId: string, approve: boolean, feedback?: string): Promise<any> => {
    const endpoint = approve ? `/admin/requests/${requestId}/approve` : `/admin/requests/${requestId}/reject`;
    const res = await rootApi.patch(endpoint, {
      status: approve ? 'approved' : 'rejected',
      reason: feedback || ""
    });
    return res.data;
  },
  getActivities: async (): Promise<Activity[]> => {
    const res = await rootApi.get('/admin/activities?limit=100');
    const acts = res.data?.data?.activities || [];
    return acts.map(mapActivity);
  },
  approveActivity: async (activityId: string, approve: boolean, feedback?: string): Promise<any> => {
    const res = await rootApi.patch(`/admin/activities/${activityId}/approve`, {
      is_approved: approve,
      reason: feedback
    });
    return res.data;
  },
  getStatistics: async (): Promise<any> => {
    const res = await rootApi.get('/admin/statistics');
    return res.data;
  },
  getUsers: async (): Promise<User[]> => {
    const res = await rootApi.get('/admin/users?limit=100');
    const users = res.data?.data?.users || [];
    return users.map(mapBackendUserToFrontend);
  },
  bulkReviewOrganizerRequests: async (requestIds: string[], approve: boolean, feedback?: string): Promise<any> => {
    const res = await rootApi.patch('/admin/requests/bulk-review', {
      request_ids: requestIds,
      is_approved: approve,
      reason: feedback
    });
    return res.data;
  },
  bulkReviewActivities: async (activityIds: string[], approve: boolean, feedback?: string): Promise<any> => {
    const res = await rootApi.patch('/admin/activities/bulk-review', {
      activity_ids: activityIds,
      is_approved: approve,
      reason: feedback
    });
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

// Statistics Services
export const statsService = {
  getGlobalStats: async (): Promise<{ totalCampaigns: number, totalVolunteers: number, totalOrganizers: number, totalCompleted: number }> => {
    const res = await rootApi.get('/stats/');
    return res.data;
  }
};
