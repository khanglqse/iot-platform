import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface SensorDevice {
  device_id: string;
  name: string;
  location: string;
  type: string;
  sensors: string[];
  status: string;
  created_at?: string;
  updated_at?: string;
}

const sensorDeviceService = {
  async getAllSensorDevices(): Promise<SensorDevice[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sensor-devices`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sensor devices:', error);
      throw error;
    }
  },

  async getSensorDeviceById(deviceId: string): Promise<SensorDevice> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sensor-devices/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching sensor device ${deviceId}:`, error);
      throw error;
    }
  },

  async getSensorDevicesByLocation(location: string): Promise<SensorDevice[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sensor-devices/location/${location}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching sensor devices for location ${location}:`, error);
      throw error;
    }
  },

  async getSensorDevicesByType(type: string): Promise<SensorDevice[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sensor-devices/type/${type}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching sensor devices of type ${type}:`, error);
      throw error;
    }
  },

  async createSensorDevice(sensorDevice: Omit<SensorDevice, 'created_at' | 'updated_at'>): Promise<SensorDevice> {
    try {
      const response = await axios.post(`${API_BASE_URL}/sensor-devices`, sensorDevice);
      return response.data;
    } catch (error) {
      console.error('Error creating sensor device:', error);
      throw error;
    }
  },

  async updateSensorDevice(deviceId: string, updates: Partial<SensorDevice>): Promise<SensorDevice> {
    try {
      const response = await axios.put(`${API_BASE_URL}/sensor-devices/${deviceId}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Error updating sensor device ${deviceId}:`, error);
      throw error;
    }
  },

  async deleteSensorDevice(deviceId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/sensor-devices/${deviceId}`);
    } catch (error) {
      console.error(`Error deleting sensor device ${deviceId}:`, error);
      throw error;
    }
  },

  async initializeSampleDevices(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/sensor-devices/initialize-sample`);
    } catch (error) {
      console.error('Error initializing sample devices:', error);
      throw error;
    }
  }
};

export default sensorDeviceService; 