import asyncio
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from app.core.config.settings import settings

def _send_sms_sync(phone_number: str, otp_code: str):
    """
    Hàm nội bộ chạy đồng bộ (sync) gọi Twilio API.
    Sẽ được bọc bằng asyncio.to_thread để không block event loop của FastAPI.
    """
    try:
        # Khởi tạo Twilio Client từ thông số cài đặt (lấy từ .env)
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        # Gửi tin nhắn chứa mã OTP
        message = client.messages.create(
            body=f"Ma xac thuc VolunteerConnect cua ban la: {otp_code}. Ma co hieu luc trong 5 phut.",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        print(f"✅ Đã gửi SMS OTP tới {phone_number} (SID: {message.sid})")
        return True
    except TwilioRestException as e:
        print(f"❌ Lỗi gửi SMS qua Twilio: {e}")
        return False
    except Exception as e:
        print(f"❌ Lỗi hệ thống khi gửi SMS: {e}")
        return False

async def send_otp_sms(phone_number: str, otp_code: str) -> bool:
    """
    Gửi mã OTP qua tin nhắn SMS sử dụng Twilio API.
    - Chạy trên một thread riêng (to_thread) để đảm bảo tốc độ của Server.
    """
    success = await asyncio.to_thread(_send_sms_sync, phone_number, otp_code)
    return success
