import React from 'react';
import { FeedView } from './FeedView';

// PostsView renders the full community feed without the home-page sections.
export const PostsView: React.FC = () => {
  return <FeedView mode="posts" />;
};

export default PostsView;
