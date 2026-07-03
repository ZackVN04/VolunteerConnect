import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
from datetime import datetime, timedelta, timezone

from app.main import app
from app.features.users.models import User
from app.shared.enums import UserStatus
from app.core.security.password import get_password_hash
from app.core.security.jwt import create_access_token, create_refresh_token

# Constants for testing
TEST_EMAIL = "test_qa@example.com"
TEST_PHONE = "+84999999999"
TEST_PASSWORD = "StrongPassword123!"

@pytest.fixture(autouse=True)
async def cleanup_test_data():
    """Fixture to clean up test data before and after each test case, ensuring idempotent tests."""
    # Teardown before running
    await User.find({"email": {"$regex": "^test_QA_.*@example.com", "$options": "i"}}).delete()
    await User.find({"phone_number": {"$regex": "^\\+8499999999"}}).delete()
    await User.find_one(User.email == TEST_EMAIL).delete()
    
    yield
    
    # Teardown after running
    await User.find({"email": {"$regex": "^test_QA_.*@example.com", "$options": "i"}}).delete()
    await User.find({"phone_number": {"$regex": "^\\+8499999999"}}).delete()
    await User.find_one(User.email == TEST_EMAIL).delete()

@pytest.fixture
async def async_client():
    """Provides an AsyncClient to send HTTP requests to the FastAPI app."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.fixture
async def active_user():
    """Pre-creates an ACTIVE user for testing Login."""
    user = User(
        email=TEST_EMAIL,
        phone_number=TEST_PHONE,
        hashed_password=get_password_hash(TEST_PASSWORD),
        status=UserStatus.ACTIVE
    )
    await user.insert()
    return user

@pytest.fixture
async def pending_user():
    """Pre-creates a PENDING_OTP user for testing OTP verification."""
    user = User(
        email="test_QA_pending@example.com",
        phone_number="+84999999998",
        hashed_password=get_password_hash(TEST_PASSWORD),
        status=UserStatus.PENDING_OTP,
        otp_code="123456",
        otp_expiry=datetime.now(timezone.utc) + timedelta(minutes=5)
    )
    await user.insert()
    return user

@pytest.fixture
async def banned_user():
    """Pre-creates a BANNED user for testing Login restrictions."""
    user = User(
        email="test_QA_banned@example.com",
        phone_number="+84999999997",
        hashed_password=get_password_hash(TEST_PASSWORD),
        status=UserStatus.BANNED
    )
    await user.insert()
    return user

# ==========================================
# 1. TEST CASES FOR REGISTRATION (REGISTER)
# ==========================================

@pytest.mark.asyncio
@patch("app.features.auth.router.send_otp_sms", new_callable=AsyncMock)
async def test_register_success(mock_send_sms, async_client):
    """Happy Path: Successful registration with valid data (Expects 201)."""
    payload = {
        "email": TEST_EMAIL,
        "phone_number": TEST_PHONE,
        "password": TEST_PASSWORD
    }
    response = await async_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "user_id" in data
    
    # Check if the Twilio SMS mock was called (Does not send real SMS)
    mock_send_sms.assert_called_once()
    assert mock_send_sms.call_args[0][0] == TEST_PHONE

@pytest.mark.asyncio
@patch("app.features.auth.router.send_otp_sms", new_callable=AsyncMock)
async def test_register_duplicate_email(mock_send_sms, async_client, active_user):
    """Negative Case: Registration with an already existing email (Expects 400)."""
    payload = {
        "email": TEST_EMAIL,
        "phone_number": "+84999999990",
        "password": TEST_PASSWORD
    }
    response = await async_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "Email" in response.json()["detail"]
    mock_send_sms.assert_not_called()

@pytest.mark.asyncio
@patch("app.features.auth.router.send_otp_sms", new_callable=AsyncMock)
async def test_register_duplicate_phone(mock_send_sms, async_client, active_user):
    """Negative Case: Registration with an already existing phone number (Expects 400)."""
    payload = {
        "email": "test_QA_unique@example.com",
        "phone_number": TEST_PHONE,
        "password": TEST_PASSWORD
    }
    response = await async_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    mock_send_sms.assert_not_called()

@pytest.mark.asyncio
async def test_register_invalid_phone_format(async_client):
    """Negative Case: Registration with an invalid E.164 phone number format (Expects 422)."""
    payload = {
        "email": "test_QA_invalid@example.com",
        "phone_number": "0123456",  # Missing + and country code
        "password": TEST_PASSWORD
    }
    response = await async_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422  # Pydantic validation error

# ==========================================
# 2. TEST CASES FOR OTP VERIFICATION (VERIFY OTP)
# ==========================================

@pytest.mark.asyncio
async def test_verify_otp_success(async_client, pending_user):
    """Happy Path: Successful OTP verification (Expects 200, status = ACTIVE)."""
    payload = {
        "phone_number": pending_user.phone_number,
        "otp_code": "123456"
    }
    response = await async_client.post("/api/v1/auth/verify-otp", json=payload)
    assert response.status_code == 200
    
    # Check in DB if the user has transitioned to ACTIVE status
    updated_user = await User.get(pending_user.id)
    assert updated_user.status == UserStatus.ACTIVE
    assert updated_user.otp_code is None

@pytest.mark.asyncio
async def test_verify_otp_invalid_code(async_client, pending_user):
    """Negative Case: Incorrect OTP code (Expects 400)."""
    payload = {
        "phone_number": pending_user.phone_number,
        "otp_code": "000000"
    }
    response = await async_client.post("/api/v1/auth/verify-otp", json=payload)
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_verify_otp_expired(async_client, pending_user):
    """Negative Case: Expired OTP code (Expects 400)."""
    # Force the OTP to be expired directly in the database
    pending_user.otp_expiry = datetime.now(timezone.utc) - timedelta(minutes=1)
    await pending_user.save()
    
    payload = {
        "phone_number": pending_user.phone_number,
        "otp_code": "123456"
    }
    response = await async_client.post("/api/v1/auth/verify-otp", json=payload)
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_verify_otp_already_active(async_client, active_user):
    """Negative Case: Attempting to verify an already active user (Expects 400)."""
    payload = {
        "phone_number": active_user.phone_number,
        "otp_code": "123456"
    }
    response = await async_client.post("/api/v1/auth/verify-otp", json=payload)
    assert response.status_code == 400

# ==========================================
# 3. TEST CASES FOR LOGIN
# ==========================================

@pytest.mark.asyncio
async def test_login_success(async_client, active_user):
    """Happy Path: Successful login returning Tokens (Expects 200)."""
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    response = await async_client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

@pytest.mark.asyncio
async def test_login_invalid_password(async_client, active_user):
    """Negative Case: Login with incorrect password (Expects 401)."""
    payload = {
        "email": TEST_EMAIL,
        "password": "WrongPassword123!"
    }
    response = await async_client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_login_pending_otp(async_client, pending_user):
    """Negative Case: Login when OTP is not yet verified (Expects 403)."""
    payload = {
        "email": pending_user.email,
        "password": TEST_PASSWORD
    }
    response = await async_client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_login_banned(async_client, banned_user):
    """Negative Case: Login when the account is banned (Expects 403)."""
    payload = {
        "email": banned_user.email,
        "password": TEST_PASSWORD
    }
    response = await async_client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 403

# ==========================================
# 4. TEST CASES FOR REFRESH TOKEN
# ==========================================

@pytest.mark.asyncio
async def test_refresh_token_success(async_client, active_user):
    """Happy Path: Valid refresh token returning a new token (Expects 200)."""
    refresh_token = create_refresh_token(str(active_user.id))
    payload = {"refresh_token": refresh_token}
    
    response = await async_client.post("/api/v1/auth/refresh-token", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["access_token"] != refresh_token

@pytest.mark.asyncio
async def test_refresh_token_tampered(async_client):
    """Negative Case: Invalid or tampered refresh token (Expects 401)."""
    payload = {"refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake_payload.fake_signature"}
    response = await async_client.post("/api/v1/auth/refresh-token", json=payload)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_refresh_token_expired(async_client, active_user):
    """Negative Case: Expired refresh token (Expects 401)."""
    # Create a refresh token with a lifespan of -1 minute (already expired)
    expired_token = create_refresh_token(str(active_user.id), expires_delta=timedelta(minutes=-1))
    payload = {"refresh_token": expired_token}
    
    response = await async_client.post("/api/v1/auth/refresh-token", json=payload)
    assert response.status_code == 401
