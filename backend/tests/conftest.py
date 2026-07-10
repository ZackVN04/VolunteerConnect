import pytest
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config.settings import settings
from app.features.users.models import User
from app.features.organizer_requests.models import OrganizerRequest
from app.features.activities.models import Activity
from app.features.registrations.models import Registration
from app.features.posts.models import Post

# =============================================================================
# SAFETY GUARD — BẢO VỆ DATABASE PRODUCTION KHỎI BỊ XÓA KHI CHẠY TEST
# =============================================================================
# Tên database dành riêng cho môi trường test.
# KHÔNG BAO GIỜ thay đổi dòng này thành "volunteer_connect" (tên DB thật).
TEST_DATABASE_NAME = "volunteer_connect_test_db"

# Danh sách tên database bị CẤM sử dụng trong môi trường test.
# Nếu conftest phát hiện bất kỳ tên nào trong danh sách này, nó sẽ TỪ CHỐI
# khởi động và dừng toàn bộ quá trình pytest ngay lập tức.
FORBIDDEN_DB_NAMES = {"volunteer_connect", "volunteer-connect", "volunteerconnect"}


def _get_db_name_from_uri(uri: str) -> str:
    """Trích xuất tên database từ MongoDB URI."""
    try:
        # Xử lý định dạng: mongodb://host:port/dbname?options
        path_part = uri.split("/")[-1].split("?")[0]
        return path_part if path_part else ""
    except Exception:
        return ""


def _assert_test_database_is_safe():
    """
    Kiểm tra an toàn: ABORT nếu MONGO_URI đang trỏ về database production.
    Đây là lớp bảo vệ cứng (hard guard) chống xóa nhầm database thật.
    """
    # Nếu kết nối tới localhost hoặc 127.0.0.1, coi như chạy test cục bộ, bỏ qua kiểm tra
    if "localhost" in settings.MONGO_URI or "127.0.0.1" in settings.MONGO_URI:
        return

    db_name_from_uri = _get_db_name_from_uri(settings.MONGO_URI)

    if db_name_from_uri in FORBIDDEN_DB_NAMES:
        print("\n" + "=" * 70, file=sys.stderr)
        print("🚨 SAFETY GUARD: PYTEST BỊ CHẶN LẠI!", file=sys.stderr)
        print("=" * 70, file=sys.stderr)
        print(f"  MONGO_URI đang trỏ đến database: '{db_name_from_uri}'", file=sys.stderr)
        print(f"  Đây là tên database PRODUCTION — KHÔNG ĐƯỢC phép chạy test!", file=sys.stderr)
        print("", file=sys.stderr)
        print("  CÁCH SỬA:", file=sys.stderr)
        print("  Đổi MONGODB_URL trong file .env thành:", file=sys.stderr)
        print(f"  mongodb://localhost:27017/{TEST_DATABASE_NAME}", file=sys.stderr)
        print("  Hoặc tạo file backend/.env.test với nội dung tương tự.", file=sys.stderr)
        print("=" * 70 + "\n", file=sys.stderr)
        sys.exit(1)  # Dừng pytest ngay lập tức, không cho chạy bất kỳ test nào


def _get_collection(model):
    if hasattr(model, "get_pymongo_collection"):
        return model.get_pymongo_collection()
    return model.get_motor_collection()


@pytest.fixture(scope="function", autouse=True)
async def initialize_db():
    """
    Khởi tạo kết nối Beanie MongoDB cho môi trường test.

    SAFETY: Fixture này luôn kết nối đến 'volunteer_connect_test_db',
    KHÔNG BAO GIỜ kết nối đến database production 'volunteer_connect'.
    Safety Guard sẽ abort pytest ngay lập tức nếu phát hiện nguy hiểm.
    """
    # Lớp bảo vệ cứng: kiểm tra URI trước khi làm bất cứ điều gì
    _assert_test_database_is_safe()

    # Tránh lỗi tương thích phiên bản Beanie và Motor
    AsyncIOMotorClient.append_metadata = lambda self, *args, **kwargs: None

    client = AsyncIOMotorClient(settings.MONGO_URI)

    # LUÔN LUÔN dùng test database riêng biệt — KHÔNG dùng get_default_database()
    # vì get_default_database() sẽ đọc tên DB từ URI và có thể trả về DB thật.
    db = client[TEST_DATABASE_NAME]

    # Failsafe: Xóa chỉ mục cũ để tránh lỗi xung đột index trong DB test
    try:
        await db.users.drop_index("phone_number_1")
    except Exception:
        pass

    await init_beanie(
        database=db,
        document_models=[
            User,
            OrganizerRequest,
            Activity,
            Registration,
            Post
        ]
    )

    # [ĐÃ TẮT THEO YÊU CẦU] Không tự động xóa dữ liệu trước mỗi test case
    # await _get_collection(User).delete_many({})
    # await _get_collection(OrganizerRequest).delete_many({})
    # await _get_collection(Activity).delete_many({})
    # await _get_collection(Registration).delete_many({})
    # await _get_collection(Post).delete_many({})

    yield

    # [ĐÃ TẮT THEO YÊU CẦU] Không tự động xóa dữ liệu sau mỗi test case
    # await _get_collection(User).delete_many({})
    # await _get_collection(OrganizerRequest).delete_many({})
    # await _get_collection(Activity).delete_many({})
    # await _get_collection(Registration).delete_many({})
    # await _get_collection(Post).delete_many({})

    client.close()
