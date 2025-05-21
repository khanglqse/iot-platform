import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime
from datetime import timedelta

# MQTT Configuration
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MAX_COUNT = 1000

DEVICE_LOCATIONS = [
    {"device_id": "raspberry_pi_001", "location": "living_room"},
    {"device_id": "raspberry_pi_002", "location": "bedroom"},
    {"device_id": "raspberry_pi_003", "location": "kitchen"},
    {"device_id": "raspberry_pi_004", "location": "garage"},
    {"device_id": "raspberry_pi_005", "location": "garden"},
    {"device_id": "raspberry_pi_006", "location": "bathroom"},
    {"device_id": "raspberry_pi_007", "location": "office"},
]

def generate_mock_data(device_id, location):
    # Random timestamp in the last 30 days
    now = datetime.now()
    random_seconds = random.randint(0, 30 * 24 * 60 * 60)
    random_time = now - timedelta(seconds=random_seconds)
    return {
        "device_id": device_id,
        "timestamp": random_time.isoformat(),
        "temperature": round(random.uniform(00.0, 90.0), 2),
        "humidity": round(random.uniform(40.0, 80.0), 2),
        "light_level": round(random.uniform(0.0, 100.0), 2),
        "soil_moisture": round(random.uniform(0.0, 100.0), 2),
        "location": location,
        "battery_level": round(random.uniform(80.0, 100.0), 2),
        "signal_strength": round(random.uniform(-80.0, -40.0), 2)
    }

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")

def main():
    client = mqtt.Client()
    client.on_connect = on_connect

    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()

        print("Starting to send mock sensor data...")
        count = 0
        while count < MAX_COUNT:
            device = random.choice(DEVICE_LOCATIONS)
            data = generate_mock_data(device["device_id"], device["location"])
            client.publish("sensors/data", json.dumps(data))
            count += 1
            print(f"Sent data #{count}: {data}")
            time.sleep(0.002)
        print(f"Finished sending {MAX_COUNT} messages.")

    except KeyboardInterrupt:
        print("Stopping mock sensor...")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
