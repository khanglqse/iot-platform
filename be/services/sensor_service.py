from datetime import datetime, date, time, timedelta
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from database import db

class SensorService:
    async def get_sensor_readings(
        self,
        sensor_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        query = {"sensor_id": sensor_id}
        if start_time and end_time:
            query["timestamp"] = {"$gte": start_time, "$lte": end_time}
        
        readings = await db.sensor_readings.find(
            query,
            sort=[("timestamp", -1)],
            limit=limit
        ).to_list(None)
        return readings

    async def get_room_environment(
        self,
        room_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        query = {"room_id": room_id}
        if start_time and end_time:
            query["timestamp"] = {"$gte": start_time, "$lte": end_time}
        
        latest = await db.room_environment.find_one(
            {"room_id": room_id},
            sort=[("timestamp", -1)]
        )
        
        history = await db.room_environment.find(
            query,
            sort=[("timestamp", -1)],
            limit=24  # Last 24 readings
        ).to_list(None)
        
        return {
            "current": latest,
            "history": history
        }

    async def get_plant_data(
        self,
        plant_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        query = {"plant_id": plant_id}
        if start_time and end_time:
            query["timestamp"] = {"$gte": start_time, "$lte": end_time}
        
        latest = await db.plant_data.find_one(
            {"plant_id": plant_id},
            sort=[("timestamp", -1)]
        )
        
        history = await db.plant_data.find(
            query,
            sort=[("timestamp", -1)],
            limit=24  # Last 24 readings
        ).to_list(None)
        
        # Get watering alerts
        alerts = await db.alerts.find(
            {
                "type": "plant_watering",
                "plant_id": plant_id,
                "timestamp": {"$gte": datetime.now() - timedelta(days=7)}
            },
            sort=[("timestamp", -1)]
        ).to_list(None)
        
        return {
            "current": latest,
            "history": history,
            "alerts": alerts
        }

    async def get_sensor_stats(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        pipeline = [
            {
                "$match": {
                    "timestamp": {
                        "$gte": start_time or (datetime.now() - timedelta(days=1)),
                        "$lte": end_time or datetime.now()
                    }
                }
            },
            {
                "$group": {
                    "_id": {
                        "sensor_id": "$sensor_id",
                        "type": "$type"
                    },
                    "min_value": {"$min": "$value"},
                    "max_value": {"$max": "$value"},
                    "avg_value": {"$avg": "$value"},
                    "total_readings": {"$sum": 1},
                    "start_time": {"$min": "$timestamp"},
                    "end_time": {"$max": "$timestamp"}
                }
            }
        ]
        
        stats = await db.sensor_readings.aggregate(pipeline).to_list(None)
        return [
            {
                "sensor_id": stat["_id"]["sensor_id"],
                "type": stat["_id"]["type"],
                "min_value": stat["min_value"],
                "max_value": stat["max_value"],
                "avg_value": round(stat["avg_value"], 2),
                "total_readings": stat["total_readings"],
                "start_time": stat["start_time"],
                "end_time": stat["end_time"]
            }
            for stat in stats
        ]

    async def get_daily_occupancy(
        self,
        room_id: str,
        target_date: Optional[date] = None
    ) -> Dict[str, Any]:
        target_date = target_date or datetime.now().date()
        start_time = datetime.combine(target_date, time.min)
        end_time = datetime.combine(target_date, time.max)
        
        pipeline = [
            {
                "$match": {
                    "room_id": room_id,
                    "timestamp": {"$gte": start_time, "$lte": end_time}
                }
            },
            {
                "$group": {
                    "_id": {
                        "hour": {"$hour": "$timestamp"}
                    },
                    "avg_occupancy": {"$avg": "$occupancy_count"},
                    "max_occupancy": {"$max": "$occupancy_count"}
                }
            },
            {
                "$sort": {"_id.hour": 1}
            }
        ]
        
        hourly_stats = await db.room_environment.aggregate(pipeline).to_list(None)
        return {
            "room_id": room_id,
            "date": target_date.isoformat(),
            "hourly_stats": [
                {
                    "hour": stat["_id"]["hour"],
                    "avg_occupancy": round(stat["avg_occupancy"], 2),
                    "max_occupancy": stat["max_occupancy"]
                }
                for stat in hourly_stats
            ]
        } 