from fastapi import APIRouter, Query, HTTPException, status, Depends
from typing import Optional
from .schemas import PostCreate, PostResponse, PostPaginationResponse
from .services import PostService
from .models import Post
from app.features.auth.dependencies import get_current_user
from app.features.users.models import User

router = APIRouter(prefix="/api/v1/posts", tags=["Posts"])

@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user)):
    """
    Create a new community post.
    """
    return await PostService.create_post(author_id=str(current_user.id), data=post_data)

@router.get("/", response_model=PostPaginationResponse)
async def get_posts(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page limit"),
    hashtag: Optional[str] = Query(None, description="Filter by hashtag")
):
    """
    Retrieve paginated posts with optional hashtag filtering.
    """
    return await PostService.get_posts(page, limit, hashtag)

@router.patch("/{post_id}/like", response_model=PostResponse)
async def like_post(post_id: str, current_user: User = Depends(get_current_user)):
    """
    Atomically increment the likes of a post to prevent race conditions.
    """
    post = await PostService.like_post(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found or invalid ID")
    return post

@router.patch("/{post_id}/share", response_model=PostResponse)
async def share_post(post_id: str, current_user: User = Depends(get_current_user)):
    """
    Atomically increment the shares of a post to prevent race conditions.
    """
    post = await PostService.share_post(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found or invalid ID")
    return post

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: str, current_user: User = Depends(get_current_user)):
    """
    Delete a post (Checks ownership to prevent IDOR vulnerabilities).
    """
    from app.shared.enums import UserRole
    if current_user.role == UserRole.ADMIN:
        post = await Post.get(post_id)
        author_id = post.author_id if post else str(current_user.id)
    else:
        author_id = str(current_user.id)
        
    deleted = await PostService.delete_post(post_id, author_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found or invalid ID")
    return None

