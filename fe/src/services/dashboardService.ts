import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface DashboardOverview {
  total_devices: number;
  device_types: { [key: string]: number };
  active_timers: number;
  recent_activities: Array<{
    device_id: string;
    timestamp: string;
    action: string;
    details: any;
  }>;
}

export interface DeviceStatus {
  id: string;
  type: string;
  name: string;
  location: string;
  timestamp: string;
  [key: string]: any;
}

export interface AnalyticsData {
  activity_counts: { [key: string]: number };
  timer_stats: {
    total: number;
    active: number;
    executions: number;
  };
  device_types: { [key: string]: number };
  period: {
    start: string;
    end: string;
  };
}

export interface DeviceHistory {
  status_history: Array<DeviceStatus>;
  activity_logs: Array<{
    device_id: string;
    timestamp: string;
    action: string;
    details: any;
  }>;
  period: {
    start: string;
    end: string;
  };
}

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const response = await axios.get(`${API_BASE_URL}/dashboard/overview`);
  return response.data;
};

export const getDeviceStatusDashboard = async (): Promise<DeviceStatus[]> => {
  const response = await axios.get(`${API_BASE_URL}/dashboard/device-status`);
  return response.data;
};

export const getDashboardAnalytics = async (
  startDate?: Date,
  endDate?: Date
): Promise<AnalyticsData> => {
  const params = new URLSearchParams();
  if (startDate) {
    params.append('start_date', startDate.toISOString());
  }
  if (endDate) {
    params.append('end_date', endDate.toISOString());
  }
  
  const response = await axios.get(`${API_BASE_URL}/dashboard/analytics?${params.toString()}`);
  return response.data;
};

export const getDeviceHistory = async (
  deviceId: string,
  startDate?: Date,
  endDate?: Date
): Promise<DeviceHistory> => {
  const params = new URLSearchParams();
  if (startDate) {
    params.append('start_date', startDate.toISOString());
  }
  if (endDate) {
    params.append('end_date', endDate.toISOString());
  }
  
  const response = await axios.get(`${API_BASE_URL}/dashboard/device/${deviceId}/history?${params.toString()}`);
  return response.data;
}; 