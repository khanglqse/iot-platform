import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
db = client.iot_db

# Ensure indexes
async def setup_indexes():
    # Device status indexes
    await db.device_status.create_index([("id", 1)])
    await db.device_status.create_index([("timestamp", -1)])
    
    # Device logs indexes
    await db.device_logs.create_index([("device_id", 1)])
    await db.device_logs.create_index([("timestamp", -1)])
    
    # Timer indexes
    await db.timers.create_index([("device_id", 1)])
    await db.timers.create_index([("is_active", 1)])
    
