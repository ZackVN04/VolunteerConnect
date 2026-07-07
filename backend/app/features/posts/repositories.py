from typing import List, Tuple, Optional
from beanie.odm.operators.update.general import Inc
from bson.errors import InvalidId
from pydantic import ValidationError
from .models import Post

class PostRepository:
    """
    Repository handling direct database access for Posts using Beanie.
    """
    
    @staticmethod
    async def get_paginated_posts(skip: int, limit: int, hashtag: Optional[str] = None) -> Tuple[List[Post], int]:
        """
        Fetches posts with offset-based pagination, sorting by created_at descending.
        Optionally filters by a specific hashtag.
        """
        query = Post.find({"hashtags": hashtag}) if hashtag else Post.find_all()
        total = await query.count()
        # Uses the created_at descending index for fast sorting
        posts = await query.sort("-created_at").skip(skip).limit(limit).to_list()
        return posts, total

    @staticmethod
    async def create_post(post: Post) -> Post:
        """
        Inserts a new post into the database.
        """
        return await post.insert()

    @staticmethod
    async def increment_likes(post_id: str) -> Post | None:
        """
        CRITICAL: Uses MongoDB's atomic operator $inc (via Beanie's Inc) to prevent race conditions 
        when multiple users like a post simultaneously.
        """
        try:
            post = await Post.get(post_id)
            if not post:
                return None
            
            # Atomic increment ensures database-level locking
            await post.update(Inc({Post.likes: 1}))
            return await Post.get(post_id)
        except (InvalidId, ValueError, ValidationError):
            return None

    @staticmethod
    async def increment_shares(post_id: str) -> Post | None:
        """
        CRITICAL: Uses MongoDB's atomic operator $inc to prevent race conditions.
        """
        try:
            post = await Post.get(post_id)
            if not post:
                return None
            
            # Atomic increment for shares
            await post.update(Inc({Post.shares: 1}))
            return await Post.get(post_id)
        except (InvalidId, ValueError, ValidationError):
            return None

    @staticmethod
    async def delete_post(post_id: str) -> bool:
        """
        Hard deletes a post by its ID.
        """
        try:
            post = await Post.get(post_id)
            if not post:
                return False
            await post.delete()
            return True
        except (InvalidId, ValueError, ValidationError):
            return False
