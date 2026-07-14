import type { Activity, Post } from '../types/domain';

export const injectLikedStatus = (serverPosts: Post[], userId: string | undefined): Post[] => {
  if (!userId) return serverPosts;
  const storageKey = `liked_posts_${userId}`;
  const likedListStr = localStorage.getItem(storageKey);
  const likedPostIds: string[] = likedListStr ? JSON.parse(likedListStr) : [];
  return serverPosts.map(p => {
    if (likedPostIds.includes(p._id)) {
      return { ...p, likedByUserIds: [userId] };
    }
    return { ...p, likedByUserIds: [] };
  });
};

export const applyLocalActivityOverrides = (activities: Activity[]): Activity[] => {
  try {
    const locallyCompletedIds = JSON.parse(localStorage.getItem('locally_completed_activity_ids') || '[]');
    if (Array.isArray(locallyCompletedIds) && locallyCompletedIds.length > 0) {
      return activities.map(activity => {
        if (locallyCompletedIds.includes(activity._id)) {
          return { ...activity, status: 'Completed' as const };
        }
        return activity;
      });
    }
  } catch (e) {
    console.error(e);
  }

  return activities;
};
