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
        "device_id": device_id,
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

@app.put("/devices/fan/{fan_id}/speed")
async def set_fan_speed(fan_id: str, speed: int):
    if not 0 <= speed <= 3:
        raise HTTPException(status_code=400, detail="Speed must be between 0 and 3")
    await execute_device_action(fan_id, "set_speed", speed)
    return {"status": "success"}

@app.put("/devices/fan/{fan_id}/mode")
async def set_fan_mode(fan_id: str, mode: str):
    if mode not in ["normal", "natural", "sleep"]:
        raise HTTPException(status_code=400, detail="Invalid mode")
    await execute_device_action(fan_id, "set_mode", mode)
    return {"status": "success"}

# Air Conditioner endpoints
@app.post("/devices/ac", response_model=AirConditioner)
async def create_ac(ac: AirConditioner):
    result = db.devices.insert_one(ac.dict())
    return {**ac.dict(), "id": str(result.inserted_id)}

@app.put("/devices/ac/{ac_id}/temperature")
async def set_ac_temperature(ac_id: str, temperature: float):
    if not 16 <= temperature <= 30:
        raise HTTPException(status_code=400, detail="Temperature must be between 16 and 30")
    await execute_device_action(ac_id, "set_temperature", temperature)
    return {"status": "success"}

@app.put("/devices/ac/{ac_id}/mode")
async def set_ac_mode(ac_id: str, mode: str):
    if mode not in ["cool", "heat", "fan", "dry", "auto"]:
        raise HTTPException(status_code=400, detail="Invalid mode")
    await execute_device_action(ac_id, "set_mode", mode)
    return {"status": "success"}

# Speaker endpoints
@app.post("/devices/speaker", response_model=Speaker)
async def create_speaker(speaker: Speaker):
    result = db.devices.insert_one(speaker.dict())
    return {**speaker.dict(), "id": str(result.inserted_id)}

@app.put("/devices/speaker/{speaker_id}/volume")
async def set_speaker_volume(speaker_id: str, volume: int):
    if not 0 <= volume <= 100:
        raise HTTPException(status_code=400, detail="Volume must be between 0 and 100")
    await execute_device_action(speaker_id, "set_volume", volume)
    return {"status": "success"}

@app.put("/devices/speaker/{speaker_id}/play")
async def control_speaker_playback(speaker_id: str, action: str):
    if action not in ["play", "pause", "stop"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    await execute_device_action(speaker_id, action)
    return {"status": "success"}

# Light endpoints
@app.post("/devices/light", response_model=Light)
async def create_light(light: Light):
    result = db.devices.insert_one(light.dict())
    return {**light.dict(), "id": str(result.inserted_id)}

@app.put("/devices/light/{light_id}/brightness")
async def set_light_brightness(light_id: str, brightness: int):
    if not 0 <= brightness <= 100:
        raise HTTPException(status_code=400, detail="Brightness must be between 0 and 100")
    await execute_device_action(light_id, "set_brightness", brightness)
    return {"status": "success"}

@app.put("/devices/light/{light_id}/color")
async def set_light_color(light_id: str, color: str):
    await execute_device_action(light_id, "set_color", color)
    return {"status": "success"}

# Door endpoints
@app.post("/devices/door", response_model=Door)
async def create_door(door: Door):
    result = db.devices.insert_one(door.dict())
    return {**door.dict(), "id": str(result.inserted_id)}

@app.put("/devices/door/{door_id}/lock")
async def control_door_lock(door_id: str, action: str):
    if action not in ["lock", "unlock"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    await execute_device_action(door_id, action)
    return {"status": "success"}

@app.put("/devices/door/{door_id}/auto-lock")
async def set_door_auto_lock(door_id: str, enabled: bool):
    await execute_device_action(door_id, "set_auto_lock", enabled)
    return {"status": "success"}

# Common endpoints
@app.get("/devices", response_model=List[Dict[str, Any]])
async def get_all_devices():
    devices = list(db.devices.find({}, {"_id": 0}))
    return devices

@app.get("/devices/{device_id}/status")
async def get_device_status(device_id: str):
    status = db.device_status.find_one(
        {"device_id": device_id},
        sort=[("timestamp", -1)],
        projection={"_id": 0}
    )
    return status if status else {"status": "not_found"}

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
        
        if command["action"] and command["device"]:
            # Tìm thiết bị trong database
            device = db.devices.find_one({
                "type": command["device"],
                "room": command["room"]
            })
            
            if device:
                # Gửi lệnh qua MQTT
                await execute_device_action(
                    str(device["_id"]),
                    command["action"],
                    command.get("value")
                )
                
                return {
                    "status": "success",
                    "rasa_analysis": rasa_analysis,
                    "command": command,
                    "device_id": str(device["_id"])
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