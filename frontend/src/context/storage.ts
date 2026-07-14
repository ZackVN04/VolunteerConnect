import type { Activity, OrganizerRequest, Post, Registration, User } from '../types/domain';

export const LOCAL_STORAGE_KEY = 'volunteer_connect_db';

export const syncToLocalStorage = (
  usersData: User[],
  activitiesData: Activity[],
  registrationsData: Registration[],
  organizerRequestsData: OrganizerRequest[],
  postsData: Post[],
  currentUserData: User | null
) => {
  const db = {
    users: usersData,
    activities: activitiesData,
    registrations: registrationsData,
    organizerRequests: organizerRequestsData,
    posts: postsData,
    currentUser: currentUserData
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
};
