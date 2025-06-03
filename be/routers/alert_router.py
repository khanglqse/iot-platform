from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any
from models import Alert
from services.alert_service import AlertService
from database import db

router = APIRouter(prefix="/alerts", tags=["alerts"])

def get_alert_service():
    return AlertService(db)

@router.get("", response_model=Dict[str, Any])
async def get_all_alerts(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    alert_service: AlertService = Depends(get_alert_service)
):
    """
    Get all alerts with pagination
    """
    return await alert_service.get_all_alerts(skip=skip, limit=limit)

@router.get("/{alert_id}", response_model=Alert)
async def get_alert(alert_id: str, alert_service: AlertService = Depends(get_alert_service)):
    """
    Get a specific alert by ID
    """
    alert = await alert_service.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.post("", response_model=Alert)
async def create_alert(alert: Alert, alert_service: AlertService = Depends(get_alert_service)):
    """
    Create a new alert
    """
    return await alert_service.create_alert(alert)

@router.put("/{alert_id}/read", response_model=Alert)
async def mark_alert_as_read(alert_id: str, alert_service: AlertService = Depends(get_alert_service)):
    """
    Mark an alert as read
    """
    alert = await alert_service.mark_as_read(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.delete("/{alert_id}")
async def delete_alert(alert_id: str, alert_service: AlertService = Depends(get_alert_service)):
    """
    Delete an alert
    """
    success = await alert_service.delete_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted successfully"} 