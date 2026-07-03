import api from './api';
import type { User, UserProfile, Activity, Registration, OrganizerRequest, Post } from '../context/AppContext';

// Auth Services
export const authService = {
  login: async (phone: string, password_hash: string): Promise<{ token: string; user: User }> => {
    const res = await api.post('/auth/login', { phone, password_hash });
    return res.data;
  },
  register: async (fullname: string, phone: string, password_hash: string): Promise<{ token: string; user: User }> => {
    const res = await api.post('/auth/register', { fullname, phone, password_hash });
    return res.data;
  },
  getCurrentUser: async (): Promise<User> => {
    const res = await api.get('/users/me'); // Spec: GET /api/v1/users/me
    return res.data;
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
    // Spec: POST /api/v1/activities
    const res = await api.post('/activities', activityData);
    if (submitForReview && res.data._id) {
      // Spec: POST /api/v1/activities/{id}/submit
      const submitRes = await api.post(`/activities/${res.data._id}/submit`);
      return submitRes.data;
    }
    return res.data;
  },
  edit: async (id: string, activityData: Partial<Activity>): Promise<Activity> => {
    // Spec: PATCH /api/v1/activities/{id}
    const res = await api.patch(`/activities/${id}`, activityData);
    return res.data;
  },
  submit: async (id: string): Promise<Activity> => {
    // Spec: POST /api/v1/activities/{id}/submit
    const res = await api.post(`/activities/${id}/submit`);
    return res.data;
  },
  cancel: async (id: string): Promise<void> => {
    // Spec: POST /api/v1/activities/{id}/cancel
    await api.post(`/activities/${id}/cancel`);
  },
  getOrganizerActivities: async (): Promise<Activity[]> => {
    // Spec: GET /api/v1/organizer/activities
    const res = await api.get('/organizer/activities');
    return res.data;
  }
};

// Registration & Attendance Services
export const registrationService = {
  getVolunteerRegistrations: async (): Promise<Registration[]> => {
    // Spec: GET /api/v1/users/me/registrations
    const res = await api.get('/users/me/registrations');
    return res.data;
  },
  getActivityRegistrations: async (activityId: string): Promise<Registration[]> => {
    // Spec: GET /api/v1/activities/{id}/registrations
    const res = await api.get(`/activities/${activityId}/registrations`);
    return res.data;
  },
  register: async (activityId: string): Promise<Registration> => {
    // Spec: POST /api/v1/activities/{id}/registrations
    const res = await api.post(`/activities/${activityId}/registrations`);
    return res.data;
  },
  cancel: async (registrationId: string): Promise<Registration> => {
    // Spec: POST /api/v1/registrations/{id}/cancel
    const res = await api.post(`/registrations/${registrationId}/cancel`);
    return res.data;
  },
  approve: async (registrationId: string): Promise<Registration> => {
    // Spec: POST /api/v1/registrations/{id}/approve
    const res = await api.post(`/registrations/${registrationId}/approve`);
    return res.data;
  },
  reject: async (registrationId: string, reason?: string): Promise<Registration> => {
    // Spec: POST /api/v1/registrations/{id}/reject
    const res = await api.post(`/registrations/${registrationId}/reject`, { reason });
    return res.data;
  },
  updateParticipation: async (registrationId: string, status: 'Completed' | 'Absent'): Promise<Registration> => {
    // Spec: POST /api/v1/registrations/{id}/check-in
    const res = await api.post(`/registrations/${registrationId}/check-in`, { status });
    return res.data;
  }
};

// Organizer Upgrade Role Requests Services
export const organizerService = {
  getLatestRequest: async (): Promise<OrganizerRequest> => {
    // Spec: GET /api/v1/organizer-requests/latest
    const res = await api.get('/organizer-requests/latest');
    return res.data;
  },
  submitRequest: async (reason: string, experience: string, contactPhone: string): Promise<OrganizerRequest> => {
    // Spec: POST /api/v1/organizer-requests
    const res = await api.post('/organizer-requests', { reason, experience, contactPhone });
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
  updateProfile: async (updatedProfile: Partial<UserProfile>, email: string, province: string): Promise<User> => {
    // Spec: PATCH /api/v1/users/me
    const res = await api.patch('/users/me', { profile: updatedProfile, email, area_of_interest: province });
    return res.data;
  }
};

// Admin Workflows Services
export const adminService = {
  getOrganizerRequests: async (): Promise<OrganizerRequest[]> => {
    // Spec: GET /api/v1/admin/organizer-requests
    const res = await api.get('/admin/organizer-requests');
    return res.data;
  },
  approveOrganizerRequest: async (requestId: string, approve: boolean, feedback?: string): Promise<OrganizerRequest> => {
    // Spec: POST /api/v1/admin/organizer-requests/{id}/approve
    const res = await api.post(`/admin/organizer-requests/${requestId}/approve`, { approve, feedback });
    return res.data;
  },
  getActivities: async (): Promise<Activity[]> => {
    // Spec: GET /api/v1/admin/activities
    const res = await api.get('/admin/activities');
    return res.data;
  },
  approveActivity: async (activityId: string, approve: boolean): Promise<Activity> => {
    // Spec: POST /api/v1/admin/activities/{id}/approve
    const res = await api.post(`/admin/activities/${activityId}/approve`, { approve });
    return res.data;
  },
  getStatistics: async (): Promise<any> => {
    // Spec: GET /api/v1/admin/statistics
    const res = await api.get('/admin/statistics');
    return res.data;
  }
};
