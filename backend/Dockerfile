# Base image
FROM python:3.10-slim


# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy all backend code
COPY . .

# Expose the port Render sets
ENV PORT 8000
EXPOSE $PORT

# Set environment variable for unbuffered output (logs in real-time)
ENV PYTHONUNBUFFERED=1

# Run the app with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${PORT}"]

