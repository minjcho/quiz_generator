from functools import lru_cache

import jwt
from fastapi import Header, HTTPException

from app.core.config import settings


@lru_cache()
def get_jwt_secret() -> str:
    """Supabase JWT Secret 가져오기"""
    # Supabase JWT secret은 프로젝트 설정에서 확인 가능
    # 기본적으로 service_role_key에서 추출하거나 별도 설정 필요
    return settings.SUPABASE_JWT_SECRET


def decode_jwt(token: str) -> dict:
    """Supabase JWT 토큰 디코딩

    Supabase JWT는 다음 클레임을 포함:
    - sub: user_id (UUID)
    - email: 사용자 이메일
    - role: authenticated
    - aud: authenticated
    """
    try:
        # Supabase는 HS256 알고리즘 사용
        # JWT secret이 설정되지 않은 경우 검증 없이 디코딩
        jwt_secret = settings.SUPABASE_JWT_SECRET

        if jwt_secret:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            # JWT secret이 없으면 검증 없이 디코딩 (개발용)
            payload = jwt.decode(
                token,
                options={"verify_signature": False},
            )

        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def get_current_user_id(authorization: str | None = Header(None)) -> str:
    """Authorization 헤더에서 user_id 추출

    Args:
        authorization: "Bearer <jwt_token>" 형식의 헤더

    Returns:
        user_id (UUID string)

    Raises:
        HTTPException: 인증 실패 시
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Use 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization[7:]  # "Bearer " 제거

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Token is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_jwt(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token: missing user id",
        )

    return user_id
