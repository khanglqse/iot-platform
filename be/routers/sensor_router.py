from fastapi import APIRouter, Query
from datetime import datetime, date
from typing import Optional
from services.sensor_service import SensorService

router = APIRouter(tags=["sensors"])
sensor_service = SensorService()

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