from pydantic import BaseModel
from typing import Optional, List


class SyncScreeningItem(BaseModel):
    id: str
    patient_id: str
    severity_grade: Optional[int] = None
    confidence_score: Optional[float] = None
    is_uncertain: bool = False
    image_path: Optional[str] = None
    device_id: Optional[str] = None


class SyncBatchRequest(BaseModel):
    device_id: str
    results: List[SyncScreeningItem]


class SyncItemResult(BaseModel):
    id: str
    status: str  # "inserted" | "already_synced" | "failed"
    detail: Optional[str] = None


class SyncBatchResponse(BaseModel):
    total_received: int
    inserted: int
    already_synced: int
    failed: int
    items: List[SyncItemResult]