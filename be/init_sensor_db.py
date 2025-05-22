from pymongo import MongoClient
import random
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from tqdm import tqdm
import math

# Load environment variables
load_dotenv()

# Connect to MongoDB
client = MongoClient(os.getenv('MONGODB_URL', 'mongodb://localhost:27017'))
db = client['iot_db']
sensor_collection = db['sensor_data']

# Configuration
TOTAL_RECORDS = 10000000 # 2 million records
BATCH_SIZE = 10000  # Insert records in batches for better performance
MONTHS_RANGE = 18

DEVICE_LOCATIONS = [
    {"device_id": "raspberry_pi_001", "location": "living_room", "type": "environment"},
    {"device_id": "raspberry_pi_002", "location": "bedroom", "type": "environment"},
    {"device_id": "raspberry_pi_003", "location": "kitchen", "type": "environment"},
    {"device_id": "raspberry_pi_004", "location": "garage", "type": "environment"},
    {"device_id": "raspberry_pi_005", "location": "garden", "type": "plant"},
    {"device_id": "raspberry_pi_006", "location": "bathroom", "type": "environment"},
    {"device_id": "raspberry_pi_007", "location": "office", "type": "environment"},
]

def generate_mock_data(timestamp):
    device = random.choice(DEVICE_LOCATIONS)
    is_plant_sensor = device["type"] == "plant"

    data = {
        "device_id": device["device_id"],
        "timestamp": timestamp,
        "temperature": round(random.uniform(20.0, 35.0), 2),
        "humidity": round(random.uniform(40.0, 80.0), 2),
        "light_level": round(random.uniform(0.0, 100.0), 2),
        "location": device["location"],
        "battery_level": round(random.uniform(80.0, 100.0), 2),
        "signal_strength": round(random.uniform(-80.0, -40.0), 2),
        "type": device["type"],
        "soil_moisture": round(random.uniform(20.0, 90.0), 2)
    }

    # Add soil moisture only for plant sensors
    
    # Add time-based variations
    hour = timestamp.hour
    if 6 <= hour < 18:  # Daytime
        data["light_level"] = round(random.uniform(60.0, 100.0), 2)
        data["temperature"] = round(random.uniform(25.0, 35.0), 2)
    else:  # Nighttime
        data["light_level"] = round(random.uniform(0.0, 30.0), 2)
        data["temperature"] = round(random.uniform(20.0, 28.0), 2)

    return data

def init_sensor_db():
    # Clear existing data
    sensor_collection.delete_many({})
    
    # Calculate time range
    end_time = datetime.now()
    start_time = end_time - timedelta(days=30*MONTHS_RANGE)
    time_range = (end_time - start_time).total_seconds()
    
    # Calculate average time interval between records
    interval = time_range / TOTAL_RECORDS
    
    mock_data = []
    batches = math.ceil(TOTAL_RECORDS / BATCH_SIZE)
    
    print("Generating and inserting sensor data...")
    with tqdm(total=TOTAL_RECORDS, desc="Generating records") as pbar:
        for i in range(TOTAL_RECORDS):
            # Generate timestamp with some randomization around the calculated interval
            random_offset = random.uniform(-interval/2, interval/2)
            timestamp = start_time + timedelta(seconds=i*interval + random_offset)
            
            # Generate and append data
            data = generate_mock_data(timestamp)
            mock_data.append(data)
            
            # Insert batch if we've reached BATCH_SIZE
            if len(mock_data) >= BATCH_SIZE or i == TOTAL_RECORDS - 1:
                sensor_collection.insert_many(mock_data)
                pbar.update(len(mock_data))
                mock_data = []

    print(f"\nSuccessfully inserted {TOTAL_RECORDS} sensor records")

    # Create indexes for better query performance
    print("Creating indexes...")
    sensor_collection.create_index([("timestamp", -1)])
    sensor_collection.create_index([("device_id", 1), ("timestamp", -1)])
    sensor_collection.create_index([("type", 1), ("timestamp", -1)])
    sensor_collection.create_index([("location", 1), ("timestamp", -1)])

if __name__ == "__main__":
    init_sensor_db()
