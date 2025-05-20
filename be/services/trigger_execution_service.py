from typing import Dict, Any
from datetime import datetime
from services.trigger_service import TriggerService
from services.device_service import DeviceService
from models import TriggerResponse

class TriggerExecutionService:
    def __init__(self):
        self.trigger_service = TriggerService()
        self.device_service = DeviceService()

    def _evaluate_condition(self, trigger: TriggerResponse, sensor_value: float) -> bool:
        """Evaluate if the sensor value matches the trigger condition"""
        if trigger.condition == "greater_than":
            return sensor_value > trigger.threshold
        elif trigger.condition == "less_than":
            return sensor_value < trigger.threshold
        elif trigger.condition == "equals":
            return abs(sensor_value - trigger.threshold) < 0.001  # Float comparison with tolerance
        return False

    async def process_sensor_data(self, sensor_data: Dict[str, Any]):
        """Process incoming sensor data and execute matching triggers"""
        device_id = sensor_data.get("device_id")
        if not device_id:
            return
        
        # Get all active triggers for this device
        all_triggers = await self.trigger_service.get_triggers()
        device_triggers = [
            trigger for trigger in all_triggers 
            if trigger.sensor_device_id == device_id 
            and trigger.is_active
        ]

        # Check each trigger
        for trigger in device_triggers:
            # Get the sensor value that this trigger is monitoring
            sensor_value = sensor_data.get(trigger.sensor_type)
            
            if sensor_value is not None:
                # Evaluate the condition
                if self._evaluate_condition(trigger, float(sensor_value)):
                    # Execute the action
                    await self._execute_action(trigger)

    async def _execute_action(self, trigger: TriggerResponse):
        """Execute the trigger action on the target device"""
        try:
            # Get the target device type
            device = await self.device_service.get_device(trigger.target_device_id)
            if not device:
                print(f"Target device {trigger.target_device_id} not found")
                return

            # Execute the action based on device type
            if device.type == "fan":
                if trigger.action == "turn_on":
                    await self.device_service.control_fan(device.id, True)
                elif trigger.action == "turn_off":
                    await self.device_service.control_fan(device.id, False)
                elif trigger.action == "set_speed":
                    await self.device_service.set_fan_speed(device.id, int(trigger.threshold))

            elif device.type == "ac":
                if trigger.action == "turn_on":
                    await self.device_service.control_ac(device.id, True)
                elif trigger.action == "turn_off":
                    await self.device_service.control_ac(device.id, False)
                elif trigger.action == "set_temperature":
                    await self.device_service.set_ac_temperature(device.id, int(trigger.threshold))

            elif device.type == "light":
                if trigger.action == "turn_on":
                    await self.device_service.control_light(device.id, True)
                elif trigger.action == "turn_off":
                    await self.device_service.control_light(device.id, False)
                elif trigger.action == "set_brightness":
                    await self.device_service.set_light_brightness(device.id, int(trigger.threshold))

            elif device.type == "speaker":
                if trigger.action == "turn_on":
                    await self.device_service.control_speaker(device.id, True)
                elif trigger.action == "turn_off":
                    await self.device_service.control_speaker(device.id, False)
                elif trigger.action == "set_volume":
                    await self.device_service.set_speaker_volume(device.id, int(trigger.threshold))

            elif device.type == "door":
                if trigger.action == "lock":
                    await self.device_service.control_door_lock(device.id, True)
                elif trigger.action == "unlock":
                    await self.device_service.control_door_lock(device.id, False)

            print(f"Executed action {trigger.action} on device {trigger.target_device_id}")
        except Exception as e:
            print(f"Error executing action: {str(e)}") 