import bcrypt

def get_password_hash(password: str) -> str:
    # bcrypt yêu cầu mật khẩu dưới dạng bytes
    password_bytes = password.encode('utf-8')
    # Tạo salt và hash mật khẩu
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        plain_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False
