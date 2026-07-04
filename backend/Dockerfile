# ==============================================================================
# STAGE 1: Builder - Install dependencies into a separate virtual environment
# ==============================================================================
FROM python:3.11-slim AS builder

# Prevent Python from writing .pyc files to disk and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Copy the dependencies file
COPY requirements.txt .

# Create a virtual environment and install dependencies (fully isolated)
RUN python -m venv /app/venv \
    && /app/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /app/venv/bin/pip install --no-cache-dir -r requirements.txt

# ==============================================================================
# STAGE 2: Runtime - Copy only necessary files, excluding build artifacts
# ==============================================================================
FROM python:3.11-slim AS runtime

# Prevent Python from writing .pyc files to disk and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /app/venv /app/venv

# Copy the application source code (ignoring files specified in .dockerignore)
COPY app/ ./app/

# Create a non-root user to run the application securely
RUN adduser --disabled-password --gecos "" appuser \
    && chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Expose port 8080 (Cloud Run injects the PORT environment variable)
ENV PORT=8080
EXPOSE 8080

# Run the FastAPI application using the virtual environment's uvicorn
CMD ["/app/venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
