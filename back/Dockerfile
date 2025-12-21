FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (gcc for building, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user first
RUN useradd --create-home appuser

# Copy requirements and install (non-editable for production)
COPY pyproject.toml ./
RUN pip install --no-cache-dir .

# Copy application with correct ownership
COPY --chown=appuser:appuser app ./app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
