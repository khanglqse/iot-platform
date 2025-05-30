import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://35.186.151.185:8000';

export interface Trigger {
  id: string;
  sensor_device_id: string;
  sensor_type: string;
  condition: string;
  threshold: number;
  action: string;
  target_device_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTriggerDto {
  sensor_device_id: string;
  sensor_type: string;
  condition: string;
  threshold: number;
  action: string;
  target_device_id: string;
  is_active?: boolean;
}

export interface UpdateTriggerDto {
  sensor_device_id?: string;
  sensor_type?: string;
  condition?: string;
  threshold?: number;
  action?: string;
  target_device_id?: string;
  is_active?: boolean;
}

export const getTriggers = async (): Promise<Trigger[]> => {
  const response = await axios.get(`${API_BASE_URL}/triggers`);
  return response.data;
};

export const getTrigger = async (id: string): Promise<Trigger> => {
  const response = await axios.get(`${API_BASE_URL}/triggers/${id}`);
  return response.data;
};

export const createTrigger = async (trigger: CreateTriggerDto): Promise<Trigger> => {
  const response = await axios.post(`${API_BASE_URL}/triggers`, trigger);
  return response.data;
};

export const updateTrigger = async (id: string, trigger: UpdateTriggerDto): Promise<Trigger> => {
  const response = await axios.put(`${API_BASE_URL}/triggers/${id}`, trigger);
  return response.data;
};

export const deleteTrigger = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/triggers/${id}`);
}; 