from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from database import db

class DashboardService:
    async def get_dashboard_overview(self) -> Dict[str, Any]:
        try:
            # Get total devices count
            total_devices = await db.device_status.distinct("id")
            
            # Get device types distribution
            device_types = {}
            for device_id in total_devices:
                device = await db.device_status.find_one(
                    {"id": device_id},
                    sort=[("timestamp", -1)]
                )
                if device and "type" in device:
                    device_type = device["type"]
                    device_types[device_type] = device_types.get(device_type, 0) + 1
            
            # Get active timers count
            active_timers = await db.timers.count_documents({"is_active": True})
            
            # Get recent activities (last 24 hours)
            last_24h = datetime.now() - timedelta(hours=24)
            recent_activities = await db.device_logs.find(
                {"timestamp": {"$gte": last_24h}},
                {"_id": 0}
            ).sort("timestamp", -1).limit(10).to_list(None)
            
            return {
                "total_devices": len(total_devices),
                "device_types": device_types,
                "active_timers": active_timers,
                "recent_activities": recent_activities
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    async def get_device_status_dashboard(self) -> List[Dict[str, Any]]:
        try:
            # Get latest status for all devices
            devices = await db.device_status.distinct("id")
            device_statuses = []
            
            for device_id in devices:
                latest_status = await db.device_status.find_one(
                    {"id": device_id},
                    sort=[("timestamp", -1)]
                )
                if latest_status:
                    # Convert MongoDB document to serializable dictionary
                    serializable_status = {
                        "id": latest_status.get("id"),
                        "status": latest_status.get("status"),
                        "timestamp": latest_status.get("timestamp"),
                        "type": latest_status.get("type", "unknown"),
                        "name": latest_status.get("name", "Unnamed Device"),
                        "location": latest_status.get("location", "Unknown Location")
                    }
                    
                    # Add any additional fields that might be present
                    for key, value in latest_status.items():
                        if key not in ["_id", "id", "status", "timestamp", "type", "name", "location"]:
                            serializable_status[key] = value
                            
                    device_statuses.append(serializable_status)
            
            return device_statuses
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_dashboard_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        try:
            if not start_date:
                start_date = datetime.now() - timedelta(days=7)
            if not end_date:
                end_date = datetime.now()
                
            # Get device activity counts
            activity_counts = {}
            device_ids = await db.device_status.distinct("id")
            for device_id in device_ids:
                count = await db.device_logs.count_documents({
                    "device_id": device_id,
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                })
                activity_counts[device_id] = count
            
            # Get timer execution stats
            timer_stats = {
                "total": await db.timers.count_documents({}),
                "active": await db.timers.count_documents({"is_active": True}),
                "executions": await db.device_logs.count_documents({
                    "action": "timer_execution",
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                })
            }
            
            # Get device type distribution
            device_types = {}
            for device_id in device_ids:
                device = await db.device_status.find_one(
                    {"id": device_id},
                    sort=[("timestamp", -1)]
                )
                if device and "type" in device:
                    device_type = device["type"]
                    device_types[device_type] = device_types.get(device_type, 0) + 1
            
            return {
                "activity_counts": activity_counts,
                "timer_stats": timer_stats,
                "device_types": device_types,
                "period": {
                    "start": start_date,
                    "end": end_date
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_device_history(
        self,
        device_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        try:
            if not start_date:
                start_date = datetime.now() - timedelta(days=7)
            if not end_date:
                end_date = datetime.now()
                
            # Get device status history
            status_history = await db.device_status.find(
                {
                    "id": device_id,
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                },
                {"_id": 0}
            ).sort("timestamp", 1).to_list(None)
            
            # Get device activity logs
            activity_logs = await db.device_logs.find(
                {
                    "device_id": device_id,
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                },
                {"_id": 0}
            ).sort("timestamp", -1).to_list(None)
            
            return {
                "status_history": status_history,
                "activity_logs": activity_logs,
                "period": {
                    "start": start_date,
                    "end": end_date
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) 