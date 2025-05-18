from fastapi import APIRouter, HTTPException, Query
from typing import List
import datetime
import uuid
from models import Timer
from services.timer_service import TimerService
from services.device_service import DeviceService

router = APIRouter(prefix="/devices", tags=["timers"])
timer_service = TimerService()
device_service = DeviceService()

@router.post("/{device_id}/timers", response_model=Timer)
async def create_timer(device_id: str, timer: Timer):
    # Validate device exists
    if not await device_service.get_device_status(device_id):
        raise HTTPException(status_code=404, detail="Device not found")
    
    return await timer_service.create_timer(device_id, timer)

@router.get("/{device_id}/timers", response_model=List[Timer])
async def get_device_timers(device_id: str):
    # Validate device exists
    if not await device_service.get_device_status(device_id):
        raise HTTPException(status_code=404, detail="Device not found")
        
    return await timer_service.get_device_timers(device_id)

@router.put("/{device_id}/timers/{timer_id}")
async def update_timer(device_id: str, timer_id: str, timer: Timer):
    # Validate device exists
    if not await device_service.get_device_status(device_id):
        raise HTTPException(status_code=404, detail="Device not found")
    
    return await timer_service.update_timer(device_id, timer_id, timer)

@router.delete("/{device_id}/timers/{timer_id}")
async def delete_timer(device_id: str, timer_id: str):
    # Validate device exists
    if not await device_service.get_device_status(device_id):
        raise HTTPException(status_code=404, detail="Device not found")
        
    return await timer_service.delete_timer(device_id, timer_id) 