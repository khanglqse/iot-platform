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
from services.trigger_service import TriggerService

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
        
        self.trigger_service = TriggerService()
        
        self._initialized = True

    def on_connect(self, client, userdata, flags, rc):
        logger.info(f"Connected to MQTT broker with result code {rc}")
        client.subscribe(MQTT_TOPIC)
        logger.info(f"Subscribed to {MQTT_TOPIC}")

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
            
            # Process triggers synchronously
            self.process_triggers_sync(data)
            
        except Exception as e:
            logger.error(f"Error processing sensor data: {e}")

    def process_triggers_sync(self, sensor_data: Dict[str, Any]):
        """Process triggers synchronously"""
        try:
            device_id = sensor_data.get("device_id")
            if not device_id:
                return

            # Get all active triggers using synchronous client
            triggers_collection = self.sync_db.triggers
            all_triggers = list(triggers_collection.find({"is_active": True}))
            
            device_triggers = [
                trigger for trigger in all_triggers 
                if trigger.get("sensor_device_id") == device_id
            ]

            # Check each trigger
            for trigger in device_triggers:
                # Get the sensor value that this trigger is monitoring
                sensor_value = sensor_data.get(trigger.get("sensor_type"))
                
                if sensor_value is not None:
                    # Evaluate the condition
                    if self._evaluate_condition_sync(trigger, float(sensor_value)):
                        # Get target device type from database
                        device = self.sync_db.device_status.find_one({"id": trigger.get("target_device_id")})
                        if device:
                            # Execute the action
                            self._execute_action_sync(trigger, device.get("type"))

        except Exception as e:
            logger.error(f"Error processing triggers synchronously: {e}")

    def _evaluate_condition_sync(self, trigger: Dict[str, Any], sensor_value: float) -> bool:
        """Evaluate if the sensor value matches the trigger condition synchronously"""
        condition = trigger.get("condition")
        threshold = trigger.get("threshold")
        
        if condition == "greater_than":
            return sensor_value > threshold
        elif condition == "less_than":
            return sensor_value < threshold
        elif condition == "equals":
            return abs(sensor_value - threshold) < 0.001
        return False

    def _execute_action_sync(self, trigger: Dict[str, Any], device_type: str):
        """Execute the trigger action synchronously"""
        try:
            device_id = trigger.get("target_device_id")
            action = trigger.get("action")
            display_text = trigger.get("display_text")
            
            # Convert device_type to lowercase for case-insensitive comparison
            device_type_lower = device_type.lower()
            
            logger.info(f"Processing action: {action} for device type: {device_type} (normalized: {device_type_lower})")
            
            # Prepare the state update based on device type and action
            status_update = {
                "id": device_id,
                "timestamp": datetime.datetime.utcnow()
            }
            
            # Initialize state payload
            state_payload = None
            
            # Set appropriate state values based on device type and action
            if device_type_lower == "fan":
                if action in ["turn_on", "turn_off"]:
                    power_state = "on" if action == "turn_on" else "off"
                    status_update["power"] = power_state
                    state_payload = {"power": power_state}
                elif action == "set_speed":
                    speed = int(trigger.get("threshold"))
                    status_update["speed"] = speed
                    state_payload = {"speed": speed}

            elif device_type_lower == "ac":
                if action in ["turn_on", "turn_off"]:
                    power_state = "on" if action == "turn_on" else "off"
                    status_update["power"] = power_state
                    state_payload = {"power": power_state}
                elif action == "set_temperature":
                    temperature = int(trigger.get("threshold"))
                    status_update["temperature"] = temperature
                    state_payload = {"temperature": temperature}

            elif device_type_lower == "light":
                if action in ["turn_on", "turn_off"]:
                    power_state = "on" if action == "turn_on" else "off"
                    status_update["power"] = power_state
                    state_payload = {"power": power_state}
                elif action == "set_brightness":
                    brightness = int(trigger.get("threshold"))
                    status_update["brightness"] = brightness
                    state_payload = {"brightness": brightness}

            elif device_type_lower == "speaker":
                if action in ["turn_on", "turn_off"]:
                    power_state = "on" if action == "turn_on" else "off"
                    status_update["power"] = power_state
                    state_payload = {"power": power_state}
                elif action == "set_volume":
                    volume = int(trigger.get("threshold"))
                    status_update["volume"] = volume
                    state_payload = {"volume": volume}

            elif device_type_lower == "door":
                if action == "lock":
                    status_update.update({
                        "isLocked": True,
                        "lock_action": "lock",
                        "lock_state": "locked"
                    })
                    state_payload = {
                        "isLocked": True,
                        "lock_action": "lock",
                        "lock_state": "locked"
                    }
                elif action == "unlock":
                    status_update.update({
                        "isLocked": False,
                        "lock_action": "unlock",
                        "lock_state": "unlocked"
                    })
                    state_payload = {
                        "isLocked": False,
                        "lock_action": "unlock",
                        "lock_state": "unlocked"
                    }

            elif device_type_lower == "lcd":
               
                display_text = trigger.get("display_text", "")
                # Ensure text is not longer than 16 characters
                display_text = display_text[:16]
                
                status_update.update({
                    "display_text": display_text,
                    "last_updated": datetime.datetime.utcnow().isoformat()
                })
                state_payload = {
                    "display_text": display_text
                }
            
            if state_payload is None:
                logger.error(f"No valid state payload generated for action: {action} on device type: {device_type} (normalized: {device_type_lower})")
                return

            logger.info(f"Generated state payload: {state_payload}")
            logger.info(f"Status update: {status_update}")

            # Update device status in database
            self.sync_db.device_status.update_one(
                {"id": device_id},
                {"$set": status_update},
                upsert=True
            )

            # Publish message synchronously with state payload
            result = self.mqtt_client.publish(f"iot/devices/{device_id}", json.dumps(state_payload))
            logger.info(f"Published MQTT message with payload: {state_payload}")

            if result.rc == 0:
                # Create device log entry
                log_entry = {
                    "device_id": device_id,
                    "timestamp": datetime.datetime.utcnow(),
                    "action": action,
                    "details": {
                        "state_update": status_update,
                        "triggered_by": {
                            "trigger_id": trigger.get("id"),
                            "sensor_device_id": trigger.get("sensor_device_id"),
                            "sensor_type": trigger.get("sensor_type"),
                            "condition": trigger.get("condition"),
                            "threshold": trigger.get("threshold")
                        }
                    },
                    "triggeredBy": "Trigger"  # Hardcoded as requested
                }
                self.sync_db.device_logs.insert_one(log_entry)
                print("log_entry", log_entry)
                logger.info(f"Created device log for action {action} on device {device_id}")
                logger.info(f"Trigger {trigger.get('id')} executed: {trigger.get('sensor_type')} {trigger.get('condition')} {trigger.get('threshold')}")
            else:
                logger.error(f"Failed to execute action {action} on device {device_id}")

        except Exception as e:
            logger.error(f"Error executing action synchronously: {e}")

    def on_message(self, client, userdata, msg):
        """Handle incoming MQTT messages"""
        try:
            # Parse the payload
            payload = msg.payload.decode()
            logger.info(f"Received message: {payload}")
            data = json.loads(payload)
            
            # Process data synchronously
            self.process_sensor_data_sync(data)
            
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON: {e}")
        except Exception as e:
            logger.error(f"Error processing message: {e}")

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