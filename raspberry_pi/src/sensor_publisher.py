import os
import json
import time
import random
from datetime import datetime
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SensorPublisher:
    def __init__(self):
        self.mqtt_client = mqtt.Client(os.getenv("MQTT_CLIENT_ID", "raspberry_pi_sensor"))
        
        # Connect to MQTT broker
        self.mqtt_client.connect(
            os.getenv("MQTT_BROKER", "localhost"),
            int(os.getenv("MQTT_PORT", 1883)),
            60
        )
        
        # Sensor configurations
        self.sensors = {
            "living_room": {
                "temperature": {"min": 20, "max": 30, "unit": "°C"},
                "humidity": {"min": 40, "max": 70, "unit": "%"},
                "motion": {"min": 0, "max": 1, "unit": "boolean"}
            },
            "bedroom": {
                "temperature": {"min": 18, "max": 28, "unit": "°C"},
                "humidity": {"min": 40, "max": 70, "unit": "%"},
                "motion": {"min": 0, "max": 1, "unit": "boolean"}
            },
            "plant_1": {
                "soil_moisture": {"min": 20, "max": 80, "unit": "%"},
                "temperature": {"min": 15, "max": 35, "unit": "°C"},
                "humidity": {"min": 60, "max": 90, "unit": "%"},
                "light_level": {"min": 0, "max": 100, "unit": "lux"}
            },
            "plant_2": {
                "soil_moisture": {"min": 20, "max": 80, "unit": "%"},
                "temperature": {"min": 15, "max": 35, "unit": "°C"},
                "humidity": {"min": 60, "max": 90, "unit": "%"},
                "light_level": {"min": 0, "max": 100, "unit": "lux"}
            }
        }
        
        # Initialize room occupancy counters
        self.room_occupancy = {
            "living_room": 0,
            "bedroom": 0
        }
        
        # Start MQTT loop
        self.mqtt_client.loop_start()

    def generate_sensor_reading(self, location, sensor_type, config):
        if sensor_type == "motion":
            # Simulate motion detection with 20% probability
            value = 1 if random.random() < 0.2 else 0
            if value == 1:
                # Update room occupancy when motion is detected
                self.update_room_occupancy(location)
        else:
            # Generate random value within configured range
            value = random.uniform(config["min"], config["max"])
            # Add some noise to make it more realistic
            value += random.uniform(-0.5, 0.5)
            # Round to 2 decimal places
            value = round(value, 2)

        return {
            "sensor_id": f"{location}_{sensor_type}",
            "type": sensor_type,
            "value": value,
            "unit": config["unit"],
            "location": location,
            "timestamp": datetime.now().isoformat()
        }

    def update_room_occupancy(self, room):
        # 70% chance someone entered, 30% chance someone left
        if random.random() < 0.7:
            self.room_occupancy[room] = min(self.room_occupancy[room] + 1, 10)
        else:
            self.room_occupancy[room] = max(self.room_occupancy[room] - 1, 0)

    def publish_room_data(self, room):
        # Publish individual sensor readings
        for sensor_type, config in self.sensors[room].items():
            reading = self.generate_sensor_reading(room, sensor_type, config)
            topic = f"iot/sensors/{room}/{sensor_type}"
            self.mqtt_client.publish(topic, json.dumps(reading))

        # Publish room environment data
        room_data = {
            "room_id": room,
            "temperature": float(self.generate_sensor_reading(room, "temperature", self.sensors[room]["temperature"])["value"]),
            "humidity": float(self.generate_sensor_reading(room, "humidity", self.sensors[room]["humidity"])["value"]),
            "occupancy_count": self.room_occupancy[room],
            "last_motion": datetime.now().isoformat() if self.generate_sensor_reading(room, "motion", self.sensors[room]["motion"])["value"] == 1 else None,
            "location": room,
            "timestamp": datetime.now().isoformat()
        }
        self.mqtt_client.publish(f"iot/environment/{room}", json.dumps(room_data))

    def publish_plant_data(self, plant_id):
        plant_data = {
            "plant_id": plant_id,
            "soil_moisture": float(self.generate_sensor_reading(plant_id, "soil_moisture", self.sensors[plant_id]["soil_moisture"])["value"]),
            "temperature": float(self.generate_sensor_reading(plant_id, "temperature", self.sensors[plant_id]["temperature"])["value"]),
            "humidity": float(self.generate_sensor_reading(plant_id, "humidity", self.sensors[plant_id]["humidity"])["value"]),
            "light_level": float(self.generate_sensor_reading(plant_id, "light_level", self.sensors[plant_id]["light_level"])["value"]),
            "last_watered": (datetime.now().isoformat() if random.random() < 0.1 else None),
            "location": plant_id,
            "timestamp": datetime.now().isoformat()
        }
        self.mqtt_client.publish(f"iot/plants/{plant_id}", json.dumps(plant_data))

    def run(self):
        while True:
            try:
                # Publish room environment data
                for room in ["living_room", "bedroom"]:
                    self.publish_room_data(room)

                # Publish plant data
                for plant_id in ["plant_1", "plant_2"]:
                    self.publish_plant_data(plant_id)

                # Wait for next iteration
                time.sleep(30)  # Publish every 30 seconds

            except Exception as e:
                print(f"Error in sensor publisher: {e}")
                time.sleep(5)  # Wait before retrying

    def cleanup(self):
        self.mqtt_client.loop_stop()
        self.mqtt_client.disconnect()

if __name__ == "__main__":
    try:
        publisher = SensorPublisher()
        print("Sensor publisher started. Press Ctrl+C to exit.")
        publisher.run()
    except KeyboardInterrupt:
        print("\nShutting down...")
        publisher.cleanup() 