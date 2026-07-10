import asyncio
from app.features.admin.schemas import AdminReviewRequest
from app.shared.enums import RequestStatus

def test_validation():
    print("--- TESTING < 5 CHARACTERS ---")
    try:
        req = AdminReviewRequest(status=RequestStatus.REJECTED, reason="No")
        print("FAIL: Accepted 'No'")
    except ValueError as e:
        print("PASS: Rejected 'No'", e)

    print("\n--- TESTING EXACTLY 500 CHARACTERS ---")
    try:
        req = AdminReviewRequest(status=RequestStatus.REJECTED, reason="A" * 500)
        print("PASS: Accepted 500 characters")
    except ValueError as e:
        print("FAIL: Rejected 500 characters", e)

    print("\n--- TESTING 501 CHARACTERS ---")
    try:
        req = AdminReviewRequest(status=RequestStatus.REJECTED, reason="A" * 501)
        print("FAIL: Accepted 501 characters")
    except ValueError as e:
        print("PASS: Rejected 501 characters", e)

if __name__ == "__main__":
    test_validation()
