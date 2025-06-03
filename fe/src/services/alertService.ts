import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface Alert {
  id: string;
  location: string;
  sensor_type: string;
  value: number;
  timestamp: string;
  status: string;
  message: string;
}

export interface PaginatedResponse {
  items: Alert[];
  total: number;
  skip: number;
  limit: number;
}

export const getAllAlerts = async (skip: number = 0, limit: number = 50): Promise<PaginatedResponse> => {
  const response = await axios.get(`${API_BASE_URL}/alerts`, {
    params: { skip, limit }
  });
  return response.data;
};

export const getAlertById = async (id: string): Promise<Alert> => {
  const response = await axios.get(`${API_BASE_URL}/alerts/${id}`);
  return response.data;
};

export const createAlert = async (alert: Omit<Alert, 'id'>): Promise<Alert> => {
  const response = await axios.post(`${API_BASE_URL}/alerts`, alert);
  return response.data;
};

export const deleteAlert = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/alerts/${id}`);
}; 