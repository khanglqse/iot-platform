from fastapi import APIRouter, Query
from datetime import datetime
from typing import Optional
from services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
dashboard_service = DashboardService()

@router.get("/overview")
async def get_dashboard_overview():
    return await dashboard_service.get_dashboard_overview()

@router.get("/device-status")
async def get_device_status_dashboard():
    return await dashboard_service.get_device_status_dashboard()

@router.get("/analytics")
async def get_dashboard_analytics(
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None)
):
    return await dashboard_service.get_dashboard_analytics(start_date, end_date)

@router.get("/device/{device_id}/history")
async def get_device_history(
    device_id: str,
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None)
):
    return await dashboard_service.get_device_history(device_id, start_date, end_date) 