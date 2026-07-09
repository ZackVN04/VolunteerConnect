from beanie import Document
from pydantic import Field
from datetime import datetime, timezone
import pymongo

class Comment(Document):
    """
    Beanie Document representing a comment on a community post.
    """
    post_id: str = Field(..., description="ID of the post this comment belongs to")
    author_id: str = Field(..., description="ID of the user who created the comment")
    author_name: str = Field(..., description="Denormalized name of the author")
    content: str = Field(..., min_length=1, max_length=1000, description="Comment content")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "comments"
        # Index on post_id and created_at descending for efficient pagination of comments per post
        indexes = [
            [("post_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)],
        ]
