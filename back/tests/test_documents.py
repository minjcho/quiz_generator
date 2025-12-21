from unittest.mock import AsyncMock, patch

from tests.conftest import (
    TEST_USER_ID,
    create_mock_execute_result,
    create_mock_table,
)


class TestCreateDocument:
    """POST /api/documents tests."""

    def test_create_document_success(self, client, sample_document):
        """Successfully create a document."""
        mock_table = create_mock_table([sample_document])

        with patch("app.services.document_service.document_service.table", mock_table):
            response = client.post(
                "/api/documents",
                json={
                    "title": "Test Document",
                    "content_text": "Test content",
                    "source_type": "text",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "document_id" in data
        assert data["message"] == "Document created"

    def test_create_document_unauthorized(self, client_no_auth):
        """Create document without auth returns 401."""
        response = client_no_auth.post(
            "/api/documents",
            json={
                "title": "Test Document",
                "content_text": "Test content",
            },
        )

        assert response.status_code == 401

    def test_create_document_url_success(self, client, sample_document):
        """Successfully create a document from URL with crawling."""
        url_document = sample_document.copy()
        url_document["source_type"] = "url"
        url_document["source_url"] = "https://example.com/article"
        url_document["content_text"] = "Crawled content from the web page."

        mock_table = create_mock_table([url_document])
        mock_crawler = AsyncMock()
        mock_crawler.extract_content.return_value = {
            "text": "Crawled content from the web page.",
            "title": "Article Title",
            "success": True,
        }

        with (
            patch("app.services.document_service.document_service.table", mock_table),
            patch("app.api.documents.url_crawler_service", mock_crawler),
        ):
            response = client.post(
                "/api/documents",
                json={
                    "title": "Test URL Document",
                    "content_text": "",
                    "source_type": "url",
                    "source_url": "https://example.com/article",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "document_id" in data
        mock_crawler.extract_content.assert_called_once_with("https://example.com/article")

    def test_create_document_url_crawl_error(self, client):
        """Create document from URL returns 400 when crawling fails."""
        mock_crawler = AsyncMock()
        mock_crawler.extract_content.side_effect = ValueError("URL에 접근할 수 없습니다")

        with patch("app.api.documents.url_crawler_service", mock_crawler):
            response = client.post(
                "/api/documents",
                json={
                    "title": "Test URL Document",
                    "content_text": "",
                    "source_type": "url",
                    "source_url": "https://invalid-url.com",
                },
            )

        assert response.status_code == 400
        assert "URL에 접근할 수 없습니다" in response.json()["detail"]


class TestListDocuments:
    """GET /api/documents tests."""

    def test_list_documents_success(self, client, sample_document):
        """Successfully list user's documents."""
        mock_table = create_mock_table([sample_document])

        with patch("app.services.document_service.document_service.table", mock_table):
            response = client.get("/api/documents")

        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
        assert len(data["documents"]) == 1

    def test_list_documents_empty(self, client):
        """List documents returns empty when user has no documents."""
        mock_table = create_mock_table([])

        with patch("app.services.document_service.document_service.table", mock_table):
            response = client.get("/api/documents")

        assert response.status_code == 200
        data = response.json()
        assert data["documents"] == []


class TestGetDocument:
    """GET /api/documents/{id} tests."""

    def test_get_document_success(self, client, sample_document):
        """Successfully get a document by ID."""
        mock_table = create_mock_table(sample_document)

        with patch("app.services.document_service.document_service.table", mock_table):
            response = client.get(f"/api/documents/{sample_document['id']}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_document["id"]
        assert data["title"] == sample_document["title"]

    def test_get_document_not_found(self, client):
        """Get non-existent document returns 404."""
        mock_table = create_mock_table(None)

        with patch("app.services.document_service.document_service.table", mock_table):
            response = client.get("/api/documents/non-existent-id")

        assert response.status_code == 404
        assert response.json()["detail"] == "Document not found"

    def test_get_document_forbidden(self, client, other_user_document):
        """Get document owned by another user returns 403."""
        mock_table = create_mock_table(other_user_document)

        with patch("app.services.document_service.document_service.table", mock_table):
            response = client.get(f"/api/documents/{other_user_document['id']}")

        assert response.status_code == 403
        assert response.json()["detail"] == "Access denied"


class TestUpdateDocument:
    """PATCH /api/documents/{id} tests."""

    def test_update_document_success(self, client, sample_document):
        """Successfully update a document."""
        updated_doc = sample_document.copy()
        updated_doc["title"] = "Updated Title"

        # Mock for get_by_id (returns original) and update (returns updated)
        mock_table = create_mock_table(sample_document)
        mock_table.update.return_value.eq.return_value.execute.return_value = (
            create_mock_execute_result([updated_doc])
        )

        with patch("app.services.document_service.document_service.table", mock_table):
            response = client.patch(
                f"/api/documents/{sample_document['id']}",
                json={"title": "Updated Title"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"

    def test_update_document_not_found(self, client):
        """Update non-existent document returns 404."""
        mock_table = create_mock_table(None)

        with patch("app.services.document_service.document_service.table", mock_table):
            response = client.patch(
                "/api/documents/non-existent-id",
                json={"title": "New Title"},
            )

        assert response.status_code == 404

    def test_update_document_forbidden(self, client, other_user_document):
        """Update document owned by another user returns 403."""
        mock_table = create_mock_table(other_user_document)

        with patch("app.services.document_service.document_service.table", mock_table):
            response = client.patch(
                f"/api/documents/{other_user_document['id']}",
                json={"title": "New Title"},
            )

        assert response.status_code == 403


class TestDeleteDocument:
    """DELETE /api/documents/{id} tests."""

    def test_delete_document_success(self, client, sample_document):
        """Successfully delete a document."""
        mock_table = create_mock_table(sample_document)
        mock_table.delete.return_value.eq.return_value.execute.return_value = (
            create_mock_execute_result([sample_document])
        )

        with patch("app.services.document_service.document_service.table", mock_table):
            response = client.delete(f"/api/documents/{sample_document['id']}")

        assert response.status_code == 200
        assert response.json()["message"] == "Document deleted"

    def test_delete_document_not_found(self, client):
        """Delete non-existent document returns 404."""
        mock_table = create_mock_table(None)

        with patch("app.services.document_service.document_service.table", mock_table):
            response = client.delete("/api/documents/non-existent-id")

        assert response.status_code == 404

    def test_delete_document_forbidden(self, client, other_user_document):
        """Delete document owned by another user returns 403."""
        mock_table = create_mock_table(other_user_document)

        with patch("app.services.document_service.document_service.table", mock_table):
            response = client.delete(f"/api/documents/{other_user_document['id']}")

        assert response.status_code == 403
