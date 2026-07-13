import uuid
import os
import re
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from google.cloud import storage
from app.core.config.settings import settings
from app.features.auth.dependencies import get_current_user
from app.features.users.models import User

router = APIRouter(prefix="/api/v1/media", tags=["Media"])

_storage_client = None

def get_storage_client():
    global _storage_client
    if _storage_client is None:
        try:
            _storage_client = storage.Client()
        except Exception:
            _storage_client = None
    return _storage_client

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "general",
    current_user: User = Depends(get_current_user)
):
    # 1. Kiểm tra định dạng file (Cho phép ảnh và video)
    allowed_image_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    allowed_video_types = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/ogg"]
    
    is_image = file.content_type in allowed_image_types
    is_video = file.content_type in allowed_video_types
    
    if not is_image and not is_video:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ cho phép tải lên file ảnh (JPEG, PNG, GIF, WEBP) hoặc video (MP4, MOV, AVI, WebM)."
        )

    # 2. Kiểm tra dung lượng file (Ảnh tối đa 2MB, Video tối đa 50MB)
    max_size = 50 * 1024 * 1024 if is_video else 2 * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_size:
        size_label = "50MB" if is_video else "2MB"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dung lượng tệp quá lớn. Vui lòng tải dưới {size_label}."
        )
    # Reset file pointer sau khi đọc
    await file.seek(0)

    # 3. Tạo tên file ngẫu nhiên để chống trùng lặp
    # Chuẩn hóa tên folder để tránh các cuộc tấn công directory traversal (ví dụ: ../)
    if not folder or not re.match(r"^[a-zA-Z0-9_-]+$", folder):
        folder = "general"

    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{folder}/{uuid.uuid4()}{file_ext}"

    # 4. Tải lên Google Cloud Storage (GCS)
    try:
        # Lấy client GCS đã cache
        storage_client = get_storage_client()
        if storage_client is None:
            raise Exception("GCS Client is not configured")
        bucket = storage_client.bucket(settings.GCS_BUCKET_NAME)
        blob = bucket.blob(unique_filename)

        # Upload file stream
        blob.upload_from_file(file.file, content_type=file.content_type)

        # 5. Sinh URL công khai của ảnh trên Cloud Storage
        public_url = f"https://storage.googleapis.com/{settings.GCS_BUCKET_NAME}/{unique_filename}"
        return {"url": public_url}

    except Exception as e:
        # Hỗ trợ Fallback lưu cục bộ cho môi trường phát triển / test (khi không chạy trên Cloud Run)
        is_cloud_run = os.getenv("K_SERVICE") is not None
        if not is_cloud_run:
            fallback_dir = os.path.join(os.getcwd(), "static", "uploads")
            os.makedirs(fallback_dir, exist_ok=True)
            local_filename = f"{uuid.uuid4()}{file_ext}"
            local_path = os.path.join(fallback_dir, local_filename)
            
            with open(local_path, "wb") as f:
                f.write(contents)
                
            return {"url": f"http://localhost:3000/static/uploads/{local_filename}"}
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi tải ảnh lên Google Cloud Storage: {str(e)}"
        )
