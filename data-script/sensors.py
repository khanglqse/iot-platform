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
MQTT_BROKER = "localhost"
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

def main():
    start_time_total = time.time()
    
    total_records = calculate_total_records()
    print(f"📊 Total records to generate: {total_records:,}")

    print("🧠 Generating data...")
    gen_start = time.time()
    data = generate_all_data()
    gen_time = time.time() - gen_start
    print(f"⏱️ Data generation took: {gen_time:.2f} seconds")

    print("🚀 Sending all data as fast as possible...")
    send_start = time.time()
    client = mqtt.Client()
    client.connect(MQTT_BROKER, MQTT_PORT)
    client.loop_start()
        
    publish_all_parallel(client, data, max_workers=50)

    client.loop_stop()
    client.disconnect()
    send_time = time.time() - send_start
    print(f"⏱️ Data sending took: {send_time:.2f} seconds")

    total_time = time.time() - start_time_total
    print(f"✅ Done. Total execution time: {total_time:.2f} seconds")
    print(f"📈 Performance metrics:")
    print(f"   - Records per second: {total_records/total_time:.2f}")
    print(f"   - Generation speed: {total_records/gen_time:.2f} records/sec")
    print(f"   - Sending speed: {total_records/send_time:.2f} records/sec")

if __name__ == "__main__":
    main()
