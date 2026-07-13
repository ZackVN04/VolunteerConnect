from fastapi import APIRouter, Query, HTTPException, status, Depends
from typing import Optional
from .schemas import PostCreate, PostResponse, PostPaginationResponse, PostUpdate
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
    page: int = Query(1, ge=1, le=1000, description="Page number (max 1000 to prevent deep-skip DoS)"),
    limit: int = Query(10, ge=1, le=100, description="Items per page limit"),
    hashtag: Optional[str] = Query(None, description="Filter by hashtag")
):
    """
    Retrieve paginated posts with optional hashtag filtering.
    
    Security note: `page` is capped at 1000 to prevent Deep Pagination DoS attacks.
    A request with page=999999 and limit=100 would force MongoDB to skip 99,999,900
    documents — equivalent to a full collection scan, causing server timeouts.
    """
    return await PostService.get_posts(page, limit, hashtag)

@router.patch("/{post_id}/like", response_model=PostResponse)
async def like_post(post_id: str, current_user: User = Depends(get_current_user)):
    """
    Atomically like a post with deduplication.
    Returns 409 Conflict if the current user has already liked this post.
    """
    try:
        post = await PostService.like_post(post_id, user_id=str(current_user.id))
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found or invalid ID")
        return post
    except ValueError as e:
        # Raised by repository when user has already liked this post
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

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
    Delete a post. Admins can delete any post; regular users can only delete their own.
    IDOR protection: ownership is verified inside PostService.delete_post for non-admin users.
    """
    from app.shared.enums import UserRole
    if current_user.role == UserRole.ADMIN:
        # Admin path: fetch the post first to get the real author_id.
        # BUG FIX: if post does not exist, raise 404 immediately.
        # Previously this fell back to str(current_user.id), which caused
        # delete_post to run with the admin's own ID — incorrect and misleading.
        post = await Post.get(post_id)
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found or invalid ID")
        author_id = post.author_id
    else:
        author_id = str(current_user.id)

    deleted = await PostService.delete_post(post_id, author_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found or invalid ID")
    return None

@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing community post.
    """
    return await PostService.update_post(
        post_id=post_id,
        current_user_id=str(current_user.id),
        data=post_data
    )
