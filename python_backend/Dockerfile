# Lightweight image for WeasyPrint HTML-to-PDF conversion
FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install WeasyPrint system dependencies + fonts for Debian Bookworm
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    libglib2.0-0 \
    shared-mime-info \
    fonts-liberation \
    fonts-noto-core \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /tmp/conversions && chmod -R 777 /tmp/conversions

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT}"]
