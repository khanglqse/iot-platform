#!/bin/bash

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
sleep 10

# Initialize database with mock data
# python init_db.py

# Start the FastAPI application
uvicorn main:app --host 0.0.0.0 --port 8000 --reload 