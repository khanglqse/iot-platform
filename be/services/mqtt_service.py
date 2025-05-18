import os
import json
import paho.mqtt.client as mqtt
from typing import Any, Dict, List, Optional
from database import db
import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from models import SensorFeed
from dotenv import load_dotenv
import asyncio
from concurrent.futures import ThreadPoolExecutor
import threading
import logging

load_dotenv()

# MQTT Configuration
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_TOPIC = "sensors/data"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MQTTService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MQTTService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.mqtt_client = mqtt.Client()
        self.mqtt_broker = MQTT_BROKER
        self.mqtt_port = MQTT_PORT
        
        # Set up callbacks
        self.mqtt_client.on_connect = self.on_connect
        self.mqtt_client.on_message = self.on_message
        
        # Connect to broker
        self.mqtt_client.connect(self.mqtt_broker, self.mqtt_port, 60)
        self.mqtt_client.loop_start()
        
        # Use synchronous MongoDB client for MQTT callbacks
        self.sync_client = MongoClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
        self.sync_db = self.sync_client[os.getenv("MONGODB_DB", "iot_db")]
        self.sync_collection = self.sync_db.sensor_data
        
        # Keep async collection for API endpoints
        self.sensor_collection = db.sensor_data
        
        self._initialized = True

    def on_connect(self, client, userdata, flags, rc):
        logger.info(f"Connected to MQTT broker with result code {rc}")
        client.subscribe(MQTT_TOPIC)
        logger.info(f"Subscribed to {MQTT_TOPIC}")

    def on_message(self, client, userdata, msg):
        """Handle incoming MQTT messages"""
        try:
            # Parse the message payload
            payload = msg.payload.decode()
            logger.info(f"Received message: {payload}")
            data = json.loads(payload)
            
            # Process data synchronously
            self.process_sensor_data_sync(data)
            
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON: {e}")
        except Exception as e:
            logger.error(f"Error processing message: {e}")

    def process_sensor_data_sync(self, data: Dict[str, Any]):
        """Process sensor data synchronously"""
        try:
            # Convert string timestamp to datetime
            data["timestamp"] = datetime.datetime.fromisoformat(data["timestamp"])
            
            # Add type field based on the data content
            if "soil_moisture" in data:
                data["type"] = "plant"
            elif "light_level" in data:
                data["type"] = "environment"
            else:
                data["type"] = "sensor"
            
            # Save to database synchronously
            self.save_sensor_data_sync(data)
            
        except Exception as e:
            logger.error(f"Error processing sensor data: {e}")

    def save_sensor_data_sync(self, data: Dict[str, Any]) -> str:
        """Save sensor data to database synchronously"""
        try:
            # Use synchronous MongoDB operations
            result = self.sync_collection.insert_one(data)
            logger.info(f"Saved {data['type']} data with ID: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error saving sensor data: {e}")
            raise

    async def get_sensor_data(
        self,
        type: Optional[str] = None,
        device_id: Optional[str] = None,
        start_time: Optional[datetime.datetime] = None,
        end_time: Optional[datetime.datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get sensor data with filters"""
        try:
            query = {}
            if type:
                query["type"] = type
            if device_id:
                query["device_id"] = device_id
            if start_time or end_time:
                query["timestamp"] = {}
                if start_time:
                    query["timestamp"]["$gte"] = start_time
                if end_time:
                    query["timestamp"]["$lte"] = end_time

            cursor = self.sensor_collection.find(query).sort("timestamp", -1).limit(limit)
            results = []
            async for document in cursor:
                document["_id"] = str(document["_id"])
                results.append(document)
            return results
        except Exception as e:
            logger.error(f"Error getting sensor data: {e}")
            raise

    async def get_sensor_stats(
        self,
        type: Optional[str] = None,
        device_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get statistics for sensor data"""
        try:
            match = {}
            if type:
                match["type"] = type
            if device_id:
                match["device_id"] = device_id

            pipeline = [
                {"$match": match},
                {"$group": {
                    "_id": None,
                    "avg_temperature": {"$avg": "$temperature"},
                    "avg_humidity": {"$avg": "$humidity"},
                    "avg_light": {"$avg": "$light_level"},
                    "avg_moisture": {"$avg": "$soil_moisture"},
                    "count": {"$sum": 1}
                }}
            ]

            result = await self.sensor_collection.aggregate(pipeline).to_list(1)
            return result[0] if result else {}
        except Exception as e:
            logger.error(f"Error getting sensor stats: {e}")
            raise

    async def publish_message(self, topic: str, payload: Dict[str, Any]) -> bool:
        """Publish a message to an MQTT topic"""
        try:
            message = json.dumps(payload)
            result = self.mqtt_client.publish(topic, message)
            if result.rc != 0:
                logger.error(f"Error publishing message to {topic}: {result.rc}")
            return result.rc == 0
        except Exception as e:
            logger.error(f"Error publishing message: {e}")
            return False

    def start(self):
        """Start MQTT client"""
        try:
            logger.info(f"Connecting to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
            self.mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
            self.mqtt_client.loop_start()
            logger.info("MQTT client started")
        except Exception as e:
            logger.error(f"Error connecting to MQTT broker: {e}")

    def stop(self):
        """Stop MQTT client"""
        self.mqtt_client.loop_stop()
        self.mqtt_client.disconnect()
        self.sync_client.close()
        logger.info("MQTT client stopped") 