"""URL 크롤링 서비스 - 웹 페이지에서 본문 텍스트 추출"""

from urllib.parse import urlparse

import trafilatura
from trafilatura.settings import use_config

# 타임아웃 설정 (초) - configparser는 문자열 사용
DOWNLOAD_TIMEOUT = 10

# SSRF 방지를 위한 차단 목록
BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]
BLOCKED_PREFIXES = ["192.168.", "10.", "172.16.", "172.17.", "172.18.", "172.19.",
                    "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
                    "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
                    "169.254."]



class UrlCrawlerService:
    """URL에서 본문 텍스트를 추출하는 서비스"""

    def _validate_url(self, url: str) -> None:
        """
        URL 보안 검증 (SSRF 방지)

        Args:
            url: 검증할 URL

        Raises:
            ValueError: 허용되지 않는 URL인 경우
        """
        parsed = urlparse(url)

        # 스킴 검증
        if parsed.scheme not in ["http", "https"]:
            raise ValueError("HTTP/HTTPS URL만 지원됩니다.")

        hostname = parsed.hostname or ""

        # 차단된 호스트 검증
        if hostname in BLOCKED_HOSTS:
            raise ValueError("내부 네트워크 URL은 허용되지 않습니다.")

        # 차단된 IP 대역 검증
        if any(hostname.startswith(prefix) for prefix in BLOCKED_PREFIXES):
            raise ValueError("내부 네트워크 URL은 허용되지 않습니다.")

    async def extract_content(self, url: str) -> dict:
        """
        URL에서 본문 텍스트와 메타데이터를 추출합니다.

        Args:
            url: 크롤링할 웹 페이지 URL

        Returns:
            dict: {
                "text": 추출된 본문 텍스트,
                "title": 페이지 제목 (없으면 None),
                "success": 성공 여부
            }

        Raises:
            ValueError: URL 접근 또는 본문 추출 실패 시
        """
        # URL 보안 검증
        self._validate_url(url)

        # URL에서 HTML 다운로드 (타임아웃 설정)
        config = use_config()
        config.set("DEFAULT", "DOWNLOAD_TIMEOUT", str(DOWNLOAD_TIMEOUT))
        downloaded = trafilatura.fetch_url(url, config=config)

        if not downloaded:
            raise ValueError(f"URL에 접근할 수 없습니다: {url}")

        # 본문 텍스트 추출
        text = trafilatura.extract(
            downloaded,
            include_comments=False,
            include_tables=True,
            no_fallback=False,
        )

        if not text or len(text.strip()) < 50:
            raise ValueError("본문 텍스트를 추출할 수 없습니다. 콘텐츠가 너무 적거나 지원하지 않는 형식입니다.")

        # 메타데이터 추출
        metadata = trafilatura.extract_metadata(downloaded)
        title = metadata.title if metadata and metadata.title else None

        return {
            "text": text.strip(),
            "title": title,
            "success": True,
        }


url_crawler_service = UrlCrawlerService()
