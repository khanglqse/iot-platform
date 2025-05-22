import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface SensorData {
  device_id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  light_level: number;
  soil_moisture?: number;
  location: string;
  type: string;
  stats?: {
    temperature: {
      min: number;
      max: number;
      avg: number;
    };
    humidity: {
      min: number;
      max: number;
      avg: number;
    };
    light_level: {
      min: number;
      max: number;
      avg: number;
    };
    soil_moisture: {
      min: number;
      max: number;
      avg: number;
    };
    battery: {
      min: number;
      max: number;
      avg: number;
    };
    record_count: number;
  };
}

export interface LocationData {
  location: string;
  sensors: SensorData[];
}

export interface SensorResponse {
  locations: LocationData[];
}

const sensorService = {
  async getAllSensors(): Promise<SensorResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sensors`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sensors:', error);
      throw error;
    }
  },

  async getSensorsByLocation(location: string): Promise<SensorData[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sensors/location/${location}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching sensors for location ${location}:`, error);
      throw error;
    }
  },

  async getSensorById(deviceId: string): Promise<SensorData> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sensors/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching sensor ${deviceId}:`, error);
      throw error;
    }
  },

  async getSensorHistory(deviceId: string, startTime?: Date, endTime?: Date): Promise<SensorData[]> {
    try {
      let url = `${API_BASE_URL}/sensors/${deviceId}/history`;
      
      const params: Record<string, string> = {};
      if (startTime) {
        params.start_time = startTime.toISOString();
      }
      if (endTime) {
        params.end_time = endTime.toISOString();
      }
      
      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching history for sensor ${deviceId}:`, error);
      throw error;
    }
  }
};

export default sensorService;