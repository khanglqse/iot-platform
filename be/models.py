from pydantic import BaseModel
from typing import Optional, Literal, Dict, Any
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