from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from models import SensorDevice
from services.sensor_device_service import SensorDeviceService

router = APIRouter(
    prefix="/sensor-devices",
    tags=["sensor-devices"]
)

sensor_device_service = SensorDeviceService()

@router.get("", response_model=List[Dict[str, Any]])
async def get_all_sensor_devices():
    """Get all sensor devices"""
    return await sensor_device_service.get_all_sensor_devices()

@router.get("/{device_id}", response_model=Dict[str, Any])
async def get_sensor_device(device_id: str):
    """Get a specific sensor device by ID"""
    return await sensor_device_service.get_sensor_device_by_id(device_id)

@router.get("/location/{location}", response_model=List[Dict[str, Any]])
async def get_sensor_devices_by_location(location: str):
    """Get all sensor devices in a specific location"""
    return await sensor_device_service.get_sensor_devices_by_location(location)

@router.get("/type/{sensor_type}", response_model=List[Dict[str, Any]])
async def get_sensor_devices_by_type(sensor_type: str):
    """Get all sensor devices of a specific type"""
    return await sensor_device_service.get_sensor_devices_by_type(sensor_type)

@router.post("/", response_model=Dict[str, Any])
async def create_sensor_device(sensor: SensorDevice):
    """Create a new sensor device"""
    return await sensor_device_service.create_sensor_device(sensor)

@router.put("/{device_id}", response_model=Dict[str, Any])
async def update_sensor_device(device_id: str, updates: SensorDevice):
    """Update a sensor device"""
    return await sensor_device_service.update_sensor_device(device_id, updates.dict(exclude_unset=True))

@router.delete("/{device_id}", response_model=Dict[str, str])
async def delete_sensor_device(device_id: str):
    """Delete a sensor device"""
    return await sensor_device_service.delete_sensor_device(device_id)

@router.post("/initialize-sample", response_model=Dict[str, str])
async def initialize_sample_devices():
    """Initialize sample sensor devices"""
    return await sensor_device_service.initialize_sample_devices() 