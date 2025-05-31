# gateway_aggregator.py

import paho.mqtt.client as mqtt
from kafka import KafkaProducer
import json
from datetime import datetime
from collections import defaultdict
import os

# Constants
KAFKA_TOPIC = 'sensor.grouped'
KAFKA_SERVER = os.environ.get('KAFKA_SERVER', 'localhost:9092')
MQTT_BROKER = os.environ.get('MQTT_BROKER', 'localhost')
MQTT_PORT = int(os.environ.get('MQTT_PORT', 1883))

# Sensor state
cache = defaultdict(dict)
REQUIRED_TYPES = ['displacement', 'tilt', 'vibration', 'pore_pressure', 'crack_width']
message_count = 0  # Counter for received messages

producer = KafkaProducer(bootstrap_servers=KAFKA_SERVER,
                         value_serializer=lambda v: json.dumps(v).encode())

def on_message(client, userdata, msg):
    global message_count
    try:
        message_count += 1
        print(f"📥 Received MQTT message on topic: {msg.topic}")
        _, location, sensor_type = msg.topic.split('/')
        data = json.loads(msg.payload)
        sensor_id = data['sensorId']
        value = data['value']
        timestamp = data['timestamp']

        print(f"📊 Processing data - Location: {location}, Type: {sensor_type}, Value: {value}")

        key = f"{location}:{timestamp}"
        cache[key][sensor_type] = value
        cache[key]['timestamp'] = timestamp
        cache[key]['location'] = location

        print(f"📦 Cache state for {key}: {cache[key]}")

        if all(t in cache[key] for t in REQUIRED_TYPES):
            grouped = {
                "location": location,
                "timestamp": timestamp,
                "sensors": {t: cache[key][t] for t in REQUIRED_TYPES}
            }
            print(f"📤 Sending to Kafka: {grouped}")
            producer.send(KAFKA_TOPIC, grouped)
            print(f"✅ Sent to Kafka: {location} @ {timestamp} (Total messages received: {message_count})")
            del cache[key]
        else:
            print(f"⏳ Waiting for more sensor data for {key}")
    except Exception as e:
        print(f"❌ Error processing message: {e}")
        print(f"Message content: {msg.payload}")

client = mqtt.Client()
client.on_message = on_message
client.connect(MQTT_BROKER, MQTT_PORT)
client.subscribe("dam/+/+")

print(f"🚀 Gateway Aggregator started...")
print(f"📡 Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
print(f"📡 Connected to Kafka at {KAFKA_SERVER}")
client.loop_forever()
