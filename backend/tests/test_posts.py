import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from app.main import app
from app.features.users.models import User
from app.features.posts.models import Post
from app.shared.enums import UserRole, UserStatus
from app.core.security.password import get_password_hash
from app.core.security.jwt import create_access_token

TEST_EMAIL = "test_qa_post@example.com"
TEST_PASSWORD = "StrongPassword123!"

@pytest.fixture(autouse=True)
async def cleanup_test_data():
    """Clean up test data before and after each test case."""
    await Post.find({"title": {"$regex": "^test_QA_.*", "$options": "i"}}).delete()
    await User.find({"email": TEST_EMAIL}).delete()
    yield
    await Post.find({"title": {"$regex": "^test_QA_.*", "$options": "i"}}).delete()
    await User.find({"email": TEST_EMAIL}).delete()

@pytest.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.fixture
async def volunteer_user():
    user = User(
        email=TEST_EMAIL,
        phone_number="+84999999911",
        full_name="QA Post Author",
        hashed_password=get_password_hash(TEST_PASSWORD),
        role=UserRole.VOLUNTEER,
        status=UserStatus.ACTIVE
    )
    await user.insert()
    return user

@pytest.fixture
def auth_headers(volunteer_user):
    token = create_access_token(subject=str(volunteer_user.id))
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_create_post_empty_video_url_coercion(async_client, auth_headers):
    """Verify that creating a post with empty video_url coerces to None and succeeds."""
    payload = {
        "title": "test_QA_PostTitle",
        "content": "This is a test post content with at least ten characters.",
        "images": [],
        "video_url": "",  # Empty string should be coerced to None by @field_validator
        "hashtags": ["test"]
    }
    response = await async_client.post("/api/v1/posts/", json=payload, headers=auth_headers)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["title"] == "test_QA_PostTitle"
    assert res_json["video_url"] is None
    
    # Check database document
    post_in_db = await Post.get(res_json["id"])
    assert post_in_db is not None
    assert post_in_db.video_url is None

@pytest.mark.asyncio
async def test_create_post_with_denormalized_author(async_client, auth_headers, volunteer_user):
    """Verify that creating a post populates denormalized_author correctly."""
    payload = {
        "title": "test_QA_PostAuthor",
        "content": "Checking that the author information is denormalized correctly.",
        "images": [],
        "video_url": None,
        "hashtags": ["author"]
    }
    response = await async_client.post("/api/v1/posts/", json=payload, headers=auth_headers)
    assert response.status_code == 201
    res_json = response.json()
    
    # Verify response contains denormalized_author
    assert "denormalized_author" in res_json
    assert res_json["denormalized_author"] is not None
    assert res_json["denormalized_author"]["name"] == "QA Post Author"
    assert res_json["denormalized_author"]["role"] == "Volunteer"
    assert res_json["denormalized_author"]["organization_name"] is None

    # Check database document
    post_in_db = await Post.get(res_json["id"])
    assert post_in_db.denormalized_author is not None
    assert post_in_db.denormalized_author.name == "QA Post Author"
    assert post_in_db.denormalized_author.role == "Volunteer"

@pytest.mark.asyncio
async def test_update_post_success(async_client, auth_headers, volunteer_user):
    """Verify that the author can successfully update their post."""
    # First create a post
    post = Post(
        title="test_QA_OrigTitle",
        content="Original content of the post to update later.",
        images=[],
        author_id=str(volunteer_user.id),
        hashtags=["orig"]
    )
    await post.insert()

    # Now update it
    update_payload = {
        "title": "test_QA_UpdatedTitle",
        "content": "Updated content that meets the length requirements.",
        "images": ["https://picsum.photos/300"],
        "hashtags": ["updated"]
    }
    response = await async_client.put(f"/api/v1/posts/{str(post.id)}", json=update_payload, headers=auth_headers)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["title"] == "test_QA_UpdatedTitle"
    assert res_json["content"] == "Updated content that meets the length requirements."
    assert res_json["images"] == ["https://picsum.photos/300"]
    assert res_json["hashtags"] == ["updated"]

    # Verify database
    updated_post = await Post.get(post.id)
    assert updated_post.title == "test_QA_UpdatedTitle"

@pytest.mark.asyncio
async def test_update_post_forbidden(async_client, auth_headers, volunteer_user):
    """Verify that editing a post by a non-author returns 403 Forbidden."""
    # First create a post owned by volunteer_user
    post = Post(
        title="test_QA_ForbiddenTitle",
        content="Original content of the post to update later.",
        images=[],
        author_id=str(volunteer_user.id),
        hashtags=["forbidden"]
    )
    await post.insert()

    # Create another user and headers
    other_user = User(
        email="other_test_qa@example.com",
        phone_number="+84999999922",
        full_name="Other QA User",
        hashed_password=get_password_hash(TEST_PASSWORD),
        role=UserRole.VOLUNTEER,
        status=UserStatus.ACTIVE
    )
    await other_user.insert()
    other_token = create_access_token(subject=str(other_user.id))
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # Try to edit the post using other_headers
    update_payload = {
        "title": "test_QA_HackTitle",
        "content": "Hacking the content of this post.",
        "images": [],
        "hashtags": ["hack"]
    }
    response = await async_client.put(f"/api/v1/posts/{str(post.id)}", json=update_payload, headers=other_headers)
    assert response.status_code == 403
    
    # Cleanup other user
    await User.find({"email": "other_test_qa@example.com"}).delete()

@pytest.mark.asyncio
async def test_update_post_not_found(async_client, auth_headers):
    """Verify that updating a non-existent post returns 404 Not Found."""
    update_payload = {
        "title": "test_QA_NotFoundTitle",
        "content": "This post should not be found in the database.",
        "images": [],
        "hashtags": ["notfound"]
    }
    fake_id = "60c72b2f9b1d8e2b8c5a4f32"
    response = await async_client.put(f"/api/v1/posts/{fake_id}", json=update_payload, headers=auth_headers)
    assert response.status_code == 404

