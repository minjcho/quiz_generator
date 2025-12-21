from app.core.supabase import get_supabase_admin


class DocumentService:
    def __init__(self):
        self.client = get_supabase_admin()
        self.table = self.client.table("documents")

    async def create(
        self,
        user_id: str,
        title: str,
        content_text: str,
        source_type: str = "text",
        source_url: str | None = None,
    ) -> dict:
        """문서 생성"""
        data = {
            "user_id": user_id,
            "title": title,
            "content_text": content_text,
            "source_type": source_type,
            "source_url": source_url,
        }
        result = self.table.insert(data).execute()
        return result.data[0] if result.data else None

    async def get_by_id(self, document_id: str) -> dict | None:
        """문서 ID로 조회"""
        result = self.table.select("*").eq("id", document_id).single().execute()
        return result.data if result.data else None

    async def get_by_user(self, user_id: str) -> list[dict]:
        """사용자의 모든 문서 조회"""
        result = (
            self.table.select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    async def update(
        self,
        document_id: str,
        title: str | None = None,
        content_text: str | None = None,
    ) -> dict | None:
        """문서 수정"""
        data = {}
        if title is not None:
            data["title"] = title
        if content_text is not None:
            data["content_text"] = content_text

        if not data:
            return await self.get_by_id(document_id)

        result = self.table.update(data).eq("id", document_id).execute()
        return result.data[0] if result.data else None

    async def delete(self, document_id: str) -> bool:
        """문서 삭제"""
        result = self.table.delete().eq("id", document_id).execute()
        return len(result.data) > 0 if result.data else False


document_service = DocumentService()
