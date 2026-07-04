import httpx
import logging
from app.core.config.settings import settings

logger = logging.getLogger("sms")

async def send_otp_sms(phone_number: str, otp_code: str) -> bool:
    """
    Gửi mã OTP qua tin nhắn SMS sử dụng API của eSMS.vn.
    - Sử dụng HTTP POST gọi JSON API của eSMS
    - Tự động chuẩn hóa định dạng số điện thoại Việt Nam (+84 -> 0)
    """
    url = "https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json"
    
    # Chuẩn hóa định dạng số điện thoại (eSMS yêu cầu bắt đầu bằng 09... hoặc 849...)
    normalized_phone = phone_number
    if normalized_phone.startswith("+84"):
        normalized_phone = "0" + normalized_phone[3:]
    elif normalized_phone.startswith("+"):
        normalized_phone = normalized_phone[1:]

    payload = {
        "ApiKey": settings.ESMS_API_KEY,
        "SecretKey": settings.ESMS_SECRET_KEY,
        "Phone": normalized_phone,
        "Content": f"Ma xac thuc VolunteerConnect cua ban la: {otp_code}. Ma co hieu luc trong 5 phut.",
        "SmsType": settings.ESMS_SMS_TYPE,
        "Brandname": settings.ESMS_BRANDNAME,
        "IsUnicode": 0,
        "Sandbox": settings.ESMS_SANDBOX
    }

    try:
        # Gọi API eSMS dạng async không chặn server
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            response_data = response.json()
            
            # eSMS trả về CodeResult = "100" nếu yêu cầu được chấp nhận gửi đi thành công
            if response_data.get("CodeResult") == "100":
                logger.info(f"✅ Đã gửi SMS OTP qua eSMS tới {normalized_phone} (SMSID: {response_data.get('SMSID')})")
                return True
            else:
                error_msg = response_data.get("ErrorMessage", "Không rõ nguyên nhân")
                logger.error(f"❌ eSMS từ chối gửi tin: CodeResult={response_data.get('CodeResult')}, Lỗi={error_msg}")
                # Fallback: In ra màn hình để DEV lấy OTP test offline
                print(f"🔑 [DEV ONLY] Ma OTP cua {phone_number} la: {otp_code}")
                return False
    except Exception as e:
        logger.error(f"❌ Lỗi hệ thống khi kết nối eSMS.vn: {e}")
        # Fallback: In ra màn hình để DEV lấy OTP test offline
        print(f"🔑 [DEV ONLY] Ma OTP cua {phone_number} la: {otp_code}")
        return False
