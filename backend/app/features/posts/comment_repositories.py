from typing import List, Tuple
from beanie.odm.operators.update.general import Inc
from bson.errors import InvalidId
from pydantic import ValidationError
from .comment_models import Comment
from .models import Post

class CommentRepository:
    """
    Repository handling database access for Comments.
    """

    @staticmethod
    async def create_comment(comment: Comment) -> Comment | None:
        """
        Inserts a comment and atomically increments the post's comment_count.
        Returns None if the post does not exist.
        """
        try:
            post = await Post.get(comment.post_id)
            if not post:
                return None
            
            created_comment = await comment.insert()
            await post.update(Inc({Post.comment_count: 1}))
            return created_comment
        except (InvalidId, ValidationError):
            return None

    @staticmethod
    async def get_paginated_comments(post_id: str, skip: int, limit: int) -> Tuple[List[Comment], int]:
        """
        Fetches comments for a specific post with offset-based pagination.
        Sorted by created_at descending.
        """
        query = Comment.find(Comment.post_id == post_id)
        total = await query.count()
        comments = await query.sort("-created_at").skip(skip).limit(limit).to_list()
        return comments, total

    @staticmethod
    async def delete_comment(comment_id: str) -> bool:
        """
        Deletes a comment by ID and atomically decrements the post's comment_count.
        """
        try:
            comment = await Comment.get(comment_id)
            if not comment:
                return False
            
            post_id = comment.post_id
            await comment.delete()
            
            # Decrement comment count on the post
            post = await Post.get(post_id)
            if post:
                # Use max to prevent negative count just in case
                await post.update(Inc({Post.comment_count: -1}))
                
            return True
        except (InvalidId, ValidationError):
            return False

    @staticmethod
    async def get_comment(comment_id: str) -> Comment | None:
        try:
            return await Comment.get(comment_id)
        except (InvalidId, ValidationError):
            return None
