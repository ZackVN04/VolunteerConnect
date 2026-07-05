from fastapi import Depends
from app.features.registrations.repositories import RegistrationRepository
from app.features.registrations.services import RegistrationService

def get_registration_repository() -> RegistrationRepository:
    return RegistrationRepository()

def get_registration_service(
    repository: RegistrationRepository = Depends(get_registration_repository)
) -> RegistrationService:
    return RegistrationService(repository)
