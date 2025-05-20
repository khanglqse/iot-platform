from datetime import datetime
from typing import List, Optional
from models import TriggerCreate, TriggerUpdate, TriggerResponse
from database import db
from bson import ObjectId

class TriggerService:
    def __init__(self):
        self.collection = db.triggers

    async def create_trigger(self, trigger: TriggerCreate) -> TriggerResponse:
        trigger_dict = trigger.dict()
        trigger_dict["created_at"] = datetime.utcnow()
        trigger_dict["updated_at"] = datetime.utcnow()
        
        result = await self.collection.insert_one(trigger_dict)
        trigger_dict["id"] = str(result.inserted_id)
        
        return TriggerResponse(**trigger_dict)

    async def get_triggers(self) -> List[TriggerResponse]:
        triggers = []
        async for trigger in self.collection.find():
            trigger["id"] = str(trigger.pop("_id"))
            triggers.append(TriggerResponse(**trigger))
        return triggers

    async def get_trigger(self, trigger_id: str) -> Optional[TriggerResponse]:
        trigger = await self.collection.find_one({"_id": ObjectId(trigger_id)})
        if trigger:
            trigger["id"] = str(trigger.pop("_id"))
            return TriggerResponse(**trigger)
        return None

    async def update_trigger(self, trigger_id: str, trigger: TriggerUpdate) -> Optional[TriggerResponse]:
        update_data = trigger.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(trigger_id)},
            {"$set": update_data},
            return_document=True
        )

        if result:
            result["id"] = str(result.pop("_id"))
            return TriggerResponse(**result)
        return None

    async def delete_trigger(self, trigger_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(trigger_id)})
        return result.deleted_count > 0 