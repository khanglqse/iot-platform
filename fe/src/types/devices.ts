export type DeviceType = 'FAN' | 'AC' | 'SPEAKER' | 'LIGHT' | 'DOOR';

export type DeviceStatus = 'online' | 'offline';
export type FanMode = 'normal' | 'natural' | 'sleep';
export type ACMode = 'cool' | 'heat' | 'fan' | 'dry' | 'auto';
export type FanSpeed = 0 | 1 | 2 | 3 | 'auto';
export type ACSpeed = 0 | 1 | 2 | 3 | 'auto';
export type SpeakerAction = 'play' | 'pause' | 'stop';
export type DoorAction = 'lock' | 'unlock';

export interface Schedule {
  time: string;
  action: string;
}

export interface BaseDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location: string;
  lastSeen: string;
  isOn: boolean;
  schedule?: Schedule[];
  noTimer: boolean 
}

export interface FanDevice extends BaseDevice {
  type: 'FAN';
  speed: FanSpeed;
  mode: FanMode;
}

export interface ACDevice extends BaseDevice {
  type: 'AC';
  temperature: number; // 16-30
  fanSpeed: ACSpeed;
  mode: ACMode;
}

export interface SpeakerDevice extends BaseDevice {
  type: 'SPEAKER';
  volume: number; // 0-100
  isPlaying: boolean;
  currentTrack?: string;
}

export interface LightDevice extends BaseDevice {
  type: 'LIGHT';
  brightness: number; // 0-100
  color: string;
}

export interface DoorDevice extends BaseDevice {
  type: 'DOOR';
  isLocked: boolean;
  autoLock: boolean;
}

export type Device = FanDevice | ACDevice | SpeakerDevice | LightDevice | DoorDevice; 