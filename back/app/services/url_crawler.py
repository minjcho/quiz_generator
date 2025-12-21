"""URL 크롤링 서비스 - 웹 페이지에서 본문 텍스트 추출"""

import trafilatura


class UrlCrawlerService:
    """URL에서 본문 텍스트를 추출하는 서비스"""

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
        # URL에서 HTML 다운로드
        downloaded = trafilatura.fetch_url(url)

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
