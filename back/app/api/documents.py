from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.services.document_service import document_service
from app.core.auth import get_current_user_id

router = APIRouter()


class DocumentCreate(BaseModel):
    title: str
    source_type: str = "text"  # text | pdf | url
    content_text: str
    source_url: str | None = None


class DocumentUpdate(BaseModel):
    title: str | None = None
    content_text: str | None = None


class DocumentResponse(BaseModel):
    id: str
    user_id: str
    title: str
    source_type: str
    source_url: str | None
    content_text: str
    created_at: str
    updated_at: str


@router.post("", response_model=dict)
async def create_document(
    document: DocumentCreate,
    user_id: str = Depends(get_current_user_id),
):
    """문서 생성"""

    result = await document_service.create(
        user_id=user_id,
        title=document.title,
        content_text=document.content_text,
        source_type=document.source_type,
        source_url=document.source_url,
    )

    if not result:
        raise HTTPException(status_code=500, detail="Failed to create document")

    return {"document_id": result["id"], "message": "Document created"}


@router.get("")
async def list_documents(user_id: str = Depends(get_current_user_id)):
    """문서 목록 조회"""
    documents = await document_service.get_by_user(user_id)
    return {"documents": documents}


@router.get("/{document_id}")
async def get_document(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """문서 상세 조회"""
    document = await document_service.get_by_id(document_id)

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # 소유권 확인
    if document["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return document


@router.patch("/{document_id}")
async def update_document(
    document_id: str,
    update: DocumentUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """문서 수정"""

    # 기존 문서 확인
    existing = await document_service.get_by_id(document_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Document not found")
    if existing["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await document_service.update(
        document_id=document_id,
        title=update.title,
        content_text=update.content_text,
    )

    return result


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """문서 삭제"""

    # 기존 문서 확인
    existing = await document_service.get_by_id(document_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Document not found")
    if existing["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    success = await document_service.delete(document_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete document")

    return {"message": "Document deleted"}
