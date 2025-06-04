import os
import json
import time
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class MQTTListener:
    def __init__(self):
        self.mqtt_client = mqtt.Client(os.getenv("MQTT_CLIENT_ID", "raspberry_pi_listener"))
        self.mqtt_client.on_connect = self.on_connect
        self.mqtt_client.on_message = self.on_message
        
        # Connect to MQTT broker
        self.mqtt_client.connect(
            os.getenv("MQTT_BROKER", "34.126.118.248"),
            int(os.getenv("MQTT_PORT", 1883)),
            60
        )
        
        # Start MQTT loop
        self.mqtt_client.loop_start()

    def on_connect(self, client, userdata, flags, rc):
        print(f"Connected to MQTT broker with result code {rc}")
        # Subscribe to all device topics
        client.subscribe("iot/devices/#")

    def on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode('utf-8'))
            print(f"\nReceived message on topic {msg.topic}:")
            print(f"Payload: {json.dumps(payload, indent=2)}")
        except Exception as e:
            print(f"Error processing message: {e}")

    def cleanup(self):
        self.mqtt_client.loop_stop()
        self.mqtt_client.disconnect()

if __name__ == "__main__":
    try:
        listener = MQTTListener()
        print("MQTT listener started. Press Ctrl+C to exit.")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
        listener.cleanup() 