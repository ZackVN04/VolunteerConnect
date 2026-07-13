from fastapi import APIRouter, Query, HTTPException, status, Depends
from typing import Optional
from .comment_schemas import CommentCreate, CommentResponse, CommentPaginationResponse
from .comment_services import CommentService
from app.features.auth.dependencies import get_current_user
from app.features.users.models import User
from app.shared.enums import UserRole

router = APIRouter(prefix="/api/v1/posts/{post_id}/comments", tags=["Comments"])

@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: str, 
    comment_data: CommentCreate, 
    current_user: User = Depends(get_current_user)
):
    """
    Create a new comment on a post.
    """
    comment = await CommentService.create_comment(
        post_id=post_id,
        author_id=str(current_user.id),
        author_name=current_user.full_name or "Thành viên",
        author_avatar=current_user.avatar_url,
        data=comment_data
    )
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found or invalid ID")
    return comment

@router.get("/", response_model=CommentPaginationResponse)
async def get_comments(
    post_id: str,
    page: int = Query(1, ge=1, le=1000, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page limit")
):
    """
    Retrieve paginated comments for a post.
    """
    return await CommentService.get_comments(post_id, page, limit)

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    post_id: str,
    comment_id: str, 
    current_user: User = Depends(get_current_user)
):
    """
    Delete a comment. Admins can delete any comment; regular users can only delete their own.
    """
    is_admin = current_user.role == UserRole.ADMIN
    deleted = await CommentService.delete_comment(comment_id, str(current_user.id), is_admin)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found or invalid ID")
    return None
