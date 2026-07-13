import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta, timezone
from beanie import PydanticObjectId

from app.main import app
from app.features.users.models import User
from app.features.activities.models import Activity
from app.shared.enums import UserRole, UserStatus
from app.features.activities.constants import ActivityStatus
from app.core.security.password import get_password_hash
from app.core.security.jwt import create_access_token

# Constants for testing
TEST_ORG_EMAIL = "test_qa_organizer@example.com"
TEST_VOL_EMAIL = "test_qa_volunteer@example.com"
TEST_PASSWORD = "StrongPassword123!"

@pytest.fixture(autouse=True)
async def cleanup_test_data():
    """Fixture to clean up test data before and after each test case."""
    # Teardown before
    await Activity.find({"title": {"$regex": "^test_QA_.*", "$options": "i"}}).delete()
    await User.find({"email": {"$in": [TEST_ORG_EMAIL, TEST_VOL_EMAIL]}}).delete()
    
    yield
    
    # Teardown after
    await Activity.find({"title": {"$regex": "^test_QA_.*", "$options": "i"}}).delete()
    await User.find({"email": {"$in": [TEST_ORG_EMAIL, TEST_VOL_EMAIL]}}).delete()

@pytest.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.fixture
async def organizer_user():
    user = User(
        email=TEST_ORG_EMAIL,
        phone_number="+84999999991",
        full_name="QA Organizer",
        hashed_password=get_password_hash(TEST_PASSWORD),
        role=UserRole.ORGANIZER,
        status=UserStatus.ACTIVE
    )
    await user.insert()
    return user

@pytest.fixture
async def volunteer_user():
    user = User(
        email=TEST_VOL_EMAIL,
        phone_number="+84999999992",
        full_name="QA Volunteer",
        hashed_password=get_password_hash(TEST_PASSWORD),
        role=UserRole.VOLUNTEER,
        status=UserStatus.ACTIVE
    )
    await user.insert()
    return user

@pytest.fixture
def org_headers(organizer_user):
    token = create_access_token(subject=str(organizer_user.id))
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def vol_headers(volunteer_user):
    token = create_access_token(subject=str(volunteer_user.id))
    return {"Authorization": f"Bearer {token}"}

# ==========================================
# TEST CASES FOR ACTIVITY LIFECYCLE
# ==========================================

@pytest.mark.asyncio
async def test_create_activity_success(async_client, org_headers):
    """Happy Path: Organizer tạo hoạt động thành công (Trạng thái Draft)."""
    payload = {
        "title": "test_QA_CleanUpDay",
        "description": "Chiến dịch dọn dẹp rác thải bờ sông Hồng của QA Team.",
        "categories": ["Môi trường"],
        "location": {
            "province": "Hà Nội",
            "district": "Long Biên",
            "address_detail": "Chân cầu Long Biên"
        },
        "start_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "end_date": (datetime.now(timezone.utc) + timedelta(days=2, hours=4)).isoformat(),
        "limit_volunteers": 50,
        "requirements": "Mang theo dụng cụ cá nhân",
        "image_url": "http://example.com/image.png"
    }
    
    response = await async_client.post("/api/v1/activities", json=payload, headers=org_headers)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["status"] == ActivityStatus.DRAFT
    assert res_json["data"]["title"] == "test_QA_CleanUpDay"
    assert res_json["data"]["organizer_name"] == "QA Organizer"

@pytest.mark.asyncio
async def test_create_activity_forbidden_for_volunteer(async_client, vol_headers):
    """Negative Case: Volunteer không được phép tạo hoạt động (Expects 403)."""
    payload = {
        "title": "test_QA_VolunteerClean",
        "description": "Chiến dịch dọn dẹp rác thải bờ sông Hồng của QA Team.",
        "categories": ["Môi trường"],
        "location": {
            "province": "Hà Nội",
            "district": "Long Biên",
            "address_detail": "Chân cầu Long Biên"
        },
        "start_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "end_date": (datetime.now(timezone.utc) + timedelta(days=2, hours=4)).isoformat(),
        "limit_volunteers": 50
    }
    
    response = await async_client.post("/api/v1/activities", json=payload, headers=vol_headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_create_activity_invalid_dates(async_client, org_headers):
    """Negative Case: Ngày kết thúc trước ngày bắt đầu (Expects 422)."""
    payload = {
        "title": "test_QA_InvalidDates",
        "description": "Chiến dịch dọn dẹp rác thải bờ sông Hồng của QA Team.",
        "categories": ["Môi trường"],
        "location": {
            "province": "Hà Nội",
            "district": "Long Biên",
            "address_detail": "Chân cầu Long Biên"
        },
        "start_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "end_date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),  # Nhỏ hơn start_date
        "limit_volunteers": 50
    }
    
    response = await async_client.post("/api/v1/activities", json=payload, headers=org_headers)
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_get_activity_list_and_detail(async_client, organizer_user):
    """Happy Path: Lấy danh sách hoạt động open và xem chi tiết."""
    # Tạo sẵn 1 hoạt động có status Open trong DB
    activity = Activity(
        organizer_id=organizer_user.id,
        title="test_QA_OpenActivity",
        description="Chiến dịch dọn dẹp rác thải bờ sông Hồng của QA Team.",
        categories=["Môi trường"],
        location={
            "province": "Hà Nội",
            "district": "Long Biên",
            "address_detail": "Chân cầu Long Biên"
        },
        start_date=datetime.now(timezone.utc) + timedelta(days=2),
        end_date=datetime.now(timezone.utc) + timedelta(days=2, hours=4),
        limit_volunteers=50,
        status=ActivityStatus.OPEN,
        denormalized_organizer={"name": "QA Organizer"}
    )
    await activity.insert()

    # 1. Test get list
    list_resp = await async_client.get("/api/v1/activities")
    assert list_resp.status_code == 200
    list_json = list_resp.json()
    assert list_json["success"] is True
    assert list_json["data"]["total"] >= 1
    
    # 2. Test get detail
    detail_resp = await async_client.get(f"/api/v1/activities/{str(activity.id)}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["data"]["title"] == "test_QA_OpenActivity"

@pytest.mark.asyncio
async def test_update_activity_success(async_client, org_headers, organizer_user):
    """Happy Path: Organizer cập nhật thông tin hoạt động Draft thành công."""
    activity = Activity(
        organizer_id=organizer_user.id,
        title="test_QA_DraftForUpdate",
        description="Chiến dịch dọn dẹp rác thải bờ sông Hồng của QA Team.",
        categories=["Môi trường"],
        location={
            "province": "Hà Nội",
            "district": "Long Biên",
            "address_detail": "Chân cầu Long Biên"
        },
        start_date=datetime.now(timezone.utc) + timedelta(days=2),
        end_date=datetime.now(timezone.utc) + timedelta(days=2, hours=4),
        limit_volunteers=50,
        status=ActivityStatus.DRAFT,
        denormalized_organizer={"name": "QA Organizer"}
    )
    await activity.insert()

    payload = {
        "title": "test_QA_DraftUpdatedTitle",
        "limit_volunteers": 60
    }
    
    response = await async_client.patch(f"/api/v1/activities/{str(activity.id)}", json=payload, headers=org_headers)
    assert response.status_code == 200
    assert response.json()["data"]["title"] == "test_QA_DraftUpdatedTitle"
    assert response.json()["data"]["limit_volunteers"] == 60

@pytest.mark.asyncio
async def test_update_activity_forbidden_status(async_client, org_headers, organizer_user):
    """Negative Case: Chỉnh sửa hoạt động đã gửi duyệt (Expects 400)."""
    activity = Activity(
        organizer_id=organizer_user.id,
        title="test_QA_PendingForUpdate",
        description="Chiến dịch dọn dẹp rác thải bờ sông Hồng của QA Team.",
        categories=["Môi trường"],
        location={
            "province": "Hà Nội",
            "district": "Long Biên",
            "address_detail": "Chân cầu Long Biên"
        },
        start_date=datetime.now(timezone.utc) + timedelta(days=2),
        end_date=datetime.now(timezone.utc) + timedelta(days=2, hours=4),
        limit_volunteers=50,
        status=ActivityStatus.PENDING_REVIEW, # Đang pending_review không được sửa
        denormalized_organizer={"name": "QA Organizer"}
    )
    await activity.insert()

    payload = {
        "title": "test_QA_UpdatedPending"
    }
    
    response = await async_client.patch(f"/api/v1/activities/{str(activity.id)}", json=payload, headers=org_headers)
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_submit_and_cancel_activity(async_client, org_headers, organizer_user):
    """Happy Path: Submit hoạt động nháp và hủy hoạt động."""
    activity = Activity(
        organizer_id=organizer_user.id,
        title="test_QA_DraftLifecycle",
        description="Chiến dịch dọn dẹp rác thải bờ sông Hồng của QA Team.",
        categories=["Môi trường"],
        location={
            "province": "Hà Nội",
            "district": "Long Biên",
            "address_detail": "Chân cầu Long Biên"
        },
        start_date=datetime.now(timezone.utc) + timedelta(days=2),
        end_date=datetime.now(timezone.utc) + timedelta(days=2, hours=4),
        limit_volunteers=50,
        status=ActivityStatus.DRAFT,
        denormalized_organizer={"name": "QA Organizer"}
    )
    await activity.insert()

    # 1. Submit
    submit_resp = await async_client.post(f"/api/v1/activities/{str(activity.id)}/submit", headers=org_headers)
    assert submit_resp.status_code == 200
    assert submit_resp.json()["data"]["status"] == ActivityStatus.PENDING_REVIEW

    # 2. Cancel
    cancel_resp = await async_client.post(f"/api/v1/activities/{str(activity.id)}/cancel", headers=org_headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["data"]["status"] == ActivityStatus.CANCELLED

@pytest.mark.asyncio
async def test_register_ended_activity_fails(async_client, vol_headers, organizer_user):
    """Negative Case: Đăng ký tham gia hoạt động đã kết thúc (Expects 400)."""
    activity = Activity(
        organizer_id=organizer_user.id,
        title="test_QA_EndedActivity",
        description="Hoạt động này đã diễn ra trong quá khứ.",
        categories=["Môi trường"],
        location={
            "province": "Hà Nội",
            "district": "Long Biên",
            "address_detail": "Chân cầu Long Biên"
        },
        start_date=datetime.now(timezone.utc) - timedelta(days=2),
        end_date=datetime.now(timezone.utc) - timedelta(days=1),
        limit_volunteers=50,
        status=ActivityStatus.OPEN,
        denormalized_organizer={"name": "QA Organizer"}
    )
    await activity.insert()

    response = await async_client.post(f"/api/v1/activities/{str(activity.id)}/registrations", headers=vol_headers)
    assert response.status_code == 400
    assert "đã kết thúc" in response.json()["detail"]

@pytest.mark.asyncio
async def test_register_active_activity_success(async_client, vol_headers, organizer_user):
    """Happy Path: Đăng ký tham gia hoạt động đang mở thành công."""
    activity = Activity(
        organizer_id=organizer_user.id,
        title="test_QA_ActiveActivity",
        description="Hoạt động đang mở nhận đăng ký.",
        categories=["Môi trường"],
        location={
            "province": "Hà Nội",
            "district": "Long Biên",
            "address_detail": "Chân cầu Long Biên"
        },
        start_date=datetime.now(timezone.utc) + timedelta(days=5),
        end_date=datetime.now(timezone.utc) + timedelta(days=5, hours=4),
        limit_volunteers=50,
        status=ActivityStatus.OPEN,
        denormalized_organizer={"name": "QA Organizer"}
    )
    await activity.insert()

    response = await async_client.post(f"/api/v1/activities/{str(activity.id)}/registrations", headers=vol_headers)
    assert response.status_code == 201
    assert response.json()["data"]["status"] == "pending"
