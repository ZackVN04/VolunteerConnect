export interface UserProfile {
  full_name: string;
  bio: string | null;
  area_of_interest: string | null;
  skills: string[];
  joined_activity_count: number;
  avatar_url?: string;
  organizer_request_status?: 'None' | 'Pending' | 'Approved' | 'Rejected';
  organizer_request_feedback?: string | null;
  age?: number;
  gender?: string;
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
  status?: string;
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
    organizer_id?: string | null;
    organizer_name?: string | null;
  };
  reject_reason?: string;
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
  title?: string;
  content: string;
  images: string[];
  video_url?: string | null;
  visibility: 'Public' | 'Organization' | 'Private';
  status: 'Active' | 'Deleted' | 'Flagged';
  hashtags: string[];
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  denormalized_author?: {
    name: string;
    role: string;
    avatar_url?: string | null;
  };
  likedByUserIds?: string[];
}
