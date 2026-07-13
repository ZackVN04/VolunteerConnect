from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import List, Optional
import pymongo

class DenormalizedAuthor(BaseModel):
    name: str
    role: str
    organization_name: Optional[str] = None

class Post(Document):
    """
    Beanie Document representing a volunteer community post.
    """
    title: str = Field(..., min_length=5, max_length=100)
    content: str = Field(..., min_length=10, max_length=5000)
    images: List[str] = Field(default_factory=list)
    video_url: Optional[str] = None
    author_id: str
    likes: int = 0
    shares: int = 0
    comment_count: int = 0
    # DEDUPLICATION: Stores author_ids of users who liked this post.
    # Prevents a single user from liking the same post multiple times.
    liked_by: List[str] = Field(default_factory=list)
    hashtags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    denormalized_author: Optional[DenormalizedAuthor] = None

    class Settings:
        name = "posts"
        # CRITICAL: MongoDB index on created_at (descending) to heavily optimize pagination queries
        indexes = [
            [("created_at", pymongo.DESCENDING)],
            [("hashtags", pymongo.ASCENDING)]
        ]

