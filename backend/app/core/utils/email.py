import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import asyncio
import logging
import os
from app.core.config.settings import settings

logger = logging.getLogger("email")

# Absolute path to the logo file (Group 3)
base_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(base_dir, "..", "..", "..", ".."))
LOGO_PATH = os.path.join(project_root, "frontend", "src", "assets", "logo-removebg-preview.png")

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

        # Đính kèm Logo dưới dạng CID (Content-ID) nếu tệp tin tồn tại
        if os.path.exists(LOGO_PATH):
            try:
                with open(LOGO_PATH, "rb") as f:
                    logo_data = f.read()
                logo_mime = MIMEImage(logo_data)
                logo_mime.add_header("Content-ID", "<logo>")
                logo_mime.add_header("Content-Disposition", "inline", filename="logo.png")
                message.attach(logo_mime)
            except Exception as le:
                logger.warning(f"Không thể đính kèm logo vào email: {le}")

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
    
    # Kiểm tra sự tồn tại của logo để đính kèm CID hoặc hiển thị chữ thay thế
    if os.path.exists(LOGO_PATH):
        logo_html = '<img src="cid:logo" alt="VolunteerConnect Logo" style="height: 56px; width: auto; display: block; margin: 0 auto;">'
    else:
        logo_html = '<h1 style="color: #006d37; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; font-family: \'Segoe UI\', sans-serif;">VolunteerConnect</h1>'

    html_content = f"""
    <html>
        <body style="margin: 0; padding: 0; background-color: #f8faf9; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #2d3748; -webkit-font-smoothing: antialiased;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8faf9; padding: 50px 10px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 109, 55, 0.04); border-top: 6px solid #006d37;">
                            <!-- Centered Logo Header -->
                            <tr>
                                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                                    {logo_html}
                                </td>
                            </tr>
                            <!-- Main Content -->
                            <tr>
                                <td style="padding: 20px 40px 30px 40px; text-align: left;">
                                    <h2 style="color: #1a202c; margin: 0 0 16px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">Kích hoạt tài khoản</h2>
                                    
                                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: #4a5568;">
                                        Xin chào,<br><br>
                                        Cảm ơn bạn đã đăng ký tham gia mạng lưới tình nguyện <strong>VolunteerConnect</strong>. Để kích hoạt tài khoản và bắt đầu tham gia các hoạt động ý nghĩa, vui lòng sử dụng mã OTP dưới đây:
                                    </p>
                                    
                                    <!-- OTP Display Card -->
                                    <div style="background-color: #f0f7f4; border: 1px solid rgba(0, 109, 55, 0.08); border-radius: 16px; padding: 24px; text-align: center; margin: 30px 0;">
                                        <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #006d37; text-transform: uppercase; letter-spacing: 1.5px;">Mã xác thực của bạn</p>
                                        <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #006d37; display: inline-block; padding: 4px 0 4px 10px;">
                                            {otp_code}
                                        </span>
                                        <p style="margin: 8px 0 0 0; font-size: 12px; color: #718096;">Mã có hiệu lực trong vòng <strong>5 phút</strong></p>
                                    </div>

                                    <!-- Security Warning Box -->
                                    <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 12px; padding: 16px; margin: 24px 0; display: flex; align-items: flex-start; gap: 8px;">
                                        <span style="font-size: 16px; line-height: 1.4; display: inline-block; vertical-align: middle;">⚠️</span>
                                        <span style="font-size: 13px; line-height: 1.5; color: #c53030; font-weight: 500; display: inline-block; vertical-align: middle; margin-left: 6px;">
                                            Để đảm bảo an toàn tuyệt đối, vui lòng không chia sẻ mã OTP này với bất kỳ ai, kể cả nhân viên hỗ trợ của VolunteerConnect.
                                        </span>
                                    </div>

                                    <p style="margin: 32px 0 0 0; font-size: 15px; line-height: 1.7; color: #4a5568;">
                                        Trân trọng,<br>
                                        <strong>Đội ngũ VolunteerConnect</strong>
                                    </p>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #edf2f7;">
                                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #a0aec0; line-height: 1.5;">
                                        Đây là email tự động từ hệ thống VolunteerConnect.<br>Vui lòng không trả lời trực tiếp email này.
                                    </p>
                                    <p style="margin: 0; font-size: 11px; color: #cbd5e0;">
                                        © 2026 VolunteerConnect. Bảo lưu mọi quyền.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
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
    subject = "VolunteerConnect - Khôi phục mật khẩu tài khoản"
    
    # Kiểm tra sự tồn tại của logo để đính kèm CID hoặc hiển thị chữ thay thế
    if os.path.exists(LOGO_PATH):
        logo_html = '<img src="cid:logo" alt="VolunteerConnect Logo" style="height: 56px; width: auto; display: block; margin: 0 auto;">'
    else:
        logo_html = '<h1 style="color: #0d47a1; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; font-family: \'Segoe UI\', sans-serif;">VolunteerConnect</h1>'

    html_content = f"""
    <html>
        <body style="margin: 0; padding: 0; background-color: #f8faf9; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #2d3748; -webkit-font-smoothing: antialiased;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8faf9; padding: 50px 10px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(13, 71, 161, 0.04); border-top: 6px solid #0d47a1;">
                            <!-- Centered Logo Header -->
                            <tr>
                                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                                    {logo_html}
                                </td>
                            </tr>
                            <!-- Main Content -->
                            <tr>
                                <td style="padding: 20px 40px 30px 40px; text-align: left;">
                                    <h2 style="color: #1a202c; margin: 0 0 16px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
                                    
                                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: #4a5568;">
                                        Xin chào,<br><br>
                                        Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản <strong>VolunteerConnect</strong> của bạn. Vui lòng sử dụng mã xác thực dưới đây để thiết lập mật khẩu mới:
                                    </p>
                                    
                                    <!-- OTP Display Card -->
                                    <div style="background-color: #f0f4f8; border: 1px solid rgba(13, 71, 161, 0.08); border-radius: 16px; padding: 24px; text-align: center; margin: 30px 0;">
                                        <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #0d47a1; text-transform: uppercase; letter-spacing: 1.5px;">Mã xác thực của bạn</p>
                                        <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0d47a1; display: inline-block; padding: 4px 0 4px 10px;">
                                            {otp_code}
                                        </span>
                                        <p style="margin: 8px 0 0 0; font-size: 12px; color: #718096;">Mã có hiệu lực trong vòng <strong>5 phút</strong></p>
                                    </div>

                                    <!-- Security Warning Box -->
                                    <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 12px; padding: 16px; margin: 24px 0; display: flex; align-items: flex-start; gap: 8px;">
                                        <span style="font-size: 16px; line-height: 1.4; display: inline-block; vertical-align: middle;">⚠️</span>
                                        <span style="font-size: 13px; line-height: 1.5; color: #c53030; font-weight: 500; display: inline-block; vertical-align: middle; margin-left: 6px;">
                                            Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này một cách an toàn. Mật khẩu của bạn sẽ được giữ nguyên mà không có bất kỳ thay đổi nào.
                                        </span>
                                    </div>

                                    <p style="margin: 32px 0 0 0; font-size: 15px; line-height: 1.7; color: #4a5568;">
                                        Trân trọng,<br>
                                        <strong>Đội ngũ VolunteerConnect</strong>
                                    </p>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #edf2f7;">
                                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #a0aec0; line-height: 1.5;">
                                        Đây là email tự động từ hệ thống VolunteerConnect.<br>Vui lòng không trả lời trực tiếp email này.
                                    </p>
                                    <p style="margin: 0; font-size: 11px; color: #cbd5e0;">
                                        © 2026 VolunteerConnect. Bảo lưu mọi quyền.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
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
