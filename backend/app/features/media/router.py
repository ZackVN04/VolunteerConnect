import uuid
import os
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from google.cloud import storage
from app.core.config.settings import settings
from app.features.auth.dependencies import get_current_user
from app.features.users.models import User

router = APIRouter(prefix="/api/v1/media", tags=["Media"])

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # 1. Kiểm tra định dạng file (Chỉ cho phép file ảnh)
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ cho phép tải lên file ảnh (JPEG, PNG, GIF, WEBP)."
        )

    # 2. Kiểm tra dung lượng file (Giới hạn 2MB)
    MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dung lượng ảnh quá lớn. Vui lòng tải ảnh dưới 2MB."
        )
    # Reset file pointer sau khi đọc
    await file.seek(0)

    # 3. Tạo tên file ngẫu nhiên để chống trùng lặp
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"avatars/{uuid.uuid4()}{file_ext}"

    # 4. Tải lên Google Cloud Storage (GCS)
    try:
        # Khởi tạo client GCS (Sẽ tự động lấy Credentials trong môi trường Cloud Run revision)
        storage_client = storage.Client()
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
