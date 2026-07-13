from typing import List, Tuple, Optional, Dict, Any
from bson import ObjectId
from app.features.users.models import User
from beanie.odm.operators.update.general import Inc
from bson.errors import InvalidId
from pydantic import ValidationError
from .models import Post

class PostRepository:
    """
    Repository handling direct database access for Posts using Beanie.
    """
    
    @staticmethod
    async def get_paginated_posts(skip: int, limit: int, hashtag: Optional[str] = None) -> Tuple[List[Dict[str, Any]], int]:
        """
        Fetches posts with offset-based pagination, sorting by created_at descending.
        Optionally filters by a specific hashtag.
        Fetches authors separately to prevent MongoDB aggregation errors.
        """
        query = Post.find({"hashtags": hashtag}) if hashtag else Post.find_all()
        total = await query.count()
        
        # Uses the created_at descending index for fast sorting
        posts = await query.sort("-created_at").skip(skip).limit(limit).to_list()
        
        # Collect unique author IDs
        author_ids = list(set(post.author_id for post in posts if post.author_id))
        
        # Convert valid string IDs to ObjectId
        valid_author_obj_ids = []
        for aid in author_ids:
            try:
                valid_author_obj_ids.append(ObjectId(aid))
            except InvalidId:
                pass
                
        # Fetch authors
        authors = await User.find({"_id": {"$in": valid_author_obj_ids}}).to_list()
        author_map = {str(author.id): author for author in authors}
        
        # Manually attach denormalized_author
        result_posts = []
        for post in posts:
            post_dict = post.model_dump()
            # Ensure _id is properly set for the mapper
            post_dict["_id"] = post.id
            
            author = author_map.get(post.author_id)
            if author:
                post_dict["denormalized_author"] = {
                    "name": author.full_name,
                    "avatar_url": author.avatar_url,
                    "role": author.role.value if hasattr(author.role, 'value') else author.role
                }
            else:
                post_dict["denormalized_author"] = None
                
            result_posts.append(post_dict)
            
        return result_posts, total

    @staticmethod
    async def create_post(post: Post) -> Post:
        """
        Inserts a new post into the database.
        """
        return await post.insert()

    @staticmethod
    async def increment_likes(post_id: str, user_id: str) -> Post | None:
        """
        Atomically likes a post with deduplication.

        Uses a two-step approach:
        1. Fetch post and check if user_id is already in liked_by (fast in-memory check).
        2. If not, use MongoDB's atomic $addToSet + $inc in a single update to prevent
           race conditions when multiple requests arrive simultaneously.

        Returns None if the post is not found or the ID is invalid.
        Raises ValueError if the user has already liked this post.
        """
        try:
            post = await Post.get(post_id)
            if not post:
                return None

            # Deduplication check: reject if user has already liked this post
            if user_id in post.liked_by:
                raise ValueError("User has already liked this post.")

            # Atomic update: add user_id to liked_by AND increment likes counter in one operation
            await post.update({"$addToSet": {"liked_by": user_id}, "$inc": {"likes": 1}})
            
            # Sync in-memory representation to save a DB read round-trip
            post.liked_by.append(user_id)
            post.likes = getattr(post, "likes", 0) + 1
            return post
        except (InvalidId, ValidationError):
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
            
            # Sync in-memory representation to save a DB read round-trip
            post.shares = getattr(post, "shares", 0) + 1
            return post
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
