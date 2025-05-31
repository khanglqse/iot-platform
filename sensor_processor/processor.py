from kafka import KafkaConsumer, KafkaProducer
import json
import os
import asyncio
import websockets
from datetime import datetime

# Kafka Config
KAFKA_BROKER = os.environ.get('KAFKA_BROKER', 'localhost:9092')
GROUP_ID = os.environ.get("GROUP_ID", "processor-group-1")
TOPIC_IN = 'sensor.grouped'
TOPIC_ALERTS = 'sensor.alerts'

# WebSocket Config
WS_HOST = '0.0.0.0'  # Allow connections from outside the container
WS_PORT = 8765

# Cảnh báo ngưỡng
THRESHOLDS = {
    "displacement": 29.0,
    "tilt": 4.8,
    "vibration": 0.65,
    "pore_pressure": 168,
    "crack_width": 2.3
}

# Store connected WebSocket clients
connected_clients = set()

async def register(websocket):
    print(f"🔌 New WebSocket client connected")
    connected_clients.add(websocket)
    try:
        # Send a welcome message
        await websocket.send(json.dumps({
            "type": "connection_status",
            "status": "connected",
            "message": "Connected to WebSocket server"
        }))
        await websocket.wait_closed()
    except Exception as e:
        print(f"❌ Error in WebSocket connection: {e}")
    finally:
        print(f"🔌 WebSocket client disconnected")
        connected_clients.remove(websocket)

async def broadcast(data):
    if connected_clients:
        try:
            message = json.dumps(data)
            print(f"📤 Broadcasting to {len(connected_clients)} clients")
            for client in connected_clients:
                try:
                    await client.send(message)
                    print(f"✅ Message sent successfully to client")
                except Exception as e:
                    print(f"❌ Error sending to client: {e}")
                    connected_clients.remove(client)
        except Exception as e:
            print(f"❌ Error in broadcast: {e}")

async def websocket_server():
    try:
        print(f"🌐 Starting WebSocket server on {WS_HOST}:{WS_PORT}")
        async with websockets.serve(register, WS_HOST, WS_PORT):
            print(f"🌐 WebSocket server started at ws://{WS_HOST}:{WS_PORT}")
            await asyncio.Future()  # run forever
    except Exception as e:
        print(f"❌ Error starting WebSocket server: {e}")

async def process_kafka_messages():
    print(f"📡 Connecting to Kafka at {KAFKA_BROKER}")
    
    # Create Kafka consumer and producer
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
    print(f"👂 Listening for messages on topic: {TOPIC_IN}")

    # Poll messages from Kafka in a separate thread to avoid blocking event loop
    while True:
        # Run Kafka consumer polling in a separate thread
        msg = await asyncio.to_thread(consumer.poll, timeout_ms=1000)  # Non-blocking polling

        if msg:
            for partition, messages in msg.items():
                for message in messages:
                    try:
                        data = message.value
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

                        # Broadcast data to all connected WebSocket clients
                        message_to_broadcast = {
                            "type": "sensor_data",
                            "data": data,
                            "alerts": alerts
                        }
                        await broadcast(message_to_broadcast)

                        # Send alerts to Kafka topic
                        for alert in alerts:
                            producer.send(TOPIC_ALERTS, alert)
                    except Exception as e:
                        print(f"❌ Error processing message: {e}")

async def main():
    # Start WebSocket server and Kafka consumer in parallel
    await asyncio.gather(
        websocket_server(),
        process_kafka_messages()
    )

if __name__ == "__main__":
    asyncio.run(main())
