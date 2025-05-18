import datetime
import uuid
from typing import List
from fastapi import HTTPException
from models import Timer
from database import db
from services.mqtt_service import MQTTService
import asyncio

class TimerService:
    def __init__(self):
        self.mqtt_service = MQTTService()

    async def create_timer(self, device_id: str, timer: Timer) -> Timer:
        timer_dict = timer.dict()
        timer_dict["device_id"] = device_id
        timer_dict["id"] = str(uuid.uuid4())
        timer_dict["created_at"] = datetime.datetime.now()
        timer_dict["last_run"] = None
        
        await db.timers.insert_one(timer_dict)
        return timer_dict

    async def get_device_timers(self, device_id: str) -> List[Timer]:
        timers = await db.timers.find({"device_id": device_id}).to_list(None)
        return timers

    async def update_timer(self, device_id: str, timer_id: str, timer: Timer):
        existing_timer = await db.timers.find_one({
            "id": timer_id,
            "device_id": device_id
        })
        if not existing_timer:
            raise HTTPException(status_code=404, detail="Timer not found")
        
        timer_dict = timer.dict()
        timer_dict["id"] = timer_id
        timer_dict["device_id"] = device_id
        
        await db.timers.update_one(
            {"id": timer_id},
            {"$set": timer_dict}
        )
        
        updated_timer = await db.timers.find_one(
            {"id": timer_id},
            {"_id": 0}
        )
        return updated_timer

    async def delete_timer(self, device_id: str, timer_id: str):
        result = await db.timers.delete_one({
            "id": timer_id,
            "device_id": device_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Timer not found")
        
        return {"status": "success"}

    async def execute_timer(self, timer: dict):
        """Execute a timer action"""
        try:
            # Create action payload
            payload = {
                "action": timer["action"]
            }
            if timer.get("value") is not None:
                payload["value"] = timer["value"]
            
            # Send MQTT message
            await self.mqtt_service.publish_message(
                f"iot/devices/{timer['device_id']}", 
                payload
            )
            
            # Update last run time
            await db.timers.update_one(
                {"id": timer["id"]},
                {"$set": {"last_run": datetime.datetime.now()}}
            )
            
            # Log the action
            log_entry = {
                "device_id": timer["device_id"],
                "timestamp": datetime.datetime.now(),
                "action": "timer_execution",
                "details": {
                    "timer_id": timer["id"],
                    "timer_name": timer["name"],
                    "action": timer["action"],
                    "value": timer.get("value")
                }
            }
            await db.device_logs.insert_one(log_entry)
            
        except Exception as e:
            print(f"Error executing timer: {str(e)}")

    async def check_timers(self):
        """Check and execute due timers"""
        while True:
            try:
                current_time = datetime.datetime.now()
                current_weekday = current_time.weekday()
                
                # Find due timers
                due_timers = await db.timers.find({
                    "is_active": True,
                    "$or": [
                        {"days_of_week": current_weekday},
                        {"days_of_week": []}  # Daily timers
                    ]
                }).to_list(None)
                
                for timer in due_timers:
                    schedule_time = timer["schedule_time"]
                    if isinstance(schedule_time, str):
                        schedule_time = datetime.datetime.fromisoformat(schedule_time)
                    
                    # Check if it's time to execute
                    if (current_time.hour == schedule_time.hour and 
                        current_time.minute == schedule_time.minute):
                        await self.execute_timer(timer)
                
                # Wait for 1 minute before next check
                await asyncio.sleep(60)
                
            except Exception as e:
                print(f"Error in timer scheduler: {str(e)}")
                await asyncio.sleep(60) 