export type DeviceType = 'FAN' | 'AC' | 'SPEAKER' | 'LIGHT' | 'DOOR';

export interface BaseDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: 'online' | 'offline';
  location: string;
  lastSeen: string;
}

export interface Fan extends BaseDevice {
  type: 'FAN';
  speed: number;
  mode: 'normal' | 'natural' | 'sleep';
}

export interface AirConditioner extends BaseDevice {
  type: 'AC';
  temperature: number;
  mode: 'cool' | 'heat' | 'fan' | 'dry' | 'auto';
}

export interface Speaker extends BaseDevice {
  type: 'SPEAKER';
  volume: number;
  isPlaying: boolean;
  currentTrack?: string;
}

export interface Light extends BaseDevice {
  type: 'LIGHT';
  brightness: number;
  color: string;
  isOn: boolean;
}

export interface Door extends BaseDevice {
  type: 'DOOR';
  isLocked: boolean;
  autoLock: boolean;
}

export type Device = Fan | AirConditioner | Speaker | Light | Door; 