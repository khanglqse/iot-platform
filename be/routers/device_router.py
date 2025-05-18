from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any
import datetime
from models import Fan, AirConditioner, Speaker, Light, Door
from services.device_service import DeviceService

router = APIRouter(prefix="/devices", tags=["devices"])
device_service = DeviceService()

# Fan endpoints
@router.post("/fan", response_model=Fan)
async def create_fan(fan: Fan):
    return await device_service.create_fan(fan)

@router.put("/fan/{device_id}/speed")
async def set_fan_speed(device_id: str, speed: int):
    if not 0 <= speed <= 3:
        raise HTTPException(status_code=400, detail="Speed must be between 0 and 3")
    return await device_service.set_fan_speed(device_id, speed)

@router.put("/fan/{device_id}/mode")
async def set_fan_mode(device_id: str, mode: str):
    if mode not in ["normal", "sleep", "turbo"]:
        raise HTTPException(status_code=400, detail="Invalid mode")
    return await device_service.set_fan_mode(device_id, mode)

# Air Conditioner endpoints
@router.post("/ac", response_model=AirConditioner)
async def create_ac(ac: AirConditioner):
    return await device_service.create_ac(ac)

@router.put("/ac/{device_id}/temperature")
async def set_ac_temperature(device_id: str, temperature: int):
    if not 16 <= temperature <= 30:
        raise HTTPException(status_code=400, detail="Temperature must be between 16 and 30")
    return await device_service.set_ac_temperature(device_id, temperature)

@router.put("/ac/{device_id}/mode")
async def set_ac_mode(device_id: str, mode: str):
    if mode not in ["cool", "heat", "fan", "dry"]:
        raise HTTPException(status_code=400, detail="Invalid mode")
    return await device_service.set_ac_mode(device_id, mode)

# Speaker endpoints
@router.post("/speaker", response_model=Speaker)
async def create_speaker(speaker: Speaker):
    return await device_service.create_speaker(speaker)

@router.put("/speaker/{device_id}/volume")
async def set_speaker_volume(device_id: str, volume: int):
    if not 0 <= volume <= 100:
        raise HTTPException(status_code=400, detail="Volume must be between 0 and 100")
    return await device_service.set_speaker_volume(device_id, volume)

@router.put("/speaker/{device_id}/play")
async def control_speaker_playback(device_id: str, action: str):
    if action not in ["play", "pause", "next", "previous"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    return await device_service.control_speaker_playback(device_id, action)

# Light endpoints
@router.post("/light", response_model=Light)
async def create_light(light: Light):
    return await device_service.create_light(light)

@router.put("/light/{device_id}/brightness")
async def set_light_brightness(device_id: str, brightness: int):
    if not 0 <= brightness <= 100:
        raise HTTPException(status_code=400, detail="Brightness must be between 0 and 100")
    return await device_service.set_light_brightness(device_id, brightness)

@router.put("/light/{device_id}/color")
async def set_light_color(device_id: str, color: str):
    return await device_service.set_light_color(device_id, color)

# Door endpoints
@router.post("/door", response_model=Door)
async def create_door(door: Door):
    return await device_service.create_door(door)

@router.put("/door/{device_id}/lock")
async def control_door_lock(device_id: str, action: str):
    if action not in ["lock", "unlock"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    return await device_service.control_door_lock(device_id, action)

@router.put("/door/{device_id}/auto-lock")
async def set_door_auto_lock(device_id: str, enabled: bool):
    return await device_service.set_door_auto_lock(device_id, enabled)

# Common device endpoints
@router.get("", response_model=List[Dict[str, Any]])
async def get_all_devices():
    return await device_service.get_all_devices()

@router.get("/{device_id}/status")
async def get_device_status(device_id: str):
    return await device_service.get_device_status(device_id)

@router.patch("/{device_id}/status")
async def update_device_status(device_id: str, updates: dict = Body(...)):
    return await device_service.update_device_status(device_id, updates)

@router.get("/{device_id}")
async def get_device_details(device_id: str):
    return await device_service.get_device_details(device_id)

@router.get("/{device_id}/logs")
async def get_device_logs(device_id: str, limit: int = 50, skip: int = 0):
    return await device_service.get_device_logs(device_id, limit, skip) 