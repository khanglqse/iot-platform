# gateway_aggregator.py

import paho.mqtt.client as mqtt
from kafka import KafkaProducer
from kafka.errors import KafkaError
import json
from datetime import datetime
from collections import defaultdict
import os
import time

# Constants
KAFKA_TOPIC = 'sensor.grouped'
KAFKA_SERVER = os.getenv('KAFKA_SERVER', 'localhost:9092')
MQTT_BROKER = os.getenv('MQTT_BROKER', '34.126.118.248
MQTT_PORT = int(os.getenv('MQTT_PORT', 1883))

# Sensor state
cache = defaultdict(dict)
REQUIRED_TYPES = ['displacement', 'tilt', 'vibration', 'pore_pressure', 'crack_width']
message_count = 0

def check_kafka_connection():
    try:
        producer = KafkaProducer(
            bootstrap_servers=KAFKA_SERVER,
            value_serializer=lambda v: json.dumps(v).encode()
        )
        test_msg = {
            "test": True,
            "timestamp": time.time()
        }
        future = producer.send(KAFKA_TOPIC, test_msg)
        result = future.get(timeout=5)
        print("✅ Kafka connected successfully and test message sent.")
        return producer
    except KafkaError as e:
        print(f"❌ Kafka connection failed: {e}")
        return None

# This will be initialized after checking Kafka
producer = None

def on_message(client, userdata, msg):
    global message_count, producer
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

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ MQTT connected successfully")
        client.subscribe("dam/+/+")
    else:
        print(f"❌ MQTT connection failed with code {rc}")

def main():
    global producer
    print("🚀 Gateway Aggregator starting...")

    # Check Kafka first
    producer = check_kafka_connection()
    if not producer:
        print("💥 Exiting due to Kafka connection failure.")
        return

    # Then connect MQTT
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(MQTT_BROKER, MQTT_PORT)
        print(f"📡 Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
        print(f"📡 Connected to Kafka at {KAFKA_SERVER}")
        client.loop_forever()
    except Exception as e:
        print(f"💥 MQTT connection failed: {e}")

if __name__ == "__main__":
    main()
