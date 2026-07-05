import React, { createContext, useContext, useState, useEffect } from 'react';
import initialMockData from '../mocks/mockData.json';
import {
  authService,
  activityService,
  registrationService,
  organizerService,
  postService,
  userService,
  adminService
} from '../services/apiService';

const USE_REAL_BACKEND = import.meta.env.VITE_USE_REAL_BACKEND === 'true';


// --- Interface Definitions ---

export interface UserProfile {
  full_name: string;
  bio: string | null;
  area_of_interest: string | null;
  skills: string[];
  joined_activity_count: number;
  avatar_url?: string;
  organizer_request_status?: 'None' | 'Pending' | 'Approved' | 'Rejected';
  organizer_request_feedback?: string | null;
}

export interface User {
  _id: string;
  phone: string;
  is_phone_verified: boolean;
  otp_code: string | null;
  otp_expires_at: string | null;
  otp_send_count: number;
  otp_cooldown_until: string | null;
  email: string | null;
  password_hash: string;
  role: 'Volunteer' | 'Organizer' | 'Admin';
  created_at: string;
  updated_at: string;
  profile: UserProfile;
}

export interface LocationInfo {
  province: string;
  district: string;
  address_detail: string;
}

export interface Activity {
  _id: string;
  organizer_id: string;
  title: string;
  description: string;
  categories: string[];
  location: LocationInfo;
  start_date: string;
  end_date: string;
  limit_volunteers: number;
  approved_volunteers_count: number;
  requirements: string | null;
  image_url: string | null;
  status: 'Draft' | 'Pending Review' | 'Open' | 'Full' | 'Ongoing' | 'Completed' | 'Rejected' | 'Cancelled';
  created_at: string;
  updated_at: string;
  denormalized_organizer: {
    name: string;
  };
}

export interface Registration {
  _id: string;
  volunteer_id: string;
  activity_id: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Absent' | 'Cancelled';
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  participation_updated_at: string | null;
  denormalized_volunteer: {
    name: string;
    phone: string;
    email: string;
  };
  denormalized_activity: {
    title: string;
    status: string;
    start_date: string;
    end_date: string;
  };
  reject_reason?: string; // custom field to show in registration management
}

export interface OrganizerRequest {
  _id: string;
  volunteer_id: string;
  reason: string;
  experience: string | null;
  contact_phone: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  admin_feedback: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  denormalized_volunteer: {
    name: string;
    email: string;
  };
}

export interface Post {
  _id: string;
  author_id: string;
  content: string;
  images: string[];
  visibility: 'Public' | 'Organization' | 'Private';
  status: 'Active' | 'Deleted' | 'Flagged';
  hashtags: string[];
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  denormalized_author: {
    name: string;
    role: string;
    organization_name: string | null;
  };
  likedByUserIds?: string[]; // track who liked to simulate toggle
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  activities: Activity[];
  registrations: Registration[];
  organizerRequests: OrganizerRequest[];
  posts: Post[];
  setCurrentUser: (user: User | null) => void;
  // Transactions & Actions
  loginAs: (userId: string) => void;
  registerForActivity: (activityId: string) => { success: boolean; error?: string };
  cancelOrRejectRegistration: (registrationId: string, rejectReason?: string) => void;
  approveRegistration: (registrationId: string) => void;
  updateParticipation: (registrationId: string, status: 'Completed' | 'Absent') => { success: boolean; error?: string };
  cancelActivity: (activityId: string) => void;
  submitOrganizerRequest: (reason: string, experience: string, contactPhone: string) => { success: boolean; error?: string };
  reviewOrganizerRequest: (requestId: string, approve: boolean, feedback?: string) => void;
  createActivity: (activityData: Partial<Activity>, submitForReview: boolean) => void;
  editActivity: (activityId: string, activityData: Partial<Activity>) => void;
  reviewActivity: (activityId: string, approve: boolean) => void;
  createPost: (content: string, images: string[], hashtags: string[]) => void;
  likePost: (postId: string) => void;
  updateProfile: (updatedProfile: Partial<UserProfile>, email: string, province: string, phone?: string) => void;
  resetDatabase: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'volunteer_connect_db';

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Main states
  const [currentUser, setCurrentUserInternal] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [organizerRequests, setOrganizerRequests] = useState<OrganizerRequest[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const loadLocalStorageData = () => {
    const savedDb = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedDb) {
      try {
        const db = JSON.parse(savedDb);
        setUsers(db.users || []);
        setActivities(db.activities || []);
        setRegistrations(db.registrations || []);
        setOrganizerRequests(db.organizerRequests || []);
        setPosts(db.posts || []);
        
        // Auto login first user in the saved database
        if (db.currentUser) {
          setCurrentUserInternal(db.currentUser);
        } else if (db.users && db.users.length > 0) {
          setCurrentUserInternal(db.users[0]); // default to admin or first user
        }
        return;
      } catch (e) {
        console.error('Error parsing saved DB, resetting to mock data', e);
      }
    }
    resetToInitial();
  };

  // Load database from localStorage or initial mockData/Backend
  useEffect(() => {
    if (USE_REAL_BACKEND) {
      const loadBackendData = async () => {
        try {
          // 1. Load offline simulated collections first
          const localDataRaw = localStorage.getItem('volunteer_connect_db');
          if (localDataRaw) {
            const db = JSON.parse(localDataRaw);
            setActivities((db.activities || []) as Activity[]);
            setRegistrations((db.registrations || []) as Registration[]);
            setPosts((db.posts || []) as Post[]);
            if (!organizerRequests.length) {
              setOrganizerRequests((db.organizerRequests || []) as OrganizerRequest[]);
            }
          } else {
            setActivities((initialMockData.activities || []) as Activity[]);
            setRegistrations((initialMockData.registrations || []) as Registration[]);
            setPosts((initialMockData.posts || []) as Post[]);
          }

          // 2. Load backend session details
          let activeUser: User | null = null;
          const token = localStorage.getItem('token');
          if (token) {
            try {
              activeUser = await authService.getCurrentUser();
              
              // Load organizer request status from backend if Volunteer
              if (activeUser && activeUser.role === 'Volunteer') {
                try {
                  const req = await organizerService.getMyRequest();
                  if (req) {
                    const profileStatusMap: Record<string, 'None' | 'Pending' | 'Approved' | 'Rejected'> = {
                      'pending': 'Pending',
                      'approved': 'Approved',
                      'rejected': 'Rejected'
                    };
                    const requestStatusMap: Record<string, 'Pending' | 'Approved' | 'Rejected'> = {
                      'pending': 'Pending',
                      'approved': 'Approved',
                      'rejected': 'Rejected'
                    };
                    activeUser.profile.organizer_request_status = profileStatusMap[req.status] || 'None';
                    const reqObj: OrganizerRequest = {
                      _id: req.id || req._id,
                      volunteer_id: activeUser._id,
                      reason: req.organization_name,
                      experience: req.documents?.[0] || '',
                      contact_phone: req.documents?.[1] || '',
                      status: requestStatusMap[req.status] || 'Pending',
                      admin_feedback: null,
                      created_at: req.requested_at,
                      reviewed_at: null,
                      reviewed_by: null,
                      denormalized_volunteer: {
                        name: activeUser.profile.full_name,
                        email: activeUser.email || ''
                      }
                    };
                    setOrganizerRequests([reqObj]);
                  }
                } catch (e) {
                  activeUser.profile.organizer_request_status = 'None';
                }
              }
              
              setCurrentUserInternal(activeUser);
            } catch (e) {
              console.warn("Lỗi khôi phục phiên đăng nhập backend:", e);
            }
          }
        } catch (e) {
          console.error('Lỗi khi tải dữ liệu từ Backend, chuyển sang giả lập LocalStorage:', e);
          loadLocalStorageData();
        }
      };
      loadBackendData();
    } else {
      loadLocalStorageData();
    }
  }, [currentUser?._id, currentUser?.role]);



  // Sync state to local storage helper
  const syncToLocalStorage = (
    newUsers: User[],
    newActivities: Activity[],
    newRegistrations: Registration[],
    newRequests: OrganizerRequest[],
    newPosts: Post[],
    updatedCurrentUser: User | null
  ) => {
    const db = {
      users: newUsers,
      activities: newActivities,
      registrations: newRegistrations,
      organizerRequests: newRequests,
      posts: newPosts,
      currentUser: updatedCurrentUser
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
  };

  const resetToInitial = () => {
    const defaultUsers = initialMockData.users as User[];
    const defaultActivities = initialMockData.activities as Activity[];
    const defaultRegistrations = initialMockData.registrations as Registration[];
    const defaultRequests = initialMockData.organizer_requests as OrganizerRequest[];
    const defaultPosts = initialMockData.posts as Post[];

    setUsers(defaultUsers);
    setActivities(defaultActivities);
    setRegistrations(defaultRegistrations);
    setOrganizerRequests(defaultRequests);
    setPosts(defaultPosts);
    
    // Default logged in user is Nguyễn Văn A (Volunteer) for easy demo
    const defaultUser = defaultUsers.find(u => u._id === 'user_vol_a_002') || defaultUsers[0];
    setCurrentUserInternal(defaultUser);

    syncToLocalStorage(defaultUsers, defaultActivities, defaultRegistrations, defaultRequests, defaultPosts, defaultUser);
  };

  // Wrapper for setCurrentUser to also persist it
  const setCurrentUser = (user: User | null) => {
    setCurrentUserInternal(user);
    syncToLocalStorage(users, activities, registrations, organizerRequests, posts, user);
  };

  const loginAs = (userId: string) => {
    const user = users.find(u => u._id === userId) || null;
    setCurrentUser(user);
  };

  // Transaction 8.1: Đăng ký tham gia hoạt động (Prevent race conditions & duplicates)
  const registerForActivity = (activityId: string): any => {
    if (USE_REAL_BACKEND) {
      return (async () => {
        try {
          await registrationService.register(activityId);
          const [regs, acts] = await Promise.all([
            registrationService.getVolunteerRegistrations(),
            activityService.getAll()
          ]);
          setRegistrations(regs);
          setActivities(acts);
          return { success: true };
        } catch (e: any) {
          return { success: false, error: e.response?.data?.error?.message || e.response?.data?.message || 'Đăng ký thất bại' };
        }
      })();
    }

    if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
    if (currentUser.role !== 'Volunteer') return { success: false, error: 'Chỉ tình nguyện viên mới có thể đăng ký' };

    // Transaction implementation
    const activityIndex = activities.findIndex(a => a._id === activityId);
    if (activityIndex === -1) return { success: false, error: 'Hoạt động không tồn tại' };

    const activity = activities[activityIndex];

    // Check activity status
    if (activity.status !== 'Open') {
      return { success: false, error: 'Hoạt động này không mở nhận đăng ký' };
    }

    // Check if limit reached
    if (activity.approved_volunteers_count >= activity.limit_volunteers) {
      return { success: false, error: 'Hoạt động đã đủ số lượng thành viên (Full)' };
    }

    // Check if already registered
    const alreadyRegistered = registrations.some(
      r => r.volunteer_id === currentUser._id && r.activity_id === activityId && r.status !== 'Cancelled'
    );
    if (alreadyRegistered) {
      return { success: false, error: 'Bạn đã đăng ký hoạt động này rồi' };
    }

    // Create registration
    const newReg: Registration = {
      _id: `reg_${Date.now()}`,
      volunteer_id: currentUser._id,
      activity_id: activityId,
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reviewed_at: null,
      participation_updated_at: null,
      denormalized_volunteer: {
        name: currentUser.profile.full_name,
        phone: currentUser.phone,
        email: currentUser.email || ''
      },
      denormalized_activity: {
        title: activity.title,
        status: activity.status,
        start_date: activity.start_date,
        end_date: activity.end_date
      }
    };

    const newRegistrations = [newReg, ...registrations];
    
    // Update local states
    setRegistrations(newRegistrations);
    syncToLocalStorage(users, activities, newRegistrations, organizerRequests, posts, currentUser);

    return { success: true };
  };

  // Transaction 8.2: Hủy đăng ký / Từ chối đăng ký (Auto-open logic)
  const cancelOrRejectRegistration = (registrationId: string, rejectReason?: string) => {
    if (USE_REAL_BACKEND) {
      (async () => {
        try {
          if (rejectReason) {
            await registrationService.reject(registrationId, rejectReason);
          } else {
            await registrationService.cancel(registrationId);
          }
          if (currentUser?.role === 'Volunteer') {
            const regs = await registrationService.getVolunteerRegistrations();
            setRegistrations(regs);
          } else if (currentUser?.role === 'Organizer') {
            const orgActs = await activityService.getOrganizerActivities();
            const regsPromises = orgActs.map(a => 
              registrationService.getActivityRegistrations(a._id).catch(() => [] as Registration[])
            );
            const regsLists = await Promise.all(regsPromises);
            setRegistrations(regsLists.flat());
          }
          const acts = await activityService.getAll();
          setActivities(acts);
        } catch (e) {
          console.error(e);
        }
      })();
      return;
    }

    const regIndex = registrations.findIndex(r => r._id === registrationId);
    if (regIndex === -1) return;

    const reg = registrations[regIndex];
    const originalStatus = reg.status;
    const isRejectByOrganizer = !!rejectReason;

    // Update registration status
    const updatedReg: Registration = {
      ...reg,
      status: isRejectByOrganizer ? 'Rejected' : 'Cancelled',
      reject_reason: rejectReason,
      updated_at: new Date().toISOString(),
      reviewed_at: isRejectByOrganizer ? new Date().toISOString() : reg.reviewed_at
    };

    let updatedActivities = [...activities];

    // If it was Approved, we must reduce the count and check if we need to open it back up
    if (originalStatus === 'Approved') {
      const actIndex = activities.findIndex(a => a._id === reg.activity_id);
      if (actIndex !== -1) {
        const act = activities[actIndex];
        const newCount = Math.max(0, act.approved_volunteers_count - 1);
        let newStatus = act.status;
        
        // Auto open if it was Full
        if (act.status === 'Full' && newCount < act.limit_volunteers) {
          newStatus = 'Open';
        }

        updatedActivities[actIndex] = {
          ...act,
          approved_volunteers_count: newCount,
          status: newStatus,
          updated_at: new Date().toISOString()
        };
      }
    }

    const updatedRegs = [...registrations];
    updatedRegs[regIndex] = updatedReg;

    setRegistrations(updatedRegs);
    setActivities(updatedActivities);
    syncToLocalStorage(users, updatedActivities, updatedRegs, organizerRequests, posts, currentUser);
  };

  // Helper: Approve a registration
  const approveRegistration = (registrationId: string) => {
    if (USE_REAL_BACKEND) {
      (async () => {
        try {
          await registrationService.approve(registrationId);
          const orgActs = await activityService.getOrganizerActivities();
          const regsPromises = orgActs.map(a => 
            registrationService.getActivityRegistrations(a._id).catch(() => [] as Registration[])
          );
          const regsLists = await Promise.all(regsPromises);
          setRegistrations(regsLists.flat());
          const acts = await activityService.getAll();
          setActivities(acts);
        } catch (e) {
          console.error(e);
        }
      })();
      return;
    }

    const regIndex = registrations.findIndex(r => r._id === registrationId);
    if (regIndex === -1) return;

    const reg = registrations[regIndex];
    if (reg.status !== 'Pending') return; // Only pending can be approved

    const actIndex = activities.findIndex(a => a._id === reg.activity_id);
    if (actIndex === -1) return;

    const act = activities[actIndex];
    if (act.approved_volunteers_count >= act.limit_volunteers) return; // Cannot approve if already full

    const newCount = act.approved_volunteers_count + 1;
    const newStatus = newCount >= act.limit_volunteers ? 'Full' : act.status;

    // Update Activity
    const updatedActivities = [...activities];
    updatedActivities[actIndex] = {
      ...act,
      approved_volunteers_count: newCount,
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // Update Registration
    const updatedReg: Registration = {
      ...reg,
      status: 'Approved',
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedRegs = [...registrations];
    updatedRegs[regIndex] = updatedReg;

    // If an approved registration status changes, synchronize denormalized status
    setRegistrations(updatedRegs);
    setActivities(updatedActivities);
    syncToLocalStorage(users, updatedActivities, updatedRegs, organizerRequests, posts, currentUser);
  };

  // Transaction 8.3: Điểm danh hoàn thành hoạt động (Increment counter in profile once only)
  const updateParticipation = (registrationId: string, status: 'Completed' | 'Absent'): any => {
    if (USE_REAL_BACKEND) {
      return (async () => {
        try {
          await registrationService.updateParticipation(registrationId, status);
          const orgActs = await activityService.getOrganizerActivities();
          const regsPromises = orgActs.map(a => 
            registrationService.getActivityRegistrations(a._id).catch(() => [] as Registration[])
          );
          const regsLists = await Promise.all(regsPromises);
          setRegistrations(regsLists.flat());
          if (currentUser) {
            const user = await authService.getCurrentUser();
            setCurrentUserInternal(user);
          }
          return { success: true };
        } catch (e: any) {
          return { success: false, error: e.response?.data?.error?.message || e.response?.data?.message || 'Lỗi điểm danh' };
        }
      })();
    }

    const regIndex = registrations.findIndex(r => r._id === registrationId);
    if (regIndex === -1) return { success: false, error: 'Đăng ký không tồn tại' };

    const reg = registrations[regIndex];
    if (reg.status === 'Completed' || reg.status === 'Absent') {
      return { success: false, error: 'Tình nguyện viên này đã được điểm danh trước đó' };
    }
    if (reg.status !== 'Approved') {
      return { success: false, error: 'Chỉ điểm danh tình nguyện viên đã được duyệt (Approved)' };
    }

    // Update Registration
    const updatedReg: Registration = {
      ...reg,
      status,
      participation_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedRegs = [...registrations];
    updatedRegs[regIndex] = updatedReg;

    // Update User Profile (Increment count if Completed)
    let updatedUsers = [...users];
    let updatedCurrentUser = currentUser;

    if (status === 'Completed') {
      const userIndex = users.findIndex(u => u._id === reg.volunteer_id);
      if (userIndex !== -1) {
        const u = users[userIndex];
        const newCount = u.profile.joined_activity_count + 1;
        
        const updatedUser = {
          ...u,
          profile: {
            ...u.profile,
            joined_activity_count: newCount
          },
          updated_at: new Date().toISOString()
        };

        updatedUsers[userIndex] = updatedUser;
        if (currentUser && currentUser._id === u._id) {
          updatedCurrentUser = updatedUser;
        }
      }
    }

    setRegistrations(updatedRegs);
    setUsers(updatedUsers);
    if (updatedCurrentUser) setCurrentUserInternal(updatedCurrentUser);

    syncToLocalStorage(updatedUsers, activities, updatedRegs, organizerRequests, posts, updatedCurrentUser);
    return { success: true };
  };

  // Transaction 8.4: Organizer hủy hoạt động (Cascades to registrations)
  const cancelActivity = (activityId: string) => {
    if (USE_REAL_BACKEND) {
      (async () => {
        try {
          await activityService.cancel(activityId);
          const acts = await activityService.getOrganizerActivities();
          setActivities(acts);
        } catch (e) {
          console.error(e);
        }
      })();
      return;
    }

    const actIndex = activities.findIndex(a => a._id === activityId);
    if (actIndex === -1) return;

    const act = activities[actIndex];

    // Update Activity Status
    const updatedActivities = [...activities];
    updatedActivities[actIndex] = {
      ...act,
      status: 'Cancelled',
      updated_at: new Date().toISOString()
    };

    // Cascade cancel to registrations (Pending/Approved -> Cancelled)
    const updatedRegs = registrations.map(r => {
      if (r.activity_id === activityId && (r.status === 'Pending' || r.status === 'Approved')) {
        return {
          ...r,
          status: 'Cancelled' as const,
          updated_at: new Date().toISOString()
        };
      }
      return r;
    });

    setActivities(updatedActivities);
    setRegistrations(updatedRegs);
    syncToLocalStorage(users, updatedActivities, updatedRegs, organizerRequests, posts, currentUser);
  };

  // Submit Organizer Role Request Flow
  const submitOrganizerRequest = (reason: string, experience: string, contactPhone: string): any => {
    if (USE_REAL_BACKEND) {
      return (async () => {
        try {
          const req = await organizerService.submitRequest(reason, experience, contactPhone);
          const statusMap: Record<string, 'Pending' | 'Approved' | 'Rejected'> = {
            'pending': 'Pending',
            'approved': 'Approved',
            'rejected': 'Rejected'
          };
          const reqObj: OrganizerRequest = {
            _id: req.id || req._id,
            volunteer_id: currentUser?._id || '',
            reason: req.organization_name,
            experience: req.documents?.[0] || '',
            contact_phone: req.documents?.[1] || '',
            status: statusMap[req.status] || 'Pending',
            admin_feedback: null,
            created_at: req.requested_at,
            reviewed_at: null,
            reviewed_by: null,
            denormalized_volunteer: {
              name: currentUser?.profile.full_name || '',
              email: currentUser?.email || ''
            }
          };
          setOrganizerRequests([reqObj]);
          if (currentUser) {
            currentUser.profile.organizer_request_status = 'Pending';
            setCurrentUserInternal({ ...currentUser });
          }
          return { success: true };
        } catch (e: any) {
          return { success: false, error: e.response?.data?.detail || e.response?.data?.message || 'Lỗi gửi yêu cầu' };
        }
      })();
    }

    if (!currentUser) return { success: false, error: 'Chưa đăng nhập' };
    
    // Check if there is already a Pending request
    const pendingRequest = organizerRequests.some(r => r.volunteer_id === currentUser._id && r.status === 'Pending');
    if (pendingRequest) {
      return { success: false, error: 'Bạn đang có một yêu cầu phê duyệt chưa được xử lý' };
    }

    const newReq: OrganizerRequest = {
      _id: `req_${Date.now()}`,
      volunteer_id: currentUser._id,
      reason,
      experience: experience || null,
      contact_phone: contactPhone,
      status: 'Pending',
      admin_feedback: null,
      created_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      denormalized_volunteer: {
        name: currentUser.profile.full_name,
        email: currentUser.email || ''
      }
    };

    const newRequests = [newReq, ...organizerRequests];
    setOrganizerRequests(newRequests);
    syncToLocalStorage(users, activities, registrations, newRequests, posts, currentUser);
    return { success: true };
  };

  // Review Organizer Role Request Flow
  const reviewOrganizerRequest = (requestId: string, approve: boolean, feedback?: string) => {
    if (USE_REAL_BACKEND) {
      (async () => {
        try {
          await adminService.approveOrganizerRequest(requestId, approve, feedback);
          const reqs = await adminService.getOrganizerRequests();
          setOrganizerRequests(reqs);
          if (currentUser) {
            const user = await authService.getCurrentUser();
            setCurrentUserInternal(user);
          }
        } catch (e) {
          console.error(e);
        }
      })();
      return;
    }

    const reqIndex = organizerRequests.findIndex(r => r._id === requestId);
    if (reqIndex === -1) return;

    const req = organizerRequests[reqIndex];
    if (req.status !== 'Pending') return;

    // Update Request
    const updatedReq: OrganizerRequest = {
      ...req,
      status: approve ? 'Approved' : 'Rejected',
      admin_feedback: feedback || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: currentUser?._id || null
    };

    const newRequests = [...organizerRequests];
    newRequests[reqIndex] = updatedReq;

    // If approved, update user role
    let updatedUsers = [...users];
    let updatedCurrentUser = currentUser;

    if (approve) {
      const userIndex = users.findIndex(u => u._id === req.volunteer_id);
      if (userIndex !== -1) {
        const u = users[userIndex];
        const updatedUser = {
          ...u,
          role: 'Organizer' as const,
          updated_at: new Date().toISOString()
        };
        updatedUsers[userIndex] = updatedUser;

        if (currentUser && currentUser._id === u._id) {
          updatedCurrentUser = updatedUser;
        }
      }
    }

    setOrganizerRequests(newRequests);
    setUsers(updatedUsers);
    if (updatedCurrentUser) setCurrentUserInternal(updatedCurrentUser);

    syncToLocalStorage(updatedUsers, activities, registrations, newRequests, posts, updatedCurrentUser);
  };

  // Organizer: Create Activity
  const createActivity = (activityData: Partial<Activity>, submitForReview: boolean) => {
    if (USE_REAL_BACKEND) {
      (async () => {
        try {
          await activityService.create(activityData, submitForReview);
          const acts = await activityService.getOrganizerActivities();
          setActivities(acts);
        } catch (e) {
          console.error(e);
        }
      })();
      return;
    }

    if (!currentUser) return;

    const newAct: Activity = {
      _id: `act_${Date.now()}`,
      organizer_id: currentUser._id,
      title: activityData.title || 'Hoạt động mới',
      description: activityData.description || '',
      categories: activityData.categories || [],
      location: activityData.location || { province: '', district: '', address_detail: '' },
      start_date: activityData.start_date || new Date().toISOString(),
      end_date: activityData.end_date || new Date().toISOString(),
      limit_volunteers: activityData.limit_volunteers || 10,
      approved_volunteers_count: 0,
      requirements: activityData.requirements || null,
      image_url: activityData.image_url || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600',
      status: submitForReview ? 'Pending Review' : 'Draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      denormalized_organizer: {
        name: currentUser.profile.full_name
      }
    };

    const newActivities = [newAct, ...activities];
    setActivities(newActivities);
    syncToLocalStorage(users, newActivities, registrations, organizerRequests, posts, currentUser);
  };

  // Organizer: Edit Activity (Draft or Rejected only)
  const editActivity = (activityId: string, activityData: Partial<Activity>) => {
    if (USE_REAL_BACKEND) {
      (async () => {
        try {
          await activityService.edit(activityId, activityData);
          const acts = await activityService.getOrganizerActivities();
          setActivities(acts);
        } catch (e) {
          console.error(e);
        }
      })();
      return;
    }

    const index = activities.findIndex(a => a._id === activityId);
    if (index === -1) return;

    const original = activities[index];
    // Block editing if not Draft/Rejected in real rules, but allow for updates
    const updated: Activity = {
      ...original,
      ...activityData,
      location: { ...original.location, ...activityData.location },
      updated_at: new Date().toISOString()
    };

    const newActivities = [...activities];
    newActivities[index] = updated;

    setActivities(newActivities);
    syncToLocalStorage(users, newActivities, registrations, organizerRequests, posts, currentUser);
  };

  // Admin: Review Activity Approval
  const reviewActivity = (activityId: string, approve: boolean) => {
    if (USE_REAL_BACKEND) {
      (async () => {
        try {
          await adminService.approveActivity(activityId, approve);
          const acts = await adminService.getActivities();
          setActivities(acts);
        } catch (e) {
          console.error(e);
        }
      })();
      return;
    }

    const index = activities.findIndex(a => a._id === activityId);
    if (index === -1) return;

    const original = activities[index];
    if (original.status !== 'Pending Review') return;

    const updated: Activity = {
      ...original,
      status: approve ? 'Open' : 'Rejected',
      updated_at: new Date().toISOString()
    };

    const newActivities = [...activities];
    newActivities[index] = updated;

    setActivities(newActivities);
    syncToLocalStorage(users, newActivities, registrations, organizerRequests, posts, currentUser);
  };

  // Create Community Post
  const createPost = (content: string, images: string[], hashtags: string[]) => {
    if (USE_REAL_BACKEND) {
      (async () => {
        try {
          await postService.create(content, images, hashtags);
          const pts = await postService.getAll();
          setPosts(pts);
        } catch (e) {
          console.error(e);
        }
      })();
      return;
    }

    if (!currentUser) return;

    const newPost: Post = {
      _id: `post_${Date.now()}`,
      author_id: currentUser._id,
      content,
      images,
      visibility: 'Public',
      status: 'Active',
      hashtags,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      denormalized_author: {
        name: currentUser.profile.full_name,
        role: currentUser.role,
        organization_name: currentUser.role === 'Organizer' ? 'Nhà tổ chức độc lập' : null
      },
      likedByUserIds: []
    };

    const newPosts = [newPost, ...posts];
    setPosts(newPosts);
    syncToLocalStorage(users, activities, registrations, organizerRequests, newPosts, currentUser);
  };

  // Like Community Post Toggle
  const likePost = (postId: string) => {
    if (USE_REAL_BACKEND) {
      (async () => {
        try {
          await postService.like(postId);
          const pts = await postService.getAll();
          setPosts(pts);
        } catch (e) {
          console.error(e);
        }
      })();
      return;
    }

    if (!currentUser) return;

    const postIndex = posts.findIndex(p => p._id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const likedByUserIds = post.likedByUserIds || [];
    const isAlreadyLiked = likedByUserIds.includes(currentUser._id);

    let newLikedList: string[];
    let newLikeCount: number;

    if (isAlreadyLiked) {
      newLikedList = likedByUserIds.filter(id => id !== currentUser._id);
      newLikeCount = Math.max(0, post.like_count - 1);
    } else {
      newLikedList = [...likedByUserIds, currentUser._id];
      newLikeCount = post.like_count + 1;
    }

    const updatedPost: Post = {
      ...post,
      like_count: newLikeCount,
      likedByUserIds: newLikedList,
      updated_at: new Date().toISOString()
    };

    const newPosts = [...posts];
    newPosts[postIndex] = updatedPost;

    setPosts(newPosts);
    syncToLocalStorage(users, activities, registrations, organizerRequests, newPosts, currentUser);
  };

  // Edit/Update Profile Details
  const updateProfile = (updatedProfile: Partial<UserProfile>, email: string, province: string, phone?: string) => {
    if (USE_REAL_BACKEND) {
      if (!currentUser) return;
      (async () => {
        try {
          // Save the local-only fields to localStorage
          const extraKey = `vc_profile_extra_${currentUser._id}`;
          const currentExtraStr = localStorage.getItem(extraKey);
          let extra: any = {};
          if (currentExtraStr) {
            try { extra = JSON.parse(currentExtraStr); } catch {}
          }
          if (updatedProfile.bio !== undefined) extra.bio = updatedProfile.bio;
          if (updatedProfile.skills !== undefined) extra.skills = updatedProfile.skills;
          if (province !== undefined) extra.area_of_interest = province;
          if (phone !== undefined) extra.phone = phone;
          localStorage.setItem(extraKey, JSON.stringify(extra));

          // Only send full_name and avatar_url to backend
          await userService.updateProfile({
            full_name: updatedProfile.full_name !== undefined ? updatedProfile.full_name : (currentUser.profile.full_name ?? undefined),
            avatar_url: updatedProfile.avatar_url !== undefined ? updatedProfile.avatar_url : (currentUser.profile.avatar_url ?? undefined)
          });
          const user = await authService.getCurrentUser();
          setCurrentUserInternal(user);
        } catch (e) {
          console.error("Lỗi cập nhật profile ở backend:", e);
        }
      })();
      return;
    }

    if (!currentUser) return;

    const userIndex = users.findIndex(u => u._id === currentUser._id);
    if (userIndex === -1) return;

    const updatedUser: User = {
      ...currentUser,
      email: email || currentUser.email,
      phone: phone || currentUser.phone,
      profile: {
        ...currentUser.profile,
        ...updatedProfile,
        area_of_interest: province || currentUser.profile.area_of_interest
      },
      updated_at: new Date().toISOString()
    };

    const updatedUsers = [...users];
    updatedUsers[userIndex] = updatedUser;

    setUsers(updatedUsers);
    setCurrentUserInternal(updatedUser);
    syncToLocalStorage(updatedUsers, activities, registrations, organizerRequests, posts, updatedUser);
  };


  const resetDatabase = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    resetToInitial();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        activities,
        registrations,
        organizerRequests,
        posts,
        setCurrentUser,
        loginAs,
        registerForActivity,
        cancelOrRejectRegistration,
        approveRegistration,
        updateParticipation,
        cancelActivity,
        submitOrganizerRequest,
        reviewOrganizerRequest,
        createActivity,
        editActivity,
        reviewActivity,
        createPost,
        likePost,
        updateProfile,
        resetDatabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};
