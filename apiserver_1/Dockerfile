# syntax=docker/dockerfile:1
FROM python:3.11-slim

# System deps for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libpq-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app/app.py ./

# Expose Flask port
EXPOSE 5051

# Gunicorn for prod-like serving
CMD ["gunicorn", "--bind", "0.0.0.0:5051", "--workers", "2", "--threads", "4", "app:app"]