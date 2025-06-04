from typing import Dict, Any, Optional
from services.device_service import DeviceService
from services.mqtt_service import MQTTService

class VoiceCommandService:
    def __init__(self):
        self.device_service = DeviceService()
        self.mqtt_service = MQTTService()

    async def process_command(self, text: str) -> Dict[str, Any]:
        """
        Process voice command text and execute corresponding device actions
        """
        text = text.lower().strip()
    
        if "mở nhạc" in text:
            search_term = text.split("mở nhạc")[-1].strip()
            return await self._handle_device_command("Loa phòng khách", {"search": search_term})
        elif "bật" in text or "mở" in text:
            device_name = text.split("bật")[-1].strip()
            return await self._handle_device_command(device_name,  {"isOn": True})
        elif "tắt" in text:
            device_name = text.split("tắt")[-1].strip()
            return await self._handle_device_command(device_name,  {"isOn": False})
                
       

        return {"status": "error", "message": "Không hiểu lệnh"}

    async def _handle_device_command(self, device_name: str, command: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle device command by finding the device and sending command via MQTT
        """
        try:
            # Find device by name
            device = await self.device_service.get_device_by_name(device_name)
            if not device:
                return {"status": "error", "message": f"Không tìm thấy thiết bị {device_name}"}

            # Send command via MQTT
            await self.mqtt_service.publish_message(f"iot/devices/{device['id']}", command)
            
            return {
                "status": "success",
                "message": f"Đã thực hiện lệnh cho {device_name}",
                "device_id": device['id'],
                "command": command
            }
        except Exception as e:
            return {"status": "error", "message": f"Lỗi khi thực hiện lệnh: {str(e)}"} 