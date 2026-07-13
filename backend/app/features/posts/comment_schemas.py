from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000, description="Comment content")

class CommentResponse(BaseModel):
    id: str = Field(..., description="The MongoDB ObjectId as string")
    post_id: str = Field(..., description="ID of the post")
    author_id: str = Field(..., description="ID of the user who created the comment")
    author_name: str = Field(..., description="Name of the author")
    author_avatar: Optional[str] = Field(None, description="Avatar URL of the author")
    content: str = Field(..., description="Comment content")
    created_at: datetime = Field(..., description="Creation timestamp")

class CommentPaginationResponse(BaseModel):
    items: List[CommentResponse]
    current_page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, description="Number of items per page")
    total_items: int = Field(..., ge=0, description="Total number of items")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
    has_next: bool = Field(..., description="True if there is a next page")
