#!/bin/bash
# ConstructIQ Backend — Container Entrypoint Script

set -e  # Exit immediately if any command fails

echo "ConstructIQ Backend — Starting Up"

echo "Waiting for PostgreSQL to accept connections..."

MAX_RETRIES=30
RETRY_COUNT=0

while ! python -c "
import psycopg
try:
    psycopg.connect('${DATABASE_URL}')
    print('Database is ready.')
except Exception:
    exit(1)
" 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "FATAL: Could not connect to PostgreSQL after ${MAX_RETRIES} attempts."
        exit 1
    fi
    echo "   Attempt ${RETRY_COUNT}/${MAX_RETRIES} — retrying in 2 seconds..."
    sleep 2
done

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

echo "Starting application server..."

if [ $# -gt 0 ]; then
    # If a command was passed, run it
    exec "$@"
else
    # Start Daphne ASGI Server
    echo "Starting Daphne ASGI Server on port 8000..."
    exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
fi
