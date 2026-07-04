import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
import logging
from app.core.config.settings import settings

logger = logging.getLogger("email")

def _send_email_sync(email_to: str, subject: str, html_content: str) -> bool:
    """
    Hàm đồng bộ kết nối SMTP Server gửi email.
    Được chạy trên thread riêng bằng asyncio.to_thread để tránh blocking.
    """
    # Nếu không cấu hình SMTP credentials, báo lỗi và trả về False để kích hoạt fallback
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials are not configured. Email will not be sent.")
        return False

    try:
        # Khởi tạo tin nhắn MIME
        message = MIMEMultipart()
        message["From"] = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
        message["To"] = email_to
        message["Subject"] = subject

        # Đính kèm nội dung HTML
        message.attach(MIMEText(html_content, "html", "utf-8"))

        # Kết nối tới SMTP Server (Mặc định hỗ trợ TLS trên cổng 587)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10.0) as server:
            server.starttls()  # Kích hoạt mã hóa bảo mật TLS
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(
                message["From"],
                message["To"],
                message.as_string()
            )
        logger.info(f"✅ Đã gửi email OTP tới {email_to}")
        return True
    except Exception as e:
        logger.error(f"❌ Lỗi gửi email qua SMTP: {e}")
        return False

async def send_otp_email(email_to: str, otp_code: str) -> bool:
    """
    Gửi mã OTP xác nhận tài khoản qua email.
    """
    subject = "VolunteerConnect - Mã OTP kích hoạt tài khoản"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #4CAF50; text-align: center;">Kích hoạt tài khoản VolunteerConnect</h2>
                <p>Xin chào,</p>
                <p>Cảm ơn bạn đã đăng ký tham gia mạng lưới tình nguyện <strong>VolunteerConnect</strong>.</p>
                <p>Mã xác thực OTP kích hoạt tài khoản của bạn là:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #ff5722; border: 2px dashed #ff5722; padding: 10px 20px; border-radius: 4px; display: inline-block;">
                        {otp_code}
                    </span>
                </div>
                <p style="color: #666; font-size: 13px;">* Lưu ý: Mã OTP này có giá trị hiệu lực trong vòng <strong>5 phút</strong>.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">Đây là email tự động từ hệ thống VolunteerConnect, vui lòng không phản hồi email này.</p>
            </div>
        </body>
    </html>
    """
    
    success = await asyncio.to_thread(_send_email_sync, email_to, subject, html_content)
    if not success:
        # Fallback: In mã OTP ra terminal của dev để có thể copy đăng nhập nhanh offline
        print("\n" + "="*80)
        print(f"[DEV ONLY - EMAIL FALLBACK] Ma OTP cua {email_to} la: {otp_code}")
        print("="*80 + "\n")
        
    return success

async def send_reset_password_email(email_to: str, otp_code: str) -> bool:
    """
    Gửi mã OTP khôi phục mật khẩu qua email.
    """
    subject = "VolunteerConnect - Khoi phuc mat khau tai khoan"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2196F3; text-align: center;">Yeu cau khoi phuc mat khau</h2>
                <p>Xin chao,</p>
                <p>Chung toi nhan duoc yeu cau khoi phuc mat khau cho tai khoan <strong>VolunteerConnect</strong> cua ban.</p>
                <p>Ma xac thuc OTP de thiet lap mat khau moi cua ban la:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #2196F3; border: 2px dashed #2196F3; padding: 10px 20px; border-radius: 4px; display: inline-block;">
                        {otp_code}
                    </span>
                </div>
                <p style="color: #666; font-size: 13px;">* Luu y: Ma OTP nay co gia tri hieu luc trong vong <strong>5 phut</strong>. Neu ban khong gui yeu cau nay, vui long bo qua email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">Day la email tu dong tu he thong VolunteerConnect, vui long khong phan hoi email nay.</p>
            </div>
        </body>
    </html>
    """
    
    success = await asyncio.to_thread(_send_email_sync, email_to, subject, html_content)
    if not success:
        # Fallback: In mã OTP ra terminal bằng ký tự không dấu tránh lỗi encoding trên Windows
        print("\n" + "="*80)
        print(f"[DEV ONLY - EMAIL FALLBACK] Ma OTP RESET PASSWORD cua {email_to} la: {otp_code}")
        print("="*80 + "\n")
        
    return success
