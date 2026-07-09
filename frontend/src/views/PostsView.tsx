import React from 'react';
import { FeedView } from './FeedView';

// PostsView renders the same community feed as FeedView
export const PostsView: React.FC = () => {
  return <FeedView />;
};

export default PostsView;
