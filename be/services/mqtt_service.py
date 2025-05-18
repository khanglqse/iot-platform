import os
import json
import paho.mqtt.client as mqtt
from typing import Any, Dict
from database import db
import datetime

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
        self.mqtt_broker = os.getenv("MQTT_BROKER", "localhost")
        self.mqtt_port = int(os.getenv("MQTT_PORT", 1883))
        
        # Set up callbacks
        self.mqtt_client.on_connect = self.on_connect
        self.mqtt_client.on_message = self.on_message
        
        # Add specific topic handlers
        self.mqtt_client.message_callback_add("iot/sensors/#", self.on_sensor_message)
        self.mqtt_client.message_callback_add("iot/environment/#", self.on_sensor_message)
        self.mqtt_client.message_callback_add("iot/plants/#", self.on_sensor_message)
        
        # Connect to broker
        self.mqtt_client.connect(self.mqtt_broker, self.mqtt_port, 60)
        self.mqtt_client.loop_start()
        
        self._initialized = True

    def on_connect(self, client, userdata, flags, rc):
        print(f"Connected to MQTT broker with result code {rc}")
        # Subscribe to all relevant topics
        client.subscribe("iot/devices/#")
        client.subscribe("iot/sensors/#")
        client.subscribe("iot/environment/#")
        client.subscribe("iot/plants/#")

    def on_message(self, client, userdata, msg):
        print(f"Received message on topic {msg.topic}: {msg.payload.decode()}")

    async def on_sensor_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
            topic_parts = msg.topic.split('/')
            
            if topic_parts[1] == 'sensors':
                # Individual sensor readings
                await db.sensor_readings.insert_one(payload)
            elif topic_parts[1] == 'environment':
                # Room environment data
                await db.room_environment.insert_one(payload)
            elif topic_parts[1] == 'plants':
                # Plant monitoring data
                await db.plant_data.insert_one(payload)
                
                # Check if plant needs watering
                if payload.get('soil_moisture', 100) < 30:  # 30% threshold
                    alert = {
                        "type": "plant_watering",
                        "plant_id": payload["plant_id"],
                        "soil_moisture": payload["soil_moisture"],
                        "timestamp": datetime.datetime.now()
                    }
                    await db.alerts.insert_one(alert)
                    
        except Exception as e:
            print(f"Error processing sensor message: {e}")

    async def publish_message(self, topic: str, payload: Dict[str, Any]):
        """Publish a message to an MQTT topic"""
        try:
            message = json.dumps(payload)
            result = self.mqtt_client.publish(topic, message)
            if result.rc != 0:
                print(f"Error publishing message to {topic}: {result.rc}")
            return result.rc == 0
        except Exception as e:
            print(f"Error publishing message: {e}")
            return False

    def cleanup(self):
        """Clean up MQTT client resources"""
        self.mqtt_client.loop_stop()
        self.mqtt_client.disconnect() 