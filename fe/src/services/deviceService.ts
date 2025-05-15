import axios from 'axios';
import { Device, FanDevice, ACDevice, SpeakerDevice, LightDevice, DoorDevice } from '../types/devices';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Get all devices
export const getAllDevices = async (): Promise<Device[]> => { 
  const response = await axios.get(`${API_BASE_URL}/devices`);
  return response.data;
};

// Fan APIs
export const createFan = async (fan: FanDevice): Promise<FanDevice> => {
  const response = await axios.post(`${API_BASE_URL}/devices/fan`, fan);
  return response.data;
};

export const setFanSpeed = async (fanId: string, speed: number): Promise<void> => {
  await axios.put(`${API_BASE_URL}/devices/fan/${fanId}/speed`, { speed });
};

export const setFanMode = async (fanId: string, mode: string): Promise<void> => {
  await axios.put(`${API_BASE_URL}/devices/fan/${fanId}/mode`, { mode });
};

// Air Conditioner APIs
export const createAC = async (ac: ACDevice): Promise<ACDevice> => {
  const response = await axios.post(`${API_BASE_URL}/devices/ac`, ac);
  return response.data;
};

export const setACTemperature = async (acId: string, temperature: number): Promise<void> => {
  await axios.put(`${API_BASE_URL}/devices/ac/${acId}/temperature`, { temperature });
};

export const setACMode = async (acId: string, mode: string): Promise<void> => {
  await axios.put(`${API_BASE_URL}/devices/ac/${acId}/mode`, { mode });
};

// Speaker APIs
export const createSpeaker = async (speaker: SpeakerDevice): Promise<SpeakerDevice> => {
  const response = await axios.post(`${API_BASE_URL}/devices/speaker`, speaker);
  return response.data;
};

export const setSpeakerVolume = async (speakerId: string, volume: number): Promise<void> => {
  await axios.put(`${API_BASE_URL}/devices/speaker/${speakerId}/volume`, { volume });
};

export const controlSpeakerPlayback = async (speakerId: string, action: string): Promise<void> => {
  await axios.put(`${API_BASE_URL}/devices/speaker/${speakerId}/play`, { action });
};

// Light APIs
export const createLight = async (light: LightDevice): Promise<LightDevice> => {
  const response = await axios.post(`${API_BASE_URL}/devices/light`, light);
  return response.data;
};

export const setLightBrightness = async (lightId: string, brightness: number): Promise<void> => {
  await axios.put(`${API_BASE_URL}/devices/light/${lightId}/brightness`, { brightness });
};

export const setLightColor = async (lightId: string, color: string): Promise<void> => {
  await axios.put(`${API_BASE_URL}/devices/light/${lightId}/color`, { color });
};

// Door APIs
export const createDoor = async (door: DoorDevice): Promise<DoorDevice> => {
  const response = await axios.post(`${API_BASE_URL}/devices/door`, door);
  return response.data;
};

export const controlDoorLock = async (doorId: string, action: string): Promise<void> => {
  await axios.put(`${API_BASE_URL}/devices/door/${doorId}/lock`, { action });
};

export const setDoorAutoLock = async (doorId: string, enabled: boolean): Promise<void> => {
  await axios.put(`${API_BASE_URL}/devices/door/${doorId}/auto-lock`, { enabled });
};

// Get device status
export const getDeviceStatus = async (deviceId: string): Promise<Device> => {
  const response = await axios.get(`${API_BASE_URL}/devices/${deviceId}/status`);
  return response.data;
};

export const updateDeviceStatus = async (deviceId: string, updates: Partial<Device>): Promise<Device> => {
  const response = await axios.patch(`${API_BASE_URL}/devices/${deviceId}/status`, updates);
  return response.data;
}; 