from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Connect to MongoDB
client = MongoClient(os.getenv('MONGODB_URL', 'mongodb://localhost:27017'))
db = client['iot_db']
devices_collection = db['device_status']

# Mock devices data
mock_devices = [
    {
        'id': '1',
        'name': 'Điều hòa phòng khách',
        'type': 'AC',
        'status': 'online',
        'location': 'Phòng khách',
        'lastSeen': datetime.now().isoformat(),
        'temperature': 25,
        'mode': 'cool',
        'fanSpeed': 'auto',
        'isOn': True
    },
    {
        'id': '2',
        'name': 'Đèn phòng ngủ',
        'type': 'LIGHT',
        'status': 'online',
        'location': 'Phòng ngủ',
        'lastSeen': datetime.now().isoformat(),
        'brightness': 80,
        'color': '#ffffff',
        'isOn': True
    },
    {
        'id': '3',
        'name': 'Cửa chính',
        'type': 'DOOR',
        'status': 'online',
        'location': 'Cửa ra vào',
        'lastSeen': datetime.now().isoformat(),
        'isLocked': True,
        'autoLock': True,
        'isOn': True
    },
    {
        'id': '4',
        'name': 'Loa phòng khách',
        'type': 'SPEAKER',
        'status': 'online',
        'location': 'Phòng khách',
        'lastSeen': datetime.now().isoformat(),
        'volume': 50,
        'isPlaying': False,
        'currentTrack': 'Chưa phát nhạc',
        'isOn': True
    },
    {
        'id': '5',
        'name': 'Điều hòa phòng ngủ',
        'type': 'AC',
        'status': 'offline',
        'location': 'Phòng ngủ',
        'lastSeen': datetime.fromtimestamp(datetime.now().timestamp() - 3600).isoformat(),
        'temperature': 26,
        'mode': 'heat',
        'fanSpeed': 2,
        'isOn': False
    },
    {
        'id': '6',
        'name': 'Đèn ban công',
        'type': 'LIGHT',
        'status': 'online',
        'location': 'Ban công',
        'lastSeen': datetime.now().isoformat(),
        'brightness': 100,
        'color': '#ffeb3b',
        'isOn': True
    },
    {
        'id': '7',
        'name': 'Cửa sau',
        'type': 'DOOR',
        'status': 'online',
        'location': 'Cửa sau',
        'lastSeen': datetime.now().isoformat(),
        'isLocked': False,
        'autoLock': False,
        'isOn': True
    },
    {
        'id': '8',
        'name': 'Loa phòng ngủ',
        'type': 'SPEAKER',
        'status': 'offline',
        'location': 'Phòng ngủ',
        'lastSeen': datetime.fromtimestamp(datetime.now().timestamp() - 7200).isoformat(),
        'volume': 30,
        'isPlaying': False,
        'isOn': False
    },
    {
        'id': '9',
        'name': 'Quạt trần phòng khách',
        'type': 'FAN',
        'status': 'online',
        'location': 'Phòng khách',
        'lastSeen': datetime.now().isoformat(),
        'speed': 'auto',
        'mode': 'normal',
        'isOn': True
    },
    {
        'id': '10',
        'name': 'Quạt đứng phòng ngủ',
        'type': 'FAN',
        'status': 'online',
        'location': 'Phòng ngủ',
        'lastSeen': datetime.now().isoformat(),
        'speed': 2,
        'mode': 'sleep',
        'isOn': True
    }
]

def init_db():
    # Clear existing data
    devices_collection.delete_many({})
    
    # Insert mock data
    result = devices_collection.insert_many(mock_devices)
    print(f"Inserted {len(result.inserted_ids)} devices into MongoDB")

if __name__ == "__main__":
    init_db() 