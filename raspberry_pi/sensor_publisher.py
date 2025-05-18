import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime

# MQTT Configuration
MQTT_BROKER = "localhost"  # Change this to your MQTT broker address
MQTT_PORT = 1883
DEVICE_ID = "raspberry_pi_001"
LOCATION = "living_room"

def generate_sensor_data():
    return {
        "device_id": DEVICE_ID,
        "timestamp": datetime.now().isoformat(),
        "temperature": round(random.uniform(20.0, 30.0), 2),
        "humidity": round(random.uniform(40.0, 80.0), 2),
        "light_level": round(random.uniform(0.0, 100.0), 2),
        "soil_moisture": round(random.uniform(0.0, 100.0), 2),
        "location": LOCATION
    }

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")

def main():
    # Create MQTT client
    client = mqtt.Client()
    client.on_connect = on_connect

    # Connect to MQTT broker
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()

        print("Starting to send sensor data...")
        while True:
            # Generate and send sensor data
            data = generate_sensor_data()
            client.publish("sensors/data", json.dumps(data))
            print(f"Sent data: {data}")
            
            # Wait for 2 seconds
            time.sleep(2)

    except KeyboardInterrupt:
        print("Stopping sensor publisher...")
        client.loop_stop()
        client.disconnect()
    except Exception as e:
        print(f"Error: {e}")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main() 