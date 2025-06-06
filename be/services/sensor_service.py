from datetime import datetime, date, time, timedelta
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from database import db

class SensorService:
    async def get_all_sensors(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get all sensors grouped by location
        """
        try:
            # First get all devices from sensor_devices collection
            devices = await db.sensor_devices.find().to_list(None)
            
            # Get the latest reading for each device
            pipeline = [
                {
                    "$match": {
                        "device_id": {"$in": [device["device_id"] for device in devices]}
                    }
                },
                {
                    "$sort": {"timestamp": -1}
                },
                {
                    "$group": {
                        "_id": "$device_id",
                        "latest_reading": {"$first": "$$ROOT"}
                    }
                },
                {
                    "$replaceRoot": {"newRoot": "$latest_reading"}
                },
                {
                    "$group": {
                        "_id": "$location",
                        "sensors": {"$push": "$$ROOT"}
                    }
                }
            ]
            
            result = await db.sensor_data.aggregate(pipeline).to_list(None)
            
            # Format the response to match frontend expectations
            return {
                "locations": [
                    {
                        "location": group["_id"],
                        "sensors": [
                            {
                                "device_id": sensor["device_id"],
                                "timestamp": sensor["timestamp"],
                                "temperature": sensor.get("temperature", "0"),
                                "humidity": sensor.get("humidity", "0"),
                                "light_level": sensor.get("light_level", "0"),
                                "soil_moisture": sensor.get("soil_moisture", "0"),
                                "location": sensor["location"],
                                "type": sensor["type"]
                            }
                            for sensor in group["sensors"]
                        ]
                    }
                    for group in result
                ]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_sensors_by_location(self, location: str) -> List[Dict[str, Any]]:
        """
        Get all sensors for a specific location
        """
        try:
            # Get the latest reading for each sensor in the location
            pipeline = [
                {
                    "$match": {"location": location}
                },
                {
                    "$sort": {"timestamp": -1}
                },
                {
                    "$group": {
                        "_id": "$device_id",
                        "latest_reading": {"$first": "$$ROOT"}
                    }
                },
                {
                    "$replaceRoot": {"newRoot": "$latest_reading"}
                }
            ]
            
            sensors = await db.sensor_data.aggregate(pipeline).to_list(None)
            return sensors
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    async def get_sensor_by_id(self, device_id: str) -> Dict[str, Any]:
        """
        Get the latest sensor data for a specific device
        """
        try:
            sensor = await db.sensor_data.find_one(
                {"device_id": device_id},
                sort=[("timestamp", -1)]
            )
            
            if not sensor:
                raise HTTPException(status_code=404, detail=f"Sensor {device_id} not found")
                
            return sensor
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    async def get_sensor_history(
        self,
        device_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get historical sensor data for a specific device
        """
        try:
            # First try to get summary data
            summary_query = {"device_id": device_id}
            
            if start_time and end_time:
                summary_query["date"] = {
                    "$gte": start_time,
                    "$lte": end_time
                }
            
            summary_data = await db.sensor_summary.find(
                summary_query,
                sort=[("date", -1)],
                limit=limit
            ).to_list(None)

            if summary_data:
                # Convert summary data to the expected format
                serialized_summary = []
                for doc in summary_data:
                    serialized_doc = {
                        "device_id": doc.get("device_id"),
                        "timestamp": doc.get("date"),
                        "temperature": doc.get("avg_temperature", "0"),
                        "humidity": doc.get("avg_humidity", "0"),
                        "light_level": doc.get("avg_light_level", "0"),
                        "soil_moisture": doc.get("avg_soil_moisture", "0"),
                        "location": doc.get("location"),
                        "type": "summary",
                        "stats": {
                            "temperature": {
                                "min": doc.get("min_temperature", "0"),
                                "max": doc.get("max_temperature", "0"),
                                "avg": doc.get("avg_temperature", "0")
                            },
                            "humidity": {
                                "min": doc.get("min_humidity", "0"),
                                "max": doc.get("max_humidity", "0"),
                                "avg": doc.get("avg_humidity", "0")
                            },
                            "light_level": {
                                "min": doc.get("min_light_level", "0"),
                                "max": doc.get("max_light_level", "0"),
                                "avg": doc.get("avg_light_level", "0")
                            },
                            "soil_moisture": {
                                "min": doc.get("min_soil_moisture", "0"),
                                "max": doc.get("max_soil_moisture", "0"),
                                "avg": doc.get("avg_soil_moisture", "0")
                            },
                            "battery": {
                                "min": doc.get("min_battery", "0"),
                                "max": doc.get("max_battery", "0"),
                                "avg": doc.get("avg_battery", "0")
                            },
                            "record_count": doc.get("record_count", "0")
                        }
                    }
                    serialized_summary.append(serialized_doc)
                return serialized_summary

            # Fallback to raw sensor data if no summary data is available
            query = {"device_id": device_id}
            
            if start_time and end_time:
                query["timestamp"] = {
                    "$gte": start_time,
                    "$lte": end_time
                }
            
            history = await db.sensor_data.find(
                query,
                sort=[("timestamp", -1)],
                limit=limit
            ).to_list(None)
            
            # Convert MongoDB documents to serializable dictionaries
            serialized_history = []
            for doc in history:
                serialized_doc = {
                    "device_id": doc.get("device_id"),
                    "timestamp": doc.get("timestamp"),
                    "temperature": doc.get("temperature", "0"),
                    "humidity": doc.get("humidity", "0"),
                    "light_level": doc.get("light_level", "0"),
                    "soil_moisture": doc.get("soil_moisture", "0"),
                    "location": doc.get("location"),
                    "type": "raw"
                }
                serialized_history.append(serialized_doc)
            return serialized_history
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
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
        
        # Convert to serializable dictionaries
        serialized_readings = []
        for reading in readings:
            # Create a new dict with just the fields we need, excluding ObjectId
            serialized_reading = {k: v for k, v in reading.items() if k != '_id'}
            serialized_readings.append(serialized_reading)
        
        return serialized_readings

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