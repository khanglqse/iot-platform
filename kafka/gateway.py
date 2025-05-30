# gateway_aggregator.py

import paho.mqtt.client as mqtt
from kafka import KafkaProducer
import json
from datetime import datetime
from collections import defaultdict

# Constants
KAFKA_TOPIC = 'sensor.grouped'
KAFKA_SERVER = 'localhost:9092'
MQTT_BROKER = 'localhost'
MQTT_PORT = 1883

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
        _, location, sensor_type = msg.topic.split('/')
        data = json.loads(msg.payload)
        sensor_id = data['sensorId']
        value = data['value']
        timestamp = data['timestamp']

        key = f"{location}:{timestamp}"
        cache[key][sensor_type] = value
        cache[key]['timestamp'] = timestamp
        cache[key]['location'] = location

        if all(t in cache[key] for t in REQUIRED_TYPES):
            grouped = {
                "location": location,
                "timestamp": timestamp,
                "sensors": {t: cache[key][t] for t in REQUIRED_TYPES}
            }
            producer.send(KAFKA_TOPIC, grouped)
            print(f"📦 Sent to Kafka: {location} @ {timestamp} (Total messages received: {message_count})")
            del cache[key]
    except Exception as e:
        print(f"❌ Error: {e}")

client = mqtt.Client()
client.on_message = on_message
client.connect(MQTT_BROKER, MQTT_PORT)
client.subscribe("dam/+/+")

print("🚀 Gateway Aggregator started...")
client.loop_forever()
