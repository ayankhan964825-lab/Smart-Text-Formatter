# Lightweight image — no Chromium or LibreOffice needed
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install WeasyPrint system dependencies + fonts
# WeasyPrint needs: pango, cairo, gdk-pixbuf, libffi
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    # WeasyPrint rendering engine dependencies
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    libglib2.0-0 \
    shared-mime-info \
    # Fonts — Liberation Serif is metrically identical to Times New Roman
    fonts-liberation \
    fonts-freefont-ttf \
    fonts-noto \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create temp directory
RUN mkdir -p /tmp/conversions && chmod -R 777 /tmp/conversions

# Run the server
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT}"]
