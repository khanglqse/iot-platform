from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from routers import device_router, timer_router, sensor_router, dashboard_router, sensor_device_router
from services.mqtt_service import MQTTService
from database import setup_indexes
from fastapi.responses import JSONResponse
from utils.json_encoder import CustomJSONEncoder
import json

# Custom JSONResponse class to handle BSON ObjectId
class CustomJSONResponse(JSONResponse):
    def render(self, content):
        return json.dumps(
            content,
            cls=CustomJSONEncoder,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":")
        ).encode("utf-8")

app = FastAPI(default_response_class=CustomJSONResponse)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(device_router.router)
app.include_router(timer_router.router)
app.include_router(sensor_router.router)
app.include_router(dashboard_router.router)
app.include_router(sensor_device_router.router)

# Initialize MQTT service
mqtt_service = MQTTService()

@app.on_event("startup")
async def startup_event():
    # Set up database indexes
    await setup_indexes()
    
    # Start timer scheduler
    from services.timer_service import TimerService
    timer_service = TimerService()
    asyncio.create_task(timer_service.check_timers())

    # Initialize database
    # Start MQTT service
    mqtt_service.start()

@app.on_event("shutdown")
async def shutdown_event():
    # Stop MQTT service
    mqtt_service.stop()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)