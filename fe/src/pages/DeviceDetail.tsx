import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Tabs, Typography, Layout, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Device, ACDevice, LightDevice, DoorDevice, SpeakerDevice, TimerDevice } from '../types/devices';
import ACControl from '../components/device-controls/ACControl';
import LightControl from '../components/device-controls/LightControl';
import DoorControl from '../components/device-controls/DoorControl';
import SpeakerControl from '../components/device-controls/SpeakerControl';
import TimerControl from '../components/device-controls/TimerControl';

const { Title } = Typography;
const { Header, Content } = Layout;

interface DeviceLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

// Mock data for different device types
const mockDevices: { [key: string]: Device } = {
  '1': {
    id: '1',
    name: 'Điều hòa phòng khách',
    type: 'AC',
    status: 'online',
    location: 'Phòng khách',
    lastSeen: new Date().toISOString(),
    temperature: 25,
    mode: 'cool',
    fanSpeed: 'auto',
    isOn: true
  },
  '2': {
    id: '2',
    name: 'Đèn phòng ngủ',
    type: 'LIGHT',
    status: 'online',
    location: 'Phòng ngủ',
    lastSeen: new Date().toISOString(),
    brightness: 80,
    color: '#ffffff',
    isOn: true
  },
  '3': {
    id: '3',
    name: 'Cửa chính',
    type: 'DOOR',
    status: 'online',
    location: 'Cửa ra vào',
    lastSeen: new Date().toISOString(),
    isLocked: true,
    isOpen: false
  },
  '4': {
    id: '4',
    name: 'Loa phòng khách',
    type: 'SPEAKER',
    status: 'online',
    location: 'Phòng khách',
    lastSeen: new Date().toISOString(),
    volume: 50,
    isPlaying: false,
    currentTrack: 'Chưa phát nhạc'
  },
  '5': {
    id: '5',
    name: 'Điều hòa phòng ngủ',
    type: 'AC',
    status: 'offline',
    location: 'Phòng ngủ',
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
    temperature: 26,
    mode: 'heat',
    fanSpeed: 'medium',
    isOn: false
  },
  '6': {
    id: '6',
    name: 'Đèn ban công',
    type: 'LIGHT',
    status: 'online',
    location: 'Ban công',
    lastSeen: new Date().toISOString(),
    brightness: 100,
    color: '#ffeb3b',
    isOn: true
  },
  '7': {
    id: '7',
    name: 'Cửa sau',
    type: 'DOOR',
    status: 'online',
    location: 'Cửa sau',
    lastSeen: new Date().toISOString(),
    isLocked: false,
    isOpen: true
  },
  '8': {
    id: '8',
    name: 'Loa phòng ngủ',
    type: 'SPEAKER',
    status: 'offline',
    location: 'Phòng ngủ',
    lastSeen: new Date(Date.now() - 7200000).toISOString(),
    volume: 30,
    isPlaying: false
  }
};

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<DeviceLog[]>([]);

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchDeviceDetails = async () => {
      setLoading(true);
      try {
        // Get device from mock data
        const deviceId = id || '1';
        const mockDevice = mockDevices[deviceId];
        
        if (!mockDevice) {
          throw new Error('Device not found');
        }

        setDevice(mockDevice);

        // Mock logs based on device type
        const mockLogs: DeviceLog[] = [
          {
            id: '1',
            timestamp: new Date().toISOString(),
            action: 'Bật thiết bị',
            details: 'Thiết bị được bật lúc 10:00'
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            action: 'Điều chỉnh cài đặt',
            details: mockDevice.type === 'AC' 
              ? 'Nhiệt độ được điều chỉnh xuống 25°C'
              : mockDevice.type === 'LIGHT'
              ? 'Độ sáng được điều chỉnh lên 80%'
              : mockDevice.type === 'DOOR'
              ? 'Cửa được khóa'
              : 'Âm lượng được điều chỉnh lên 50%'
          }
        ];
        setLogs(mockLogs);
      } catch (error) {
        console.error('Error fetching device details:', error);
      }
      setLoading(false);
    };

    fetchDeviceDetails();
  }, [id]);

  const handleDeviceUpdate = (updates: Partial<Device>) => {
    if (!device) return;
    
    // Preserve the device type when updating
    const updatedDevice = {
      ...device,
      ...updates,
      type: device.type
    } as Device;
    
    setDevice(updatedDevice);
    // TODO: Add API call to update device
  };

  const renderDeviceControl = () => {
    if (!device) return null;

    switch (device.type) {
      case 'AC':
        return <ACControl device={device as ACDevice} onUpdate={handleDeviceUpdate} />;
      case 'LIGHT':
        return <LightControl device={device as LightDevice} onUpdate={handleDeviceUpdate} />;
      case 'DOOR':
        return <DoorControl device={device as DoorDevice} onUpdate={handleDeviceUpdate} />;
      case 'SPEAKER':
        return <SpeakerControl device={device as SpeakerDevice} onUpdate={handleDeviceUpdate} />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!device) {
    return <div>Device not found</div>;
  }

  const items = [
    {
      key: 'control',
      label: 'Điều khiển',
      children: renderDeviceControl(),
    },
    {
      key: 'timer',
      label: 'Hẹn giờ',
      children: device.type === 'TIMER' ? (
        <TimerControl device={device as TimerDevice} onUpdate={handleDeviceUpdate} />
      ) : (
        <div>Chức năng hẹn giờ không khả dụng cho loại thiết bị này</div>
      ),
    },
    {
      key: 'history',
      label: 'Lịch sử hoạt động',
      children: (
        <div>
          {logs.map(log => (
            <Card key={log.id} style={{ marginBottom: 16 }}>
              <p><strong>Thời gian:</strong> {new Date(log.timestamp).toLocaleString()}</p>
              <p><strong>Hành động:</strong> {log.action}</p>
              <p><strong>Chi tiết:</strong> {log.details}</p>
            </Card>
          ))}
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/devices')}
          >
            Quay lại
          </Button>
          <Title level={3} style={{ margin: '16px 0' }}>{device.name}</Title>
        </Space>
      </Header>
      <Layout style={{ padding: '24px' }}>
        <Content>
          <Card>
            <Descriptions title="Thông tin thiết bị" bordered>
              <Descriptions.Item label="Tên thiết bị">{device.name}</Descriptions.Item>
              <Descriptions.Item label="Loại thiết bị">{device.type}</Descriptions.Item>
              <Descriptions.Item label="Vị trí">{device.location}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={device.status === 'online' ? 'green' : 'red'}>
                  {device.status === 'online' ? 'Hoạt động' : 'Mất kết nối'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Lần cuối hoạt động">
                {new Date(device.lastSeen).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              defaultActiveKey="control"
              items={items}
              style={{ marginTop: 24 }}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DeviceDetail; 