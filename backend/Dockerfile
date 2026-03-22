FROM python:3.14-slim

WORKDIR /app

RUN apt-get update && apt-get install -y\
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

#non-root user for security
RUN adduser --disabled-password --gecos '' appuser
USER appuser

EXPOSE 8000

CMD [ "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1" ]
