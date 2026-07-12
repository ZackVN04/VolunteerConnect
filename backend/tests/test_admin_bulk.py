import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from beanie import PydanticObjectId

from app.main import app
from app.features.users.models import User
from app.features.activities.models import Activity
from app.features.organizer_requests.models import OrganizerRequest
from app.shared.enums import UserRole, UserStatus, RequestStatus
from app.features.activities.constants import ActivityStatus
from app.core.security.password import get_password_hash
from app.core.security.jwt import create_access_token

TEST_ADMIN_EMAIL = "test_qa_admin_bulk@example.com"
TEST_VOL1_EMAIL = "test_qa_vol1_bulk@example.com"
TEST_VOL2_EMAIL = "test_qa_vol2_bulk@example.com"
TEST_PASSWORD = "StrongPassword123!"

@pytest.fixture(autouse=True)
async def cleanup_test_data():
    # Teardown before
    await User.find({"email": {"$in": [TEST_ADMIN_EMAIL, TEST_VOL1_EMAIL, TEST_VOL2_EMAIL]}}).delete()
    await OrganizerRequest.find({"contact_phone": {"$in": ["+84999999001", "+84999999002"]}}).delete()
    await Activity.find({"title": {"$regex": "^test_bulk_.*", "$options": "i"}}).delete()
    
    yield
    
    # Teardown after
    await User.find({"email": {"$in": [TEST_ADMIN_EMAIL, TEST_VOL1_EMAIL, TEST_VOL2_EMAIL]}}).delete()
    await OrganizerRequest.find({"contact_phone": {"$in": ["+84999999001", "+84999999002"]}}).delete()
    await Activity.find({"title": {"$regex": "^test_bulk_.*", "$options": "i"}}).delete()

@pytest.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.fixture
async def admin_user():
    user = User(
        email=TEST_ADMIN_EMAIL,
        phone_number="+84999999000",
        full_name="QA Admin Bulk",
        hashed_password=get_password_hash(TEST_PASSWORD),
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE
    )
    await user.insert()
    return user

@pytest.fixture
def admin_headers(admin_user):
    token = create_access_token(subject=str(admin_user.id))
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_bulk_review_requests_approve_success(async_client, admin_headers):
    # Create two volunteer users
    vol1 = User(
        email=TEST_VOL1_EMAIL,
        phone_number="+84999999001",
        full_name="Volunteer 1",
        hashed_password=get_password_hash(TEST_PASSWORD),
        role=UserRole.VOLUNTEER,
        status=UserStatus.ACTIVE
    )
    await vol1.insert()

    vol2 = User(
        email=TEST_VOL2_EMAIL,
        phone_number="+84999999002",
        full_name="Volunteer 2",
        hashed_password=get_password_hash(TEST_PASSWORD),
        role=UserRole.VOLUNTEER,
        status=UserStatus.ACTIVE
    )
    await vol2.insert()

    # Create two pending requests
    req1 = OrganizerRequest(
        volunteer_id=vol1.id,
        reason="I want to host environment events",
        experience="5 years of volunteering",
        contact_phone="+84999999001",
        status=RequestStatus.PENDING,
        denormalized_volunteer={"name": "Volunteer 1", "phone": "+84999999001", "email": TEST_VOL1_EMAIL}
    )
    await req1.insert()

    req2 = OrganizerRequest(
        volunteer_id=vol2.id,
        reason="I want to host education events",
        experience="3 years of teaching",
        contact_phone="+84999999002",
        status=RequestStatus.PENDING,
        denormalized_volunteer={"name": "Volunteer 2", "phone": "+84999999002", "email": TEST_VOL2_EMAIL}
    )
    await req2.insert()

    # Call bulk approve
    payload = {
        "request_ids": [str(req1.id), str(req2.id)],
        "is_approved": True,
        "reason": "Approved by bulk action"
    }

    response = await async_client.patch("/api/v1/admin/requests/bulk-review", json=payload, headers=admin_headers)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["processed"] == 2
    assert res_json["data"]["skipped"] == 0

    # Verify requests status
    updated_req1 = await OrganizerRequest.get(req1.id)
    updated_req2 = await OrganizerRequest.get(req2.id)
    assert updated_req1.status == RequestStatus.APPROVED
    assert updated_req2.status == RequestStatus.APPROVED

    # Verify users role
    updated_vol1 = await User.get(vol1.id)
    updated_vol2 = await User.get(vol2.id)
    assert updated_vol1.role == "organizer"
    assert updated_vol2.role == "organizer"

@pytest.mark.asyncio
async def test_bulk_review_requests_reject_success(async_client, admin_headers):
    # Create volunteer
    vol1 = User(
        email=TEST_VOL1_EMAIL,
        phone_number="+84999999001",
        full_name="Volunteer 1",
        hashed_password=get_password_hash(TEST_PASSWORD),
        role=UserRole.VOLUNTEER,
        status=UserStatus.ACTIVE
    )
    await vol1.insert()

    # Create request
    req1 = OrganizerRequest(
        volunteer_id=vol1.id,
        reason="I want to host environment events",
        experience="5 years of volunteering",
        contact_phone="+84999999001",
        status=RequestStatus.PENDING,
        denormalized_volunteer={"name": "Volunteer 1", "phone": "+84999999001", "email": TEST_VOL1_EMAIL}
    )
    await req1.insert()

    # Call bulk reject with valid reason (between 5 and 500 chars)
    payload = {
        "request_ids": [str(req1.id)],
        "is_approved": False,
        "reason": "Not enough details provided."
    }

    response = await async_client.patch("/api/v1/admin/requests/bulk-review", json=payload, headers=admin_headers)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["processed"] == 1

    # Verify request status
    updated_req1 = await OrganizerRequest.get(req1.id)
    assert updated_req1.status == RequestStatus.REJECTED
    assert updated_req1.admin_feedback == "Not enough details provided."

    # Verify user role remains volunteer
    updated_vol1 = await User.get(vol1.id)
    assert updated_vol1.role == UserRole.VOLUNTEER

@pytest.mark.asyncio
async def test_bulk_review_requests_reject_validation_fail(async_client, admin_headers):
    payload = {
        "request_ids": ["60d5ec4b8f1b2c3d4e5f6a7b"],
        "is_approved": False,
        "reason": "Bad"  # Too short
    }

    response = await async_client.patch("/api/v1/admin/requests/bulk-review", json=payload, headers=admin_headers)
    assert response.status_code == 422 # Pydantic validation error

@pytest.mark.asyncio
async def test_bulk_review_activities_approve_success(async_client, admin_headers):
    # Create two activities with status pending review
    act1 = Activity(
        organizer_id=PydanticObjectId("60d5ec4b8f1b2c3d4e5f6a7b"),
        title="test_bulk_Activity1",
        description="Clean water campaign.",
        categories=["Y tế"],
        location={"province": "Hồ Chí Minh", "district": "Quận 1", "address_detail": "Bờ sông"},
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc),
        limit_volunteers=10,
        status=ActivityStatus.PENDING_REVIEW.value,
        denormalized_organizer={"name": "QA Org"}
    )
    await act1.insert()

    act2 = Activity(
        organizer_id=PydanticObjectId("60d5ec4b8f1b2c3d4e5f6a7b"),
        title="test_bulk_Activity2",
        description="Food drive campaign for poor families.",
        categories=["Từ thiện"],
        location={"province": "Hồ Chí Minh", "district": "Quận 3", "address_detail": "Mái ấm"},
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc),
        limit_volunteers=20,
        status=ActivityStatus.PENDING_REVIEW.value,
        denormalized_organizer={"name": "QA Org"}
    )
    await act2.insert()

    payload = {
        "activity_ids": [str(act1.id), str(act2.id)],
        "is_approved": True,
        "reason": "Looks good"
    }

    response = await async_client.patch("/api/v1/admin/activities/bulk-review", json=payload, headers=admin_headers)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["processed"] == 2

    # Verify status in database
    updated_act1 = await Activity.get(act1.id)
    updated_act2 = await Activity.get(act2.id)
    assert updated_act1.status == ActivityStatus.OPEN.value
    assert updated_act2.status == ActivityStatus.OPEN.value
