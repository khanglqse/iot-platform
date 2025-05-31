from kafka import KafkaConsumer, KafkaProducer
import json
import os
import asyncio
import websockets
from datetime import datetime, timedelta
from pymongo import MongoClient
from dateutil import parser
# Kafka Config
KAFKA_BROKER = os.environ.get('KAFKA_BROKER', 'localhost:9092')
GROUP_ID = os.environ.get("GROUP_ID", "processor-group-1")
TOPIC_IN = 'sensor.grouped'
TOPIC_ALERTS = 'sensor.alerts'

# WebSocket Config
WS_HOST = '0.0.0.0'
WS_PORT = 8765

# MongoDB Config
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = "iot_db"
MONGO_ALERTS_COLLECTION = "alerts"

# Thresholds and rules
ABSOLUTE_THRESHOLDS = {
    "displacement": 29.0,
    "tilt": 4.7,
    "vibration": 0.6,
    "pore_pressure": 168,
    "crack_width": 2.3
}

CHANGE_RULES = {
    "displacement": {"percent": 0.10, "minutes": 10},
    "tilt": {"delta": 0.5, "minutes": 10},
    "vibration": {"multiplier": 2, "minutes": 5},
    "pore_pressure": {"delta": 10, "minutes": 10},
    "crack_width": {"delta": 0.2, "minutes": 10}
}

# Store connected WebSocket clients
connected_clients = set()
sensor_history = {}  # {(location, sensor_type): (timestamp, value)}

# MongoDB client
mongo_client = MongoClient(MONGO_URI)
mongo_db = mongo_client[MONGO_DB]
alerts_collection = mongo_db[MONGO_ALERTS_COLLECTION]

async def register(websocket):
    print(f"🔌 New WebSocket client connected")
    connected_clients.add(websocket)
    try:
        await websocket.send(json.dumps({
            "type": "connection_status",
            "status": "connected",
            "message": "Connected to WebSocket server"
        }))
        await websocket.wait_closed()
    finally:
        print(f"🔌 WebSocket client disconnected")
        connected_clients.remove(websocket)

async def broadcast(data):
    if connected_clients:
        message = json.dumps(data)
        for client in list(connected_clients):
            try:
                await client.send(message)
            except:
                connected_clients.remove(client)

def check_alert(sensor_type, current_value, previous_value, previous_time, current_time):
    reason = None
    status = None
    rule = CHANGE_RULES.get(sensor_type)

    time_diff = (current_time - previous_time).total_seconds() / 60

    # CRITICAL nếu vượt ngưỡng tuyệt đối
    if current_value >= ABSOLUTE_THRESHOLDS[sensor_type]:
        status = "CRITICAL"
        reason = f"{sensor_type} value {current_value} exceeded threshold {ABSOLUTE_THRESHOLDS[sensor_type]}"
    # Nếu không vượt ngưỡng tuyệt đối, kiểm tra thay đổi bất thường để gửi cảnh báo WARNING
    elif sensor_type == "displacement" and previous_value and time_diff <= rule["minutes"]:
        percent_change = (current_value - previous_value) / previous_value
        if percent_change >= rule["percent"]:
            status = "WARNING"
            reason = f"{sensor_type} increased more than {rule['percent']*100:.0f}% in {rule['minutes']} minutes"
    elif sensor_type == "tilt" and previous_value and time_diff <= rule["minutes"]:
        delta = current_value - previous_value
        if delta >= rule["delta"]:
            status = "WARNING"
            reason = f"{sensor_type} increased more than {rule['delta']}° in {rule['minutes']} minutes"
    elif sensor_type == "vibration" and previous_value and time_diff <= rule["minutes"]:
        if current_value >= rule["multiplier"] * previous_value:
            status = "WARNING"
            reason = f"{sensor_type} doubled in {rule['minutes']} minutes"
    elif sensor_type == "pore_pressure" and previous_value and time_diff <= rule["minutes"]:
        delta = current_value - previous_value
        if delta >= rule["delta"]:
            status = "WARNING"
            reason = f"{sensor_type} increased more than {rule['delta']} kPa in {rule['minutes']} minutes"
    elif sensor_type == "crack_width" and previous_value and time_diff <= rule["minutes"]:
        delta = current_value - previous_value
        if delta >= rule["delta"]:
            status = "WARNING"
            reason = f"{sensor_type} increased more than {rule['delta']} mm in {rule['minutes']} minutes"

    return status, reason


async def process_kafka_messages():
    print(f"📡 Connecting to Kafka at {KAFKA_BROKER}")
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

    while True:
        msg = await asyncio.to_thread(consumer.poll, timeout_ms=1000)
        if msg:
            for _, messages in msg.items():
                for message in messages:
                    try:
                        data = message.value
                        location = data['location']
                        timestamp = datetime.fromisoformat(data['timestamp'].replace("Z", "+00:00"))
                        sensors = data['sensors']
                        alerts = []

                        for sensor_type, value in sensors.items():
                            key = (location, sensor_type)
                            prev = sensor_history.get(key)

                            reason = None
                            if prev:
                                prev_time, prev_value = prev
                                status, reason = check_alert(sensor_type, value, prev_value, prev_time, timestamp)
                            else:
                                # No history, check absolute threshold
                                if value >= ABSOLUTE_THRESHOLDS[sensor_type]:
                                    reason = f"{sensor_type} value {value} exceeded threshold {ABSOLUTE_THRESHOLDS[sensor_type]}"

                            if reason:
                                alert = {
                                    "location": location,
                                    "sensor_type": sensor_type,
                                    "value": value,
                                    "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                                    "status": status,
                                    "message": reason
                                }
                                alerts.append(alert)

                                # Send to Kafka alerts topic
                                producer.send(TOPIC_ALERTS, alert)

                                # Save to MongoDB
                                alerts_collection.insert_one(alert)

                            # Update history
                            sensor_history[key] = (timestamp, value)

                        # Broadcast to WebSocket clients
                        payload ={
                            "type": "sensor_data",
                            "data": data,
                            "alerts": alerts
                        }
                        print(f"🔔 Broadcasting to {len(connected_clients)} clients")
                        await broadcast(payload)

                    except Exception as e:
                        print(f"❌ Error processing message: {e}")

async def main():
    await asyncio.gather(
        websocket_server(),
        process_kafka_messages()
    )

async def websocket_server():
    print(f"🌐 Starting WebSocket server on {WS_HOST}:{WS_PORT}")
    async with websockets.serve(register, WS_HOST, WS_PORT):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
