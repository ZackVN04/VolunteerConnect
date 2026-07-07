import json
import sys
import os
from datetime import datetime, timezone

# Add backend directory to sys.path so 'app' module can be found
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.features.posts.schemas import PostCreate, PostResponse, PostPaginationResponse
from app.features.admin.schemas import AdminReviewRequest, StatisticsResponse, RequestStatus, ActivityApprovalRequest

def main():
    print("=== Posts Feature Mocks ===")
    
    post_create = PostCreate(
        title="Community Beach Cleanup - Amazing Turnout!",
        content="We had over 200 volunteers show up for the coastal cleanup this weekend. Together we removed 500kg of plastic waste from the shorelines. Thank you to everyone who participated!",
        image_url="https://images.unsplash.com/photo-1618477461853-cf6ed80fabe9",
        hashtags=["BeachCleanup", "Environment", "VolunteerConnect"]
    )
    print("\n[PostCreate]")
    print(post_create.model_dump_json(indent=2))

    post_response = PostResponse(
        id="64f9b2d3c9e1a20b3c00001",
        author_id="64f9b1c3c9e1a20b3c00000",
        title=post_create.title,
        content=post_create.content,
        image_url=post_create.image_url,
        hashtags=post_create.hashtags,
        likes=142,
        shares=35,
        created_at=datetime(2023, 9, 15, 14, 30, tzinfo=timezone.utc),
        updated_at=datetime(2023, 9, 15, 14, 30, tzinfo=timezone.utc)
    )
    print("\n[PostResponse]")
    print(post_response.model_dump_json(indent=2))

    post_pagination = PostPaginationResponse(
        items=[post_response],
        current_page=1,
        page_size=10,
        total_items=145,
        total_pages=15,
        has_next=True
    )
    print("\n[PostPaginationResponse]")
    print(post_pagination.model_dump_json(indent=2))

    print("\n=== Admin Feature Mocks ===")
    
    admin_review = AdminReviewRequest(
        status=RequestStatus.APPROVED,
        reason="Background check passed and organizational documents verified successfully."
    )
    print("\n[AdminReviewRequest]")
    print(admin_review.model_dump_json(indent=2))

    activity_approval = ActivityApprovalRequest(
        is_approved=True,
        reason="Activity aligns perfectly with our environmental sustainability goals."
    )
    print("\n[ActivityApprovalRequest]")
    print(activity_approval.model_dump_json(indent=2))

    statistics = StatisticsResponse(
        total_users=15420,
        total_activities=342,
        total_posts=890,
        pending_requests=45,
        user_growth_percentage=12.5,
        activity_growth_percentage=8.2
    )
    print("\n[StatisticsResponse]")
    print(statistics.model_dump_json(indent=2))

if __name__ == "__main__":
    main()
