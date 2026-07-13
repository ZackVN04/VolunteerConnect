import math
from typing import Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from bson.errors import InvalidId
from pydantic import ValidationError
from .models import Post
from .repositories import PostRepository
from .schemas import PostCreate, PostResponse, PostPaginationResponse, PostUpdate

class PostService:
    """
    Business logic layer for handling Posts operations.
    Maps between Pydantic Schemas (DTOs) and Database Models.
    """
    
    @staticmethod
    def _map_to_response(post: Post) -> PostResponse:
        """
        Helper method to map a Beanie Post document to a Pydantic PostResponse.
        """
        author_data = None
        if post.denormalized_author:
            from .schemas import DenormalizedAuthor as SchemaAuthor
            author_data = SchemaAuthor(
                name=post.denormalized_author.name,
                role=post.denormalized_author.role,
                organization_name=post.denormalized_author.organization_name
            )

        return PostResponse(
            id=str(post.id),
            title=post.title,
            content=post.content,
            images=post.images,
            video_url=post.video_url,
            author_id=post.author_id,
            likes=post.likes,
            shares=post.shares,
            comment_count=post.comment_count,
            hashtags=post.hashtags,
            created_at=post.created_at,
            updated_at=post.updated_at,
            denormalized_author=author_data
        )

    @staticmethod
    async def create_post(author_id: str, data: PostCreate) -> PostResponse:
        """
        Creates a new post after applying business rules.
        """
        from app.features.users.models import User
        from beanie import PydanticObjectId
        from .models import DenormalizedAuthor as ModelAuthor

        user = await User.get(PydanticObjectId(author_id))
        author_name = "Thành viên"
        author_role = "Volunteer"
        org_name = None

        if user:
            author_name = user.full_name or user.email
            role_map = {"admin": "Admin", "organizer": "Organizer", "volunteer": "Volunteer"}
            author_role = role_map.get(user.role.lower(), "Volunteer")
            if author_role == "Organizer":
                org_name = "Nhà tổ chức độc lập"

        author_info = ModelAuthor(
            name=author_name,
            role=author_role,
            organization_name=org_name
        )

        post = Post(
            title=data.title,
            content=data.content,
            images=[str(img) for img in data.images] if data.images else [],
            video_url=str(data.video_url) if data.video_url else None,
            author_id=author_id,
            hashtags=data.hashtags,
            denormalized_author=author_info
        )
        created_post = await PostRepository.create_post(post)
        return PostService._map_to_response(created_post)

    @staticmethod
    async def get_posts(page: int, size: int, hashtag: Optional[str] = None) -> PostPaginationResponse:
        """
        Calculates pagination metadata and fetches posts from the repository.
        """
        skip = (page - 1) * size
        posts, total_items = await PostRepository.get_paginated_posts(skip, size, hashtag)
        
        total_pages = math.ceil(total_items / size) if size > 0 else 0
        has_next = page < total_pages

        items = [PostService._map_to_response(p) for p in posts]

        return PostPaginationResponse(
            items=items,
            current_page=page,
            page_size=size,
            total_items=total_items,
            total_pages=total_pages,
            has_next=has_next
        )

    @staticmethod
    async def like_post(post_id: str, user_id: str) -> Optional[PostResponse]:
        """
        Increments the like counter of a post atomically with deduplication.
        Raises ValueError if the user has already liked this post (caller handles → 409).
        """
        post = await PostRepository.increment_likes(post_id, user_id)
        if post:
            return PostService._map_to_response(post)
        return None

    @staticmethod
    async def share_post(post_id: str) -> Optional[PostResponse]:
        """
        Increments the share counter of a post atomically.
        """
        post = await PostRepository.increment_shares(post_id)
        if post:
            return PostService._map_to_response(post)
        return None

    @staticmethod
    async def delete_post(post_id: str, current_user_id: str) -> bool:
        """
        Deletes a post securely by verifying ownership (IDOR prevention).
        """
        try:
            post = await Post.get(post_id)
        except (InvalidId, ValueError, ValidationError):
            return False
            
        if not post:
            return False
            
        if post.author_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Not authorized to delete this post"
            )
            
        return await PostRepository.delete_post(post_id)

    @staticmethod
    async def update_post(post_id: str, current_user_id: str, data: PostUpdate) -> PostResponse:
        """
        Updates an existing post after verifying ownership.
        """
        try:
            post = await Post.get(post_id)
        except (InvalidId, ValueError, ValidationError):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found or invalid ID"
            )

        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found or invalid ID"
            )

        if post.author_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to edit this post"
            )

        post.title = data.title
        post.content = data.content
        post.images = [str(img) for img in data.images] if data.images else []
        post.hashtags = data.hashtags
        post.updated_at = datetime.now(timezone.utc)

        await post.save()
        return PostService._map_to_response(post)
