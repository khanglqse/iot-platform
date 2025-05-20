from typing import List, Dict, Any
import datetime
from fastapi import HTTPException
from models import SensorDevice
from database import db

class SensorDeviceService:
    async def create_sensor_device(self, sensor: SensorDevice) -> Dict[str, Any]:
        """Create a new sensor device"""
        try:
            sensor_dict = sensor.dict()
            sensor_dict["created_at"] = datetime.datetime.now()
            result = await db.sensor_devices.insert_one(sensor_dict)
            return {**sensor_dict, "id": str(result.inserted_id)}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create sensor device: {str(e)}")

    async def get_all_sensor_devices(self) -> List[Dict[str, Any]]:
        """Get all sensor devices"""
        try:
            sensors = await db.sensor_devices.find({}, {"_id": 0}).to_list(None)
            return sensors
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch sensor devices: {str(e)}")

    async def get_sensor_device_by_id(self, device_id: str) -> Dict[str, Any]:
        """Get a specific sensor device by ID"""
        try:
            sensor = await db.sensor_devices.find_one({"device_id": device_id}, {"_id": 0})
            if not sensor:
                raise HTTPException(status_code=404, detail=f"Sensor device {device_id} not found")
            return sensor
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch sensor device: {str(e)}")

    async def get_sensor_devices_by_location(self, location: str) -> List[Dict[str, Any]]:
        """Get all sensor devices in a specific location"""
        try:
            sensors = await db.sensor_devices.find({"location": location}, {"_id": 0}).to_list(None)
            return sensors
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch sensor devices by location: {str(e)}")

    async def get_sensor_devices_by_type(self, sensor_type: str) -> List[Dict[str, Any]]:
        """Get all sensor devices of a specific type"""
        try:
            sensors = await db.sensor_devices.find({"type": sensor_type}, {"_id": 0}).to_list(None)
            return sensors
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch sensor devices by type: {str(e)}")

    async def update_sensor_device(self, device_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update a sensor device"""
        try:
            updates["updated_at"] = datetime.datetime.now()
            result = await db.sensor_devices.update_one(
                {"device_id": device_id},
                {"$set": updates}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail=f"Sensor device {device_id} not found")
            
            updated_sensor = await self.get_sensor_device_by_id(device_id)
            return updated_sensor
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update sensor device: {str(e)}")

    async def delete_sensor_device(self, device_id: str) -> Dict[str, str]:
        """Delete a sensor device"""
        try:
            result = await db.sensor_devices.delete_one({"device_id": device_id})
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail=f"Sensor device {device_id} not found")
            return {"status": "success", "message": f"Sensor device {device_id} deleted"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete sensor device: {str(e)}")

    async def initialize_sample_devices(self):
        """Initialize sample sensor devices"""
        try:
            sample_devices = [
                {
                    "device_id": "raspberry_pi_001",
                    "name": "Living Room Environment Sensor",
                    "location": "living_room",
                    "type": "environment",
                    "sensors": ["temperature", "humidity", "light_level"],
                    "status": "active",
                    "created_at": datetime.datetime.now()
                },
                {
                    "device_id": "raspberry_pi_002",
                    "name": "Bedroom Environment Sensor",
                    "location": "bedroom",
                    "type": "environment",
                    "sensors": ["temperature", "humidity", "light_level"],
                    "status": "active",
                    "created_at": datetime.datetime.now()
                },
                {
                    "device_id": "raspberry_pi_003",
                    "name": "Kitchen Environment Sensor",
                    "location": "kitchen",
                    "type": "environment",
                    "sensors": ["temperature", "humidity"],
                    "status": "active",
                    "created_at": datetime.datetime.now()
                },
                {
                    "device_id": "raspberry_pi_004",
                    "name": "Garden Plant Sensor",
                    "location": "garden",
                    "type": "plant",
                    "sensors": ["soil_moisture", "light_level"],
                    "status": "active",
                    "created_at": datetime.datetime.now()
                }
            ]

            for device in sample_devices:
                existing = await db.sensor_devices.find_one({"device_id": device["device_id"]})
                if not existing:
                    await db.sensor_devices.insert_one(device)

            return {"status": "success", "message": "Sample sensor devices initialized"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to initialize sample devices: {str(e)}") 