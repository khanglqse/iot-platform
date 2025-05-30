# processor.py

from kafka import KafkaConsumer, KafkaProducer
import json
import os

# Kafka Config
KAFKA_BROKER = 'localhost:9092'
GROUP_ID = os.environ.get("GROUP_ID", "processor-group-1")
TOPIC_IN = 'sensor.grouped'
TOPIC_ALERTS = 'sensor.alerts'

# Cảnh báo ngưỡng
THRESHOLDS = {
    "displacement": 20.0,
    "tilt": 3.0,
    "vibration": 0.5,
    "pore_pressure": 150,
    "crack_width": 2.0
}

consumer = KafkaConsumer(
    TOPIC_IN,
    bootstrap_servers=KAFKA_BROKER,
    group_id=GROUP_ID,
    value_deserializer=lambda m: json.loads(m.decode()),
    enable_auto_commit=True
)

producer = KafkaProducer(
    bootstrap_servers=KAFKA_BROKER,
    value_serializer=lambda v: json.dumps(v).encode()
)

print(f"🚀 Processor started (group: {GROUP_ID})")

for msg in consumer:
    data = msg.value
    location = data['location']
    timestamp = data['timestamp']
    sensors = data['sensors']
    alerts = []

    for key, value in sensors.items():
        if value >= THRESHOLDS[key]:
            alerts.append({
                "location": location,
                "sensor_type": key,
                "value": value,
                "timestamp": timestamp,
                "status": "CRITICAL"
            })

    for alert in alerts:
        print(f"⚠️ ALERT: {alert}")
        producer.send(TOPIC_ALERTS, alert)
