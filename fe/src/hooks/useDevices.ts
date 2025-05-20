import { useState, useEffect } from 'react';
import sensorDeviceService, { SensorDevice } from '../services/sensorDeviceService';
import { getAllDevices } from '../services/deviceService';
import { Device } from '../types/devices';
export const useDevices = () => {
  const [sensorDevices, setSensorDevices] = useState<SensorDevice[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sensorDevicesData, devicesData] = await Promise.all([
          sensorDeviceService.getAllSensorDevices(),
          getAllDevices()
        ]);
        setSensorDevices(sensorDevicesData);
        setDevices(devicesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { sensorDevices, devices, loading, error };
}; 