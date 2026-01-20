FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install minimal OS packages (adjust if you need DB clients or system libs)
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application sources
COPY . .

# Expose port used by Uvicorn in the container
EXPOSE 8080

# Start the app
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
