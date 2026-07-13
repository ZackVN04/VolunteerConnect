import math
from typing import Optional
from fastapi import HTTPException, status
from .comment_models import Comment
from .models import Post
from .comment_repositories import CommentRepository
from .comment_schemas import CommentCreate, CommentResponse, CommentPaginationResponse

class CommentService:
    """
    Business logic layer for Comments.
    """
    
    @staticmethod
    def _map_to_response(comment: Comment, author_avatar: Optional[str] = None) -> CommentResponse:
        return CommentResponse(
            id=str(comment.id),
            post_id=comment.post_id,
            author_id=comment.author_id,
            author_name=comment.author_name,
            author_avatar=author_avatar,
            content=comment.content,
            created_at=comment.created_at
        )

    @staticmethod
    async def create_comment(post_id: str, author_id: str, author_name: str, author_avatar: Optional[str], data: CommentCreate) -> Optional[CommentResponse]:
        comment = Comment(
            post_id=post_id,
            author_id=author_id,
            author_name=author_name,
            content=data.content
        )
        created_comment = await CommentRepository.create_comment(comment)
        if created_comment:
            return CommentService._map_to_response(created_comment, author_avatar)
        return None

    @staticmethod
    async def get_comments(post_id: str, page: int, size: int) -> CommentPaginationResponse:
        skip = (page - 1) * size
        comments, total_items = await CommentRepository.get_paginated_comments(post_id, skip, size)
        
        # Fetch commenter avatars in bulk to prevent N+1 query problem
        from app.features.users.models import User
        from beanie import PydanticObjectId
        author_ids = list({c.author_id for c in comments})
        object_ids = []
        for aid in author_ids:
            try:
                object_ids.append(PydanticObjectId(aid))
            except Exception:
                pass
        
        users = await User.find({"_id": {"$in": object_ids}}).to_list()
        user_avatar_map = {str(u.id): (u.avatar_url if u.avatar_url else None) for u in users}
        
        total_pages = math.ceil(total_items / size) if size > 0 else 0
        has_next = page < total_pages

        items = [CommentService._map_to_response(c, user_avatar_map.get(c.author_id)) for c in comments]

        return CommentPaginationResponse(
            items=items,
            current_page=page,
            page_size=size,
            total_items=total_items,
            total_pages=total_pages,
            has_next=has_next
        )

    @staticmethod
    async def delete_comment(comment_id: str, current_user_id: str, is_admin: bool) -> bool:
        comment = await CommentRepository.get_comment(comment_id)
        if not comment:
            return False
            
        post = await Post.get(comment.post_id)
        is_post_owner = post and post.author_id == current_user_id
        is_comment_owner = comment.author_id == current_user_id
            
        if not (is_admin or is_post_owner or is_comment_owner):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Not authorized to delete this comment"
            )
            
        return await CommentRepository.delete_comment(comment_id)
