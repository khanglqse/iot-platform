import paho.mqtt.client as mqtt
import json
import random
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

def publish_single_message(client, topic, payload):
    client.publish(topic, json.dumps(payload))

def publish_all_parallel(client, data, max_workers=10):
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(publish_single_message, client, topic, payload) for topic, payload in data]
        for i, future in enumerate(as_completed(futures), 1):
            if i % 10000 == 0:
                print(f"📦 Sent {i:,} messages")

# CONFIG
MQTT_BROKER = "34.126.118.248"
MQTT_PORT = 1883
MQTT_TOPIC_PREFIX = "dam"

# SENSOR CONFIG
SENSOR_TYPES = {
    "displacement": (10.0, 30.0),
    "tilt": (0.0, 5.0),
    "vibration": (0.0, 0.7),
    "pore_pressure": (100, 170),
    "crack_width": (0.5, 2.5),
}
LOCATIONS = ["center", "left_wall", "right_wall", "base"]
SENSORS_PER_TYPE = 2

# TIME CONFIG
MIN_INTERVAL_MINUTES = 10
DAYS = 1

def generate_sensor_id(sensor_type, location, index):
    return f"{sensor_type[:3]}-{location[:3]}-{index+1:02}"

def calculate_total_records():
    total_timepoints = int((24 * 60 / MIN_INTERVAL_MINUTES) * DAYS)
    num_sensors = len(SENSOR_TYPES) * len(LOCATIONS) * SENSORS_PER_TYPE
    return total_timepoints * num_sensors

def generate_all_data():
    data = []
    start_time = datetime.utcnow() - timedelta(days=DAYS)
    time_points = int((24 * 60 / MIN_INTERVAL_MINUTES) * DAYS)

    for i in range(time_points):
        current_time = start_time + timedelta(minutes=i * MIN_INTERVAL_MINUTES)
        timestamp = current_time.isoformat() + "Z"
        for location in LOCATIONS:
            for sensor_type, (min_val, max_val) in SENSOR_TYPES.items():
                for i in range(SENSORS_PER_TYPE):
                    sensor_id = generate_sensor_id(sensor_type, location, i)
                    value = round(random.uniform(min_val, max_val), 2)
                    topic = f"{MQTT_TOPIC_PREFIX}/{location}/{sensor_type}"
                    payload = {
                        "sensorId": sensor_id,
                        "value": value,
                        "timestamp": timestamp
                    }
                    data.append((topic, payload))
    return data

def publish_all(client, data):
    for topic, payload in data:
        client.publish(topic, json.dumps(payload))

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ MQTT connected successfully")
    else:
        print(f"❌ MQTT connection failed with code {rc}")

def main():
    print("🚀 Starting real-time sensor data simulation...")

    client = mqtt.Client()
    client.on_connect = on_connect  # Gắn callback kết nối

    try:
        client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        client.loop_start()

        # Đợi một chút để đảm bảo callback `on_connect` được gọi
        time.sleep(2)

        previous_values = {}

        while True:
            current_time = datetime.utcnow()
            timestamp = current_time.isoformat() + "Z"

            for location in LOCATIONS:
                for sensor_type, (min_val, max_val) in SENSOR_TYPES.items():
                    for i in range(SENSORS_PER_TYPE):
                        sensor_id = generate_sensor_id(sensor_type, location, i)
                        topic = f"{MQTT_TOPIC_PREFIX}/{location}/{sensor_type}"

                        prev = previous_values.get(sensor_id)
                        if prev is not None:
                            delta = prev * 0.10
                            new_min = max(min_val, prev - delta)
                            new_max = min(max_val, prev + delta)
                            value = round(random.uniform(new_min, new_max), 2)
                        else:
                            value = round(random.uniform(min_val, max_val), 2)

                        previous_values[sensor_id] = value

                        payload = {
                            "sensorId": sensor_id,
                            "value": value,
                            "timestamp": timestamp
                        }

                        info = client.publish(topic, json.dumps(payload))
                        if info.rc != 0:
                            print(f"⚠️ Publish failed for topic {topic}")

            print(f"📦 Sent data batch at {timestamp}")
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n🛑 Stopping sensor simulation...")
    except Exception as e:
        print(f"💥 Error: {e}")
    finally:
        client.loop_stop()
        client.disconnect()



if __name__ == "__main__":
    main()
