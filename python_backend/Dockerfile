# Ultra-lightweight image for API relay
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set the working directory
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create temp directory for file processing
RUN mkdir -p /tmp/conversions && chmod -R 777 /tmp/conversions

# Run the server
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT}"]
