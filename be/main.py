from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import pymongo
import paho.mqtt.client as mqtt
import os
import speech_recognition as sr
from dotenv import load_dotenv
import json
import requests
import asyncio
import aiohttp
import datetime
from models import Fan, AirConditioner, Speaker, Light, Door, DeviceStatus
from typing import List, Dict, Any
from rasa_service import analyze_text_with_rasa, extract_device_command

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()

# MongoDB connection
mongo_client = pymongo.MongoClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
db = mongo_client.iot_db

# MQTT setup
mqtt_client = mqtt.Client()
mqtt_broker = os.getenv("MQTT_BROKER", "localhost")
mqtt_port = int(os.getenv("MQTT_PORT", 1883))

# Rasa setup
RASA_URL = os.getenv("RASA_URL", "http://rasa:5005")

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe("iot/devices/#")

def on_message(client, userdata, msg):
    print(f"Received message on topic {msg.topic}: {msg.payload.decode()}")

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.connect(mqtt_broker, mqtt_port, 60)
mqtt_client.loop_start()

async def process_rasa_message(message: str):
    """Gửi tin nhắn đến Rasa và xử lý phản hồi"""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{RASA_URL}/webhooks/rest/webhook",
            json={"message": message}
        ) as response:
            if response.status == 200:
                rasa_response = await response.json()
                return rasa_response
            else:
                raise HTTPException(status_code=500, detail="Error communicating with Rasa")

async def execute_device_action(device_id: str, action: str, value: Any = None):
    """Thực thi hành động điều khiển thiết bị"""
    topic = f"iot/devices/{device_id}"
    if value is not None:
        message = json.dumps({"action": action, "value": value})
    else:
        message = json.dumps({"action": action})
    
    mqtt_client.publish(topic, message)
    
    # Lưu trạng thái vào MongoDB
    device_status = {
        "id": device_id,
        "action": action,
        "value": value,
        "timestamp": datetime.datetime.now()
    }
    db.device_status.insert_one(device_status)

# Fan endpoints
@app.post("/devices/fan", response_model=Fan)
async def create_fan(fan: Fan):
    result = db.devices.insert_one(fan.dict())
    return {**fan.dict(), "id": str(result.inserted_id)}

@app.put("/devices/fan/{device_id}/speed")
async def set_fan_speed(device_id: str, speed: int):
    if not 0 <= speed <= 3:
        raise HTTPException(status_code=400, detail="Speed must be between 0 and 3")
    
    status_update = {
        "id": device_id,
        "timestamp": datetime.datetime.now(),
        "speed": speed
    }
    db.device_status.insert_one(status_update)
    return status_update

@app.put("/devices/fan/{device_id}/mode")
async def set_fan_mode(device_id: str, mode: str):
    if mode not in ["normal", "sleep", "turbo"]:
        raise HTTPException(status_code=400, detail="Invalid mode")
    
    status_update = {
        "id": device_id,
        "timestamp": datetime.datetime.now(),
        "mode": mode
    }
    db.device_status.insert_one(status_update)
    return status_update

# Air Conditioner endpoints
@app.post("/devices/ac", response_model=AirConditioner)
async def create_ac(ac: AirConditioner):
    result = db.devices.insert_one(ac.dict())
    return {**ac.dict(), "id": str(result.inserted_id)}

@app.put("/devices/ac/{device_id}/temperature")
async def set_ac_temperature(device_id: str, temperature: int):
    if not 16 <= temperature <= 30:
        raise HTTPException(status_code=400, detail="Temperature must be between 16 and 30")
    
    status_update = {
        "id": device_id,
        "timestamp": datetime.datetime.now(),
        "temperature": temperature
    }
    db.device_status.insert_one(status_update)
    return status_update

@app.put("/devices/ac/{device_id}/mode")
async def set_ac_mode(device_id: str, mode: str):
    if mode not in ["cool", "heat", "fan", "dry"]:
        raise HTTPException(status_code=400, detail="Invalid mode")
    
    status_update = {
        "id": device_id,
        "timestamp": datetime.datetime.now(),
        "mode": mode
    }
    db.device_status.insert_one(status_update)
    return status_update

# Speaker endpoints
@app.post("/devices/speaker", response_model=Speaker)
async def create_speaker(speaker: Speaker):
    result = db.devices.insert_one(speaker.dict())
    return {**speaker.dict(), "id": str(result.inserted_id)}

@app.put("/devices/speaker/{device_id}/volume")
async def set_speaker_volume(device_id: str, volume: int):
    if not 0 <= volume <= 100:
        raise HTTPException(status_code=400, detail="Volume must be between 0 and 100")
    
    status_update = {
        "id": device_id,
        "timestamp": datetime.datetime.now(),
        "volume": volume
    }
    db.device_status.insert_one(status_update)
    return status_update

@app.put("/devices/speaker/{device_id}/play")
async def control_speaker_playback(device_id: str, action: str):
    if action not in ["play", "pause", "next", "previous"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    status_update = {
        "id": device_id,
        "timestamp": datetime.datetime.now(),
        "playback_action": action
    }
    db.device_status.insert_one(status_update)
    return status_update

# Light endpoints
@app.post("/devices/light", response_model=Light)
async def create_light(light: Light):
    result = db.devices.insert_one(light.dict())
    return {**light.dict(), "id": str(result.inserted_id)}

@app.put("/devices/light/{device_id}/brightness")
async def set_light_brightness(device_id: str, brightness: int):
    if not 0 <= brightness <= 100:
        raise HTTPException(status_code=400, detail="Brightness must be between 0 and 100")
    
    status_update = {
        "id": device_id,
        "timestamp": datetime.datetime.now(),
        "brightness": brightness
    }
    db.device_status.insert_one(status_update)
    return status_update

@app.put("/devices/light/{device_id}/color")
async def set_light_color(device_id: str, color: str):
    status_update = {
        "id": device_id,
        "timestamp": datetime.datetime.now(),
        "color": color
    }
    db.device_status.insert_one(status_update)
    return status_update

# Door endpoints
@app.post("/devices/door", response_model=Door)
async def create_door(door: Door):
    result = db.devices.insert_one(door.dict())
    return {**door.dict(), "id": str(result.inserted_id)}

@app.put("/devices/door/{device_id}/lock")
async def control_door_lock(device_id: str, action: str):
    if action not in ["lock", "unlock"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    status_update = {
        "id": device_id,
        "timestamp": datetime.datetime.now(),
        "lock_action": action
    }
    db.device_status.insert_one(status_update)
    return status_update

@app.put("/devices/door/{device_id}/auto-lock")
async def set_door_auto_lock(device_id: str, enabled: bool):
    status_update = {
        "id": device_id,
        "timestamp": datetime.datetime.now(),
        "auto_lock": enabled
    }
    db.device_status.insert_one(status_update)
    return status_update

# Common endpoints
@app.get("/devices", response_model=List[Dict[str, Any]])
async def get_all_devices():
    devices = list(db.device_status.find({}, {"_id": 0}))
    return devices

@app.get("/devices/{device_id}/status")
async def get_device_status(device_id: str):
    status = db.device_status.find_one(
        {"id": device_id},
        sort=[("timestamp", -1)],
        projection={"_id": 0}
    )
    return status if status else {"status": "not_found"}

@app.patch("/devices/{device_id}/status")
async def update_device_status(device_id: str, updates: dict):
    # Create timestamp
    current_time = datetime.datetime.utcnow()
    
    # Create status update
    status_update = {
        "id": device_id,
        "timestamp": current_time,
        **updates
    }
    
    # Update existing record in device_status collection
    db.device_status.update_one(
        {"id": device_id},
        {"$set": status_update},
        upsert=True
    )
    
    # Create and insert log entry
    log_entry = {
        "device_id": device_id,
        "timestamp": current_time,
        "action": "status_update",
        "details": updates
    }
    db.device_logs.insert_one(log_entry)
    
    # Update device details if needed
    if "name" in updates or "location" in updates:
        db.devices.update_one(
            {"id": device_id},
            {"$set": updates}
        )
    
    # Send MQTT message to control device
    topic = f"iot/devices/{device_id}"
    message = json.dumps(updates)
    mqtt_client.publish(topic, message)
    
    return status_update

@app.get("/devices/{device_id}")
async def get_device_details(device_id: str):
    device = db.devices.find_one(
        {"id": device_id},
        projection={"_id": 0}
    )
    return device if device else {"status": "not_found"}

@app.post("/voice-command")
async def process_voice_command(file: UploadFile = File(...)):
    with open("temp_audio.wav", "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    recognizer = sr.Recognizer()
    
    try:
        with sr.AudioFile("temp_audio.wav") as source:
            audio = recognizer.record(source)
            text = recognizer.recognize_google(audio, language="vi-VN")
            
            rasa_response = await process_rasa_message(text)
            
            if rasa_response:
                for response in rasa_response:
                    if "custom" in response:
                        action = response["custom"].get("action")
                        device = response["custom"].get("device_name")
                        value = response["custom"].get("value")
                        await execute_device_action(device, action, value)
            
            return {
                "status": "success",
                "text": text,
                "rasa_response": rasa_response
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/process-text")
async def process_text(text: str = Body(..., embed=True)):
    """
    Xử lý văn bản từ Frontend, phân tích với Rasa và gửi lệnh qua MQTT
    """
    try:
        # Phân tích văn bản với Rasa
        rasa_analysis = await analyze_text_with_rasa(text)
        
        if rasa_analysis["status"] == "error":
            return rasa_analysis
        
        # Trích xuất lệnh điều khiển thiết bị từ phản hồi của Rasa
        command = extract_device_command(rasa_analysis)
        
        if command["action"] and command["device_name"]:
            # Tìm thiết bị trong database
            device = db.devices.find_one({
                "name": command["device_name"]
            })
            
            if device:
                device_id = device.get("id")
                if not device_id:
                    return {
                        "status": "error",
                        "message": "Device ID not found",
                        "rasa_analysis": rasa_analysis,
                        "command": command
                    }

                # Tạo payload cho MQTT
                payload = {
                    "action": command["action"]
                }
                if command.get("value"):
                    payload["value"] = command["value"]

                # Gửi lệnh qua MQTT
                topic = f"iot/devices/{device_id}"
                mqtt_client.publish(topic, json.dumps(payload))
                
                # Cập nhật trạng thái trong database
                status_update = {
                    "id": device_id,
                    "timestamp": datetime.datetime.utcnow(),
                    **payload
                }
                db.device_status.update_one(
                    {"id": device_id},
                    {"$set": status_update},
                    upsert=True
                )

                # Ghi log
                log_entry = {
                    "device_id": device_id,
                    "timestamp": datetime.datetime.utcnow(),
                    "action": "voice_command",
                    "details": {
                        "text": text,
                        "command": command,
                        "payload": payload
                    }
                }
                db.device_logs.insert_one(log_entry)
                
                return {
                    "status": "success",
                    "rasa_analysis": rasa_analysis,
                    "command": command,
                    "device_id": device_id,
                    "payload": payload
                }
            else:
                return {
                    "status": "error",
                    "message": "Device not found",
                    "rasa_analysis": rasa_analysis,
                    "command": command
                }
        else:
            return {
                "status": "error",
                "message": "No valid command found in text",
                "rasa_analysis": rasa_analysis,
                "command": command
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 