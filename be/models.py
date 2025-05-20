from pydantic import BaseModel
from typing import Optional, Literal, Dict, Any, List
from datetime import datetime

class DeviceBase(BaseModel):
    name: str
    type: str
    status: bool = False
    room: str

class Fan(DeviceBase):
    type: Literal["fan"] = "fan"
    speed: int = 0  # 0-3
    mode: Literal["normal", "natural", "sleep"] = "normal"
    swing: bool = False

class AirConditioner(DeviceBase):
    type: Literal["ac"] = "ac"
    temperature: float = 25.0
    mode: Literal["cool", "heat", "fan", "dry", "auto"] = "cool"
    fan_speed: Literal["auto", "low", "medium", "high"] = "auto"
    swing: bool = False

class Speaker(DeviceBase):
    type: Literal["speaker"] = "speaker"
    volume: int = 50  # 0-100
    mode: Literal["music", "news", "alarm"] = "music"
    is_playing: bool = False

class Light(DeviceBase):
    type: Literal["light"] = "light"
    brightness: int = 100  # 0-100
    color: str = "#FFFFFF"
    mode: Literal["normal", "warm", "cool", "color"] = "normal"

class Door(DeviceBase):
    type: Literal["door"] = "door"
    is_locked: bool = False
    auto_lock: bool = False

class DeviceStatus(BaseModel):
    device_id: str
    status: bool
    timestamp: datetime
    details: dict

class Timer(BaseModel):
    id: str
    device_id: str
    name: str
    action: str
    value: Optional[Any] = None
    schedule_time: datetime
    days_of_week: list[int] = []  # 0-6 for Sunday-Saturday
    is_active: bool = True
    created_at: datetime = datetime.now()
    last_run: Optional[datetime] = None

class SensorReading(BaseModel):
    sensor_id: str
    type: Literal["temperature", "humidity", "motion", "soil_moisture"]
    value: float
    unit: str
    location: str
    timestamp: datetime

class PlantData(BaseModel):
    plant_id: str
    soil_moisture: float
    temperature: float
    humidity: float
    light_level: float
    last_watered: datetime
    location: str
    timestamp: datetime

class RoomEnvironment(BaseModel):
    room_id: str
    temperature: float
    humidity: float
    occupancy_count: int
    last_motion: Optional[datetime]
    location: str
    timestamp: datetime

class SensorStats(BaseModel):
    sensor_id: str
    type: str
    min_value: float
    max_value: float
    avg_value: float
    total_readings: int
    start_time: datetime
    end_time: datetime

class SensorFeed(BaseModel):
    device_id: str
    timestamp: datetime
    temperature: float
    humidity: float
    light_level: float
    soil_moisture: Optional[float] = None
    location: str
    battery_level: Optional[float] = None
    signal_strength: Optional[float] = None

class SensorDevice(BaseModel):
    device_id: str
    name: str
    location: str
    type: str
    sensors: List[str]
    status: str = "active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None 


class TriggerBase(BaseModel):
    sensor_device_id: str
    sensor_type: str
    condition: str
    threshold: float
    action: str
    target_device_id: str
    is_active: bool = True,
    triggered_by: str = "manual"

class TriggerCreate(TriggerBase):
    pass

class TriggerUpdate(BaseModel):
    sensor_device_id: Optional[str] = None
    sensor_type: Optional[str] = None
    condition: Optional[str] = None
    threshold: Optional[float] = None
    action: Optional[str] = None
    target_device_id: Optional[str] = None
    is_active: Optional[bool] = None

class TriggerResponse(TriggerBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 