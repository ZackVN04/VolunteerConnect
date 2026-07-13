import pytest
import io
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.features.activities.models import Activity, DenormalizedOrganizer, Location
from app.features.organizer_requests.models import OrganizerRequest
from app.features.registrations.models import DenormalizedActivity, DenormalizedVolunteer, Registration
from app.features.users.models import User
from app.shared.enums import UserRole, UserStatus
from app.core.security.password import get_password_hash
from app.core.security.jwt import create_access_token

TEST_EMAIL = "test_user_profile@example.com"
TEST_PHONE = "+84999999999"
TEST_PASSWORD = "StrongPassword123!"

@pytest.fixture(autouse=True)
async def cleanup_test_data():
    """Fixture to clean up test user data."""
    test_user = await User.find_one(User.email == TEST_EMAIL)
    if test_user:
        await Activity.find(Activity.organizer_id == test_user.id).delete()
        await Registration.find(Registration.volunteer_id == test_user.id).delete()
        await OrganizerRequest.find(OrganizerRequest.volunteer_id == test_user.id).delete()
    await User.find_one(User.email == TEST_EMAIL).delete()
    await User.find(User.phone_number == "+84912345678").delete()
    yield
    test_user = await User.find_one(User.email == TEST_EMAIL)
    if test_user:
        await Activity.find(Activity.organizer_id == test_user.id).delete()
        await Registration.find(Registration.volunteer_id == test_user.id).delete()
        await OrganizerRequest.find(OrganizerRequest.volunteer_id == test_user.id).delete()
    await User.find_one(User.email == TEST_EMAIL).delete()
    await User.find(User.phone_number == "+84912345678").delete()

@pytest.fixture
async def async_client():
    """Provides AsyncClient for test requests."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.fixture
async def active_user():
    """Pre-creates an active user with basic profile details."""
    user = User(
        email=TEST_EMAIL,
        phone_number=TEST_PHONE,
        hashed_password=get_password_hash(TEST_PASSWORD),
        status=UserStatus.ACTIVE,
        full_name="Original Name",
        role=UserRole.ORGANIZER
    )
    await user.insert()
    return user

@pytest.fixture
async def auth_headers(active_user):
    """Generates authorization headers for the test user."""
    access_token = create_access_token(str(active_user.id))
    return {"Authorization": f"Bearer {access_token}"}

@pytest.mark.asyncio
async def test_get_profile_me(async_client, active_user, auth_headers):
    """Happy Path: Retrieve profile details."""
    response = await async_client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == TEST_EMAIL
    assert data["full_name"] == "Original Name"
    assert data["phone_number"] == TEST_PHONE
    assert data["bio"] is None
    assert data["skills"] == []

@pytest.mark.asyncio
async def test_update_profile_all_fields(async_client, active_user, auth_headers):
    """Happy Path: Update all profile fields successfully."""
    payload = {
        "full_name": "New Updated Name",
        "phone_number": "0912345678", # Should normalize to +84912345678
        "bio": "I love volunteering and helping out communities.",
        "skills": ["Management", "Teaching", "First Aid"],
        "area_of_interest": "Đà Nẵng",
        "age": 28,
        "gender": "Female",
        "avatar_url": "http://localhost:3000/static/uploads/custom_avatar.png"
    }
    response = await async_client.put("/api/v1/users/me", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    
    # Assert response contains updated fields
    assert data["full_name"] == "New Updated Name"
    assert data["phone_number"] == "+84912345678" # Check normalization
    assert data["bio"] == "I love volunteering and helping out communities."
    assert data["skills"] == ["Management", "Teaching", "First Aid"]
    assert data["area_of_interest"] == "Đà Nẵng"
    assert data["age"] == 28
    assert data["gender"] == "Female"
    assert data["avatar_url"] == "http://localhost:3000/static/uploads/custom_avatar.png"

    # Verify directly from database
    db_user = await User.find_one(User.email == TEST_EMAIL)
    assert db_user.full_name == "New Updated Name"
    assert db_user.phone_number == "+84912345678"
    assert db_user.bio == "I love volunteering and helping out communities."
    assert db_user.skills == ["Management", "Teaching", "First Aid"]
    assert db_user.area_of_interest == "Đà Nẵng"
    assert db_user.age == 28
    assert db_user.gender == "Female"

@pytest.mark.asyncio
async def test_update_profile_syncs_denormalized_names(async_client, active_user, auth_headers):
    """Changing profile name should update denormalized user names across related collections."""
    now = datetime.now(timezone.utc)
    activity = Activity(
        organizer_id=active_user.id,
        title="test_QA_Rename Sync Activity",
        description="Activity used to verify denormalized name synchronization.",
        categories=["Môi trường"],
        location=Location(
            province="Hồ Chí Minh",
            district="Quận 1",
            address_detail="Test address"
        ),
        start_date=now + timedelta(days=1),
        end_date=now + timedelta(days=2),
        limit_volunteers=5,
        denormalized_organizer=DenormalizedOrganizer(name="Old Organizer Name")
    )
    await activity.insert()

    registration = Registration(
        volunteer_id=active_user.id,
        activity_id=activity.id,
        denormalized_volunteer=DenormalizedVolunteer(
            name="Old Volunteer Name",
            phone=active_user.phone_number,
            email=active_user.email
        ),
        denormalized_activity=DenormalizedActivity(
            title=activity.title,
            status=activity.status,
            start_date=activity.start_date,
            end_date=activity.end_date,
            organizer_id=activity.organizer_id,
            organizer_name="Old Organizer Name"
        )
    )
    await registration.insert()

    organizer_request = OrganizerRequest(
        volunteer_id=active_user.id,
        reason="I want to organize community events.",
        experience="I have coordinated several local volunteer events.",
        contact_phone=active_user.phone_number,
        denormalized_volunteer={
            "name": "Old Volunteer Name",
            "email": active_user.email
        }
    )
    await organizer_request.insert()

    legacy_organizer_request = OrganizerRequest(
        volunteer_id=active_user.id,
        reason="I want to organize another community event.",
        experience="I have legacy data without denormalized volunteer details.",
        contact_phone=active_user.phone_number,
        denormalized_volunteer=None
    )
    await legacy_organizer_request.insert()

    response = await async_client.put(
        "/api/v1/users/me",
        json={"full_name": "Synced Name"},
        headers=auth_headers
    )

    assert response.status_code == 200

    synced_activity = await Activity.get(activity.id)
    synced_registration = await Registration.get(registration.id)
    synced_request = await OrganizerRequest.get(organizer_request.id)
    synced_legacy_request = await OrganizerRequest.get(legacy_organizer_request.id)

    assert synced_activity.denormalized_organizer.name == "Synced Name"
    assert synced_registration.denormalized_volunteer.name == "Synced Name"
    assert synced_registration.denormalized_activity.organizer_id == active_user.id
    assert synced_registration.denormalized_activity.organizer_name == "Synced Name"
    assert synced_request.denormalized_volunteer["name"] == "Synced Name"
    assert synced_legacy_request.denormalized_volunteer["name"] == "Synced Name"
    assert synced_legacy_request.denormalized_volunteer["email"] == TEST_EMAIL

@pytest.mark.asyncio
async def test_media_upload_endpoint(async_client, auth_headers):
    """Happy Path: Test local development fallback file upload with custom folders."""
    file_content = b"fake image bytes"
    file_name = "test_image.png"
    
    # 1. Test default upload (should go to general)
    files = {"file": (file_name, io.BytesIO(file_content), "image/png")}
    response = await async_client.post("/api/v1/media/upload", files=files, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert "url" in data
    assert "static/uploads" in data["url"] or "storage.googleapis.com" in data["url"]

    # 2. Test uploading to custom folder "posts"
    files2 = {"file": (file_name, io.BytesIO(file_content), "image/png")}
    response2 = await async_client.post("/api/v1/media/upload?folder=posts", files=files2, headers=auth_headers)
    assert response2.status_code == 201
    assert "url" in response2.json()

    # 3. Test folder traversal attack (should safely fall back to "general")
    files3 = {"file": (file_name, io.BytesIO(file_content), "image/png")}
    response3 = await async_client.post("/api/v1/media/upload?folder=../../hack", files=files3, headers=auth_headers)
    assert response3.status_code == 201
    assert "url" in response3.json()

@pytest.mark.asyncio
async def test_media_upload_invalid_type(async_client, auth_headers):
    """Unhappy Path: Reject non-image file uploads."""
    file_content = b"plain text content"
    file_name = "document.txt"
    
    files = {"file": (file_name, io.BytesIO(file_content), "text/plain")}
    response = await async_client.post("/api/v1/media/upload", files=files, headers=auth_headers)
    
    assert response.status_code == 400
    assert "Chỉ cho phép tải lên file ảnh" in response.json()["detail"]
