from datetime import datetime
from typing import List, Optional, Dict, Any
from models import Alert
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

class AlertService:
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db
        self.collection = db.alerts

    async def get_all_alerts(self, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
        # Get total count
        total = await self.collection.count_documents({})
        
        # Get paginated data
        cursor = self.collection.find().sort("timestamp", -1).skip(skip).limit(limit)
        alerts = []
        async for document in cursor:
            # Convert MongoDB document to Alert model format
            alert_data = {
                "id": str(document["_id"]),
                "location": document.get("location", ""),
                "sensor_type": document.get("sensor_type", ""),
                "value": document.get("value", 0.0),
                "timestamp": document.get("timestamp", ""),
                "status": document.get("status", ""),
                "message": document.get("message", "")
            }
            alerts.append(Alert(**alert_data))
        
        return {
            "items": alerts,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    async def get_alert_by_id(self, alert_id: str) -> Optional[Alert]:
        document = await self.collection.find_one({"_id": ObjectId(alert_id)})
        if document:
            alert_data = {
                "id": str(document["_id"]),
                "location": document.get("location", ""),
                "sensor_type": document.get("sensor_type", ""),
                "value": document.get("value", 0.0),
                "timestamp": document.get("timestamp", ""),
                "status": document.get("status", ""),
                "message": document.get("message", "")
            }
            return Alert(**alert_data)
        return None

    async def create_alert(self, alert: Alert) -> Alert:
        alert_dict = alert.dict(by_alias=True)
        alert_dict.pop("_id", None)  # Remove id if it exists
        result = await self.collection.insert_one(alert_dict)
        alert_dict["_id"] = str(result.inserted_id)
        return Alert(**alert_dict)

    async def delete_alert(self, alert_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(alert_id)})
        return result.deleted_count > 0

    async def create_sensor_alert(self, location: str, sensor_type: str, value: float, status: str, message: str) -> Alert:
        alert = Alert(
            location=location,
            sensor_type=sensor_type,
            value=value,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            status=status,
            message=message
        )
        return await self.create_alert(alert) 