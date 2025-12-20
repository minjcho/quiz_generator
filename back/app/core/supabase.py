from supabase import create_client, Client

from app.core.config import settings

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Supabase 클라이언트 싱글톤"""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
    return _supabase_client


def get_supabase_admin() -> Client:
    """Service Role Key를 사용하는 Admin 클라이언트 (RLS 우회)"""
    return get_supabase()
