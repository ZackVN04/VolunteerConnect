from pydantic import BaseModel, Field, AnyHttpUrl
from typing import Optional, List
from datetime import datetime

class PostCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=100, description="Title of the post")
    content: str = Field(..., min_length=10, max_length=5000, description="Content of the post")
    images: List[AnyHttpUrl] = Field(default_factory=list, max_length=10, description="List of image URLs (max 10)")
    video_url: Optional[AnyHttpUrl] = Field(None, description="Optional video URL")
    hashtags: List[str] = Field(default_factory=list, description="List of hashtags")

class PostResponse(PostCreate):
    id: str = Field(..., description="The MongoDB ObjectId as string")
    author_id: str = Field(..., description="ID of the user who created the post")
    likes: int = Field(default=0, ge=0, description="Number of likes")
    shares: int = Field(default=0, ge=0, description="Number of shares")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

class PostPaginationResponse(BaseModel):
    items: List[PostResponse]
    current_page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, description="Number of items per page")
    total_items: int = Field(..., ge=0, description="Total number of items")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
    has_next: bool = Field(..., description="True if there is a next page")
