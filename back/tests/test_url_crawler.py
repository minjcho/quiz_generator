"""URL Crawler Service tests."""

from unittest.mock import AsyncMock, patch

import pytest

from app.services.url_crawler import UrlCrawlerService


class TestUrlCrawlerService:
    """URL Crawler Service tests."""

    @pytest.fixture
    def crawler(self):
        """Create UrlCrawlerService instance."""
        return UrlCrawlerService()

    @pytest.mark.asyncio
    async def test_extract_content_success(self, crawler):
        """Successfully extract content from URL."""
        mock_html = "<html><body><p>This is the main content.</p></body></html>"
        # Text must be at least 50 characters
        mock_text = (
            "This is the main content of the article. "
            "It contains enough text to pass the minimum length requirement."
        )

        with (
            patch("trafilatura.fetch_url", return_value=mock_html),
            patch("trafilatura.extract", return_value=mock_text),
            patch("trafilatura.extract_metadata") as mock_metadata,
        ):
            mock_metadata.return_value.title = "Test Article Title"

            result = await crawler.extract_content("https://example.com/article")

        assert result["success"] is True
        assert result["text"] == mock_text
        assert result["title"] == "Test Article Title"

    @pytest.mark.asyncio
    async def test_extract_content_no_title(self, crawler):
        """Extract content when page has no title."""
        mock_html = "<html><body><p>Content without title metadata.</p></body></html>"
        # Text must be at least 50 characters
        mock_text = (
            "Content without title metadata. "
            "This is still a valid article with enough text content."
        )

        with (
            patch("trafilatura.fetch_url", return_value=mock_html),
            patch("trafilatura.extract", return_value=mock_text),
            patch("trafilatura.extract_metadata", return_value=None),
        ):
            result = await crawler.extract_content("https://example.com/no-title")

        assert result["success"] is True
        assert result["text"] == mock_text
        assert result["title"] is None

    @pytest.mark.asyncio
    async def test_extract_content_url_not_accessible(self, crawler):
        """Raise error when URL is not accessible."""
        with patch("trafilatura.fetch_url", return_value=None):
            with pytest.raises(ValueError) as exc_info:
                await crawler.extract_content("https://invalid-url.com")

        assert "URL에 접근할 수 없습니다" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_extract_content_no_text(self, crawler):
        """Raise error when no text can be extracted."""
        mock_html = "<html><body></body></html>"

        with (
            patch("trafilatura.fetch_url", return_value=mock_html),
            patch("trafilatura.extract", return_value=None),
        ):
            with pytest.raises(ValueError) as exc_info:
                await crawler.extract_content("https://example.com/empty")

        assert "본문 텍스트를 추출할 수 없습니다" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_extract_content_too_short(self, crawler):
        """Raise error when extracted text is too short."""
        mock_html = "<html><body><p>Short</p></body></html>"

        with (
            patch("trafilatura.fetch_url", return_value=mock_html),
            patch("trafilatura.extract", return_value="Short"),
        ):
            with pytest.raises(ValueError) as exc_info:
                await crawler.extract_content("https://example.com/short")

        assert "본문 텍스트를 추출할 수 없습니다" in str(exc_info.value)
