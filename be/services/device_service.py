from typing import List, Dict, Any
import datetime
from fastapi import HTTPException
from models import Fan, AirConditioner, Speaker, Light, Door
from database import db
from services.mqtt_service import MQTTService

class DeviceService:
    def __init__(self):
        self.mqtt_service = MQTTService()

    # Fan methods
    async def create_fan(self, fan: Fan) -> Fan:
        result = await db.devices.insert_one(fan.dict())
        return {**fan.dict(), "id": str(result.inserted_id)}

    async def set_fan_speed(self, device_id: str, speed: int):
        status_update = {
            "id": device_id,
            "timestamp": datetime.datetime.now(),
            "speed": speed
        }
        await db.device_status.insert_one(status_update)
        await self.mqtt_service.publish_message(f"iot/devices/{device_id}", {"speed": speed})
        return status_update

    async def set_fan_mode(self, device_id: str, mode: str):
        status_update = {
            "id": device_id,
            "timestamp": datetime.datetime.now(),
            "mode": mode
        }
        await db.device_status.insert_one(status_update)
        await self.mqtt_service.publish_message(f"iot/devices/{device_id}", {"mode": mode})
        return status_update

    # AC methods
    async def create_ac(self, ac: AirConditioner) -> AirConditioner:
        result = await db.devices.insert_one(ac.dict())
        return {**ac.dict(), "id": str(result.inserted_id)}

    async def set_ac_temperature(self, device_id: str, temperature: int):
        status_update = {
            "id": device_id,
            "timestamp": datetime.datetime.now(),
            "temperature": temperature
        }
        await db.device_status.insert_one(status_update)
        await self.mqtt_service.publish_message(f"iot/devices/{device_id}", {"temperature": temperature})
        return status_update

    async def set_ac_mode(self, device_id: str, mode: str):
        status_update = {
            "id": device_id,
            "timestamp": datetime.datetime.now(),
            "mode": mode
        }
        await db.device_status.insert_one(status_update)
        await self.mqtt_service.publish_message(f"iot/devices/{device_id}", {"mode": mode})
        return status_update

    # Speaker methods
    async def create_speaker(self, speaker: Speaker) -> Speaker:
        result = await db.devices.insert_one(speaker.dict())
        return {**speaker.dict(), "id": str(result.inserted_id)}

    async def set_speaker_volume(self, device_id: str, volume: int):
        status_update = {
            "id": device_id,
            "timestamp": datetime.datetime.now(),
            "volume": volume
        }
        await db.device_status.insert_one(status_update)
        await self.mqtt_service.publish_message(f"iot/devices/{device_id}", {"volume": volume})
        return status_update

    async def control_speaker_playback(self, device_id: str, action: str):
        status_update = {
            "id": device_id,
            "timestamp": datetime.datetime.now(),
            "playback_action": action
        }
        await db.device_status.insert_one(status_update)
        await self.mqtt_service.publish_message(f"iot/devices/{device_id}", {"playback_action": action})
        return status_update

    # Light methods
    async def create_light(self, light: Light) -> Light:
        result = await db.devices.insert_one(light.dict())
        return {**light.dict(), "id": str(result.inserted_id)}

    async def set_light_brightness(self, device_id: str, brightness: int):
        status_update = {
            "id": device_id,
            "timestamp": datetime.datetime.now(),
            "brightness": brightness
        }
        await db.device_status.insert_one(status_update)
        await self.mqtt_service.publish_message(f"iot/devices/{device_id}", {"brightness": brightness})
        return status_update

    async def set_light_color(self, device_id: str, color: str):
        status_update = {
            "id": device_id,
            "timestamp": datetime.datetime.now(),
            "color": color
        }
        await db.device_status.insert_one(status_update)
        await self.mqtt_service.publish_message(f"iot/devices/{device_id}", {"color": color})
        return status_update

    # Door methods
    async def create_door(self, door: Door) -> Door:
        result = await db.devices.insert_one(door.dict())
        return {**door.dict(), "id": str(result.inserted_id)}

    async def control_door_lock(self, device_id: str, action: str):
        status_update = {
            "id": device_id,
            "timestamp": datetime.datetime.now(),
            "lock_action": action
        }
        await db.device_status.insert_one(status_update)
        await self.mqtt_service.publish_message(f"iot/devices/{device_id}", {"lock_action": action})
        return status_update

    async def set_door_auto_lock(self, device_id: str, enabled: bool):
        status_update = {
            "id": device_id,
            "timestamp": datetime.datetime.now(),
            "auto_lock": enabled
        }
        await db.device_status.insert_one(status_update)
        await self.mqtt_service.publish_message(f"iot/devices/{device_id}", {"auto_lock": enabled})
        return status_update

    # Common device methods
    async def get_all_devices(self) -> List[Dict[str, Any]]:
        devices = await db.device_status.find({}, {"_id": 0}).to_list(None)
        return devices

    async def get_device_status(self, device_id: str):
        status = await db.device_status.find_one(
            {"id": device_id},
            sort=[("timestamp", -1)],
            projection={"_id": 0}
        )
        return status if status else {"status": "not_found"}

    async def update_device_status(self, device_id: str, updates: dict):
        current_time = datetime.datetime.utcnow()
        
        status_update = {
            "id": device_id,
            "timestamp": current_time,
            **updates
        }
        
        await db.device_status.update_one(
            {"id": device_id},
            {"$set": status_update},
            upsert=True
        )
        
        log_entry = {
            "device_id": device_id,
            "timestamp": current_time,
            "action": "status_update",
            "details": updates
        }
        await db.device_logs.insert_one(log_entry)
        
        if "name" in updates or "location" in updates:
            await db.devices.update_one(
                {"id": device_id},
                {"$set": updates}
            )
        
        await self.mqtt_service.publish_message(f"iot/devices/{device_id}", updates)
        return status_update

    async def get_device_details(self, device_id: str):
        device = await db.devices.find_one(
            {"id": device_id},
            projection={"_id": 0}
        )
        return device if device else {"status": "not_found"}

    async def get_device_logs(self, device_id: str, limit: int = 50, skip: int = 0):
        try:
            logs = await db.device_logs.find(
                {"device_id": device_id},
                {"_id": 0}
            ).sort("timestamp", -1).skip(skip).limit(limit).to_list(None)
            
            total_count = await db.device_logs.count_documents({"device_id": device_id})
            
            return {
                "status": "success",
                "data": {
                    "logs": logs,
                    "pagination": {
                        "total": total_count,
                        "limit": limit,
                        "skip": skip,
                        "has_more": (skip + limit) < total_count
                    }
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) 