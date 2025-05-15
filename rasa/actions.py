from typing import Any, Text, Dict, List, Optional
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet


def create_custom_response(action: str, device_name: Optional[str] = None, value: Optional[Any] = None) -> Dict[str, Any]:
    return {
        "action": action,
        "device_name": device_name,
        "value": value
    }


class ActionTurnOnDevice(Action):
    def name(self) -> Text:
        return "action_turn_on_device"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        device_name = tracker.get_slot("device_name")
        dispatcher.utter_message(json_message=create_custom_response("turn_on", device_name))
        return [SlotSet("device_name", device_name)]


class ActionTurnOffDevice(Action):
    def name(self) -> Text:
        return "action_turn_off_device"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        device_name = tracker.get_slot("device_name")
        dispatcher.utter_message(json_message=create_custom_response("turn_off", device_name))
        return [SlotSet("device_name", device_name)]


class ActionLockDoor(Action):
    def name(self) -> Text:
        return "action_lock_door"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        device_name = tracker.get_slot("device_name")
        dispatcher.utter_message(json_message=create_custom_response("lock", device_name))
        return [SlotSet("device_name", device_name)]


class ActionUnlockDoor(Action):
    def name(self) -> Text:
        return "action_unlock_door"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        device_name = tracker.get_slot("device_name")
        dispatcher.utter_message(json_message=create_custom_response("unlock", device_name))
        return [SlotSet("device_name", device_name)]


class ActionCheckDeviceStatus(Action):
    def name(self) -> Text:
        return "action_check_device_status"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        device_name = tracker.get_slot("device_name")
        dispatcher.utter_message(json_message=create_custom_response("check_status", device_name))
        return [SlotSet("device_name", device_name)]


class ActionSetTemperature(Action):
    def name(self) -> Text:
        return "action_set_temperature"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        device_name = tracker.get_slot("device_name")
        temperature = tracker.get_slot("temperature")
        dispatcher.utter_message(json_message=create_custom_response("set_temperature", device_name, temperature))
        return [SlotSet("device_name", device_name), SlotSet("temperature", temperature)]


class ActionSetBrightness(Action):
    def name(self) -> Text:
        return "action_set_brightness"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        device_name = tracker.get_slot("device_name")
        brightness = tracker.get_slot("brightness")
        dispatcher.utter_message(json_message=create_custom_response("set_brightness", device_name, brightness))
        return [SlotSet("device_name", device_name), SlotSet("brightness", brightness)]


class ActionSetVolume(Action):
    def name(self) -> Text:
        return "action_set_volume"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        device_name = tracker.get_slot("device_name")
        volume = tracker.get_slot("volume")
        dispatcher.utter_message(json_message=create_custom_response("set_volume", device_name, volume))
        return [SlotSet("device_name", device_name), SlotSet("volume", volume)]


class ActionSetFanSpeed(Action):
    def name(self) -> Text:
        return "action_set_fan_speed"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        device_name = tracker.get_slot("device_name")
        speed = tracker.get_slot("speed")
        dispatcher.utter_message(json_message=create_custom_response("set_fan_speed", device_name, speed))
        return [SlotSet("device_name", device_name), SlotSet("speed", speed)]
