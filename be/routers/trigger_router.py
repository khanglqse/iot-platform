from fastapi import APIRouter, HTTPException
from typing import List
from models import TriggerCreate, TriggerUpdate, TriggerResponse
from services.trigger_service import TriggerService

router = APIRouter(prefix="/triggers", tags=["triggers"])
trigger_service = TriggerService()

@router.post("/", response_model=TriggerResponse)
async def create_trigger(trigger: TriggerCreate):
    return await trigger_service.create_trigger(trigger)

@router.get("/", response_model=List[TriggerResponse])
async def get_triggers():
    return await trigger_service.get_triggers()

@router.get("/{trigger_id}", response_model=TriggerResponse)
async def get_trigger(trigger_id: str):
    trigger = await trigger_service.get_trigger(trigger_id)
    if not trigger:
        raise HTTPException(status_code=404, detail="Trigger not found")
    return trigger

@router.put("/{trigger_id}", response_model=TriggerResponse)
async def update_trigger(trigger_id: str, trigger: TriggerUpdate):
    updated_trigger = await trigger_service.update_trigger(trigger_id, trigger)
    if not updated_trigger:
        raise HTTPException(status_code=404, detail="Trigger not found")
    return updated_trigger

@router.delete("/{trigger_id}")
async def delete_trigger(trigger_id: str):
    success = await trigger_service.delete_trigger(trigger_id)
    if not success:
        raise HTTPException(status_code=404, detail="Trigger not found")
    return {"message": "Trigger deleted successfully"}