from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional
from .schemas import PostCreate, PostResponse, PostPaginationResponse
from .services import PostService

router = APIRouter(prefix="/posts", tags=["Posts"])

@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(post_data: PostCreate):
    """
    Create a new community post.
    """
    # Mocking author_id since auth is pending from Dev 1
    mock_author_id = "64a1b2c3d4e5f6a7b8c9d0a1"
    return await PostService.create_post(author_id=mock_author_id, data=post_data)

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
async def like_post(post_id: str):
    """
    Atomically increment the likes of a post to prevent race conditions.
    """
    post = await PostService.like_post(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found or invalid ID")
    return post

@router.patch("/{post_id}/share", response_model=PostResponse)
async def share_post(post_id: str):
    """
    Atomically increment the shares of a post to prevent race conditions.
    """
    post = await PostService.share_post(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found or invalid ID")
    return post

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: str):
    """
    Delete a post (Checks ownership to prevent IDOR vulnerabilities).
    """
    mock_author_id = "64a1b2c3d4e5f6a7b8c9d0a1"
    deleted = await PostService.delete_post(post_id, mock_author_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found or invalid ID")
    return None
