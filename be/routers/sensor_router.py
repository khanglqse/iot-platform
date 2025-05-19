from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from services.sensor_service import SensorService

router = APIRouter()
sensor_service = SensorService()

@router.get("/sensors")
async def get_all_sensors() -> Dict[str, List[Dict[str, Any]]]:
    """
    Get all sensors grouped by location
    Returns a dictionary with locations as keys and lists of sensor data as values
    """
    return await sensor_service.get_all_sensors()

@router.get("/sensors/location/{location}")
async def get_sensors_by_location(location: str) -> List[Dict[str, Any]]:
    """
    Get all sensors for a specific location
    """
    return await sensor_service.get_sensors_by_location(location)

@router.get("/sensors/{device_id}")
async def get_sensor_by_id(device_id: str) -> Dict[str, Any]:
    """
    Get sensor data for a specific device
    """
    return await sensor_service.get_sensor_by_id(device_id)

@router.get("/sensors/{device_id}/history")
async def get_sensor_history(
    device_id: str,
    start_time: datetime = None,
    end_time: datetime = None
) -> List[Dict[str, Any]]:
    """
    Get historical sensor data for a specific device
    """
    return await sensor_service.get_sensor_history(device_id, start_time, end_time)

@router.get("/sensors/readings/{sensor_id}")
async def get_sensor_readings(
    sensor_id: str,
    start_time: Optional[datetime] = Query(default=None),
    end_time: Optional[datetime] = Query(default=None),
    limit: int = Query(default=100)
):
    return await sensor_service.get_sensor_readings(sensor_id, start_time, end_time, limit)

@router.get("/environment/{room_id}")
async def get_room_environment(
    room_id: str,
    start_time: Optional[datetime] = Query(default=None),
    end_time: Optional[datetime] = Query(default=None)
):
    return await sensor_service.get_room_environment(room_id, start_time, end_time)

@router.get("/plants/{plant_id}")
async def get_plant_data(
    plant_id: str,
    start_time: Optional[datetime] = Query(default=None),
    end_time: Optional[datetime] = Query(default=None)
):
    return await sensor_service.get_plant_data(plant_id, start_time, end_time)

@router.get("/sensors/stats")
async def get_sensor_stats(
    start_time: Optional[datetime] = Query(default=None),
    end_time: Optional[datetime] = Query(default=None)
):
    return await sensor_service.get_sensor_stats(start_time, end_time)

@router.get("/occupancy/daily")
async def get_daily_occupancy(
    room_id: str,
    date: Optional[date] = Query(default=None)
):
    return await sensor_service.get_daily_occupancy(room_id, date) 