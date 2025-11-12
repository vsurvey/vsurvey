# Base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy all backend source code
COPY . .

# Expose port (Render will set $PORT automatically)
ENV PORT=8000
EXPOSE 8000

# Ensure real-time logs
ENV PYTHONUNBUFFERED=1

# Start FastAPI server
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
