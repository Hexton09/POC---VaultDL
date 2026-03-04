# Use a lightweight Python base image
FROM python:3.11-slim

# Install system dependencies: FFmpeg is required for merging/converting
# We clean up the cache to keep the image small
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy and install Python dependencies
COPY requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt

# Copy the backend source code
COPY . .

# Start the server using the dynamic port
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]