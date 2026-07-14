import type { Activity, OrganizerRequest, Post, Registration, User, UserProfile } from '../types/domain';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationState {
  message: string;
  type: NotificationType;
}

export interface ConfirmDialogState {
  message: string;
  title?: string;
  onConfirm: () => void;
}

export interface PromptDialogState {
  message: string;
  title?: string;
  placeholder?: string;
  onConfirm: (val: string) => void;
}

export interface GlobalStats {
  totalCampaigns: number;
  totalVolunteers: number;
  totalOrganizers: number;
  totalCompleted: number;
}

export interface AppContextType {
  currentUser: User | null;
  users: User[];
  activities: Activity[];
  registrations: Registration[];
  organizerRequests: OrganizerRequest[];
  posts: Post[];
  setCurrentUser: (user: User | null) => void;
  refreshAllData: (options?: { silent?: boolean }) => Promise<void>;

  loginAs: (userId: string) => void;
  registerForActivity: (activityId: string) => { success: boolean; error?: string };
  cancelOrRejectRegistration: (registrationId: string, rejectReason?: string) => any;
  approveRegistration: (registrationId: string) => Promise<{ success: boolean; error?: string }>;
  updateParticipation: (registrationId: string, status: 'Completed' | 'Absent') => { success: boolean; error?: string };
  cancelActivity: (activityId: string) => void;
  submitOrganizerRequest: (reason: string, experience: string, contactPhone: string) => { success: boolean; error?: string };
  reviewOrganizerRequest: (requestId: string, approve: boolean, feedback?: string) => Promise<{ success: boolean; error?: string }>;
  createActivity: (activityData: Partial<Activity>, submitForReview: boolean) => Promise<{ success: boolean; error?: string }>;
  editActivity: (activityId: string, activityData: Partial<Activity>) => Promise<{ success: boolean; error?: string }>;
  reviewActivity: (activityId: string, approve: boolean, feedback?: string) => Promise<{ success: boolean; error?: string }>;
  bulkReviewOrganizerRequests: (requestIds: string[], approve: boolean, feedback?: string) => Promise<{ success: boolean; error?: string }>;
  bulkReviewActivities: (activityIds: string[], approve: boolean, feedback?: string) => Promise<{ success: boolean; error?: string }>;
  bulkReviewRegistrations: (registrationIds: string[], approve: boolean, feedback?: string) => Promise<{ success: boolean; error?: string }>;
  createPost: (title: string, content: string, images: string[], videoUrl: string | null, hashtags: string[]) => Promise<{ success: boolean; error?: string }>;
  editPost: (postId: string, title: string, content: string, images: string[], hashtags: string[]) => Promise<{ success: boolean; error?: string }>;
  likePost: (postId: string) => void;
  sharePost: (postId: string) => void;
  deletePost: (postId: string) => Promise<{ success: boolean; error?: string }>;
  incrementCommentCount: (postId: string) => void;
  updateProfile: (updatedProfile: Partial<UserProfile>, email: string, province: string, phone?: string) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changeUserRole: (userId: string, role: 'Volunteer' | 'Organizer' | 'Admin') => void;
  resetDatabase: () => void;

  notification: NotificationState | null;
  showNotification: (message: string, type?: NotificationType) => void;
  confirmDialog: ConfirmDialogState | null;
  showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
  closeConfirm: () => void;
  promptDialog: PromptDialogState | null;
  showPrompt: (message: string, onConfirm: (val: string) => void, title?: string, placeholder?: string) => void;
  closePrompt: () => void;
  isAuthLoading: boolean;
  isDataLoading: boolean;
  globalStats: GlobalStats | null;
}
