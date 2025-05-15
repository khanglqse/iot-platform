import React, { useEffect, useState } from 'react';
import { Device, DeviceType } from '../types/devices';
import { getAllDevices } from '../services/deviceService';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Tag, Space, Typography, Layout, Spin, Alert } from 'antd';
import {
  DesktopOutlined,
  BulbOutlined,
  SoundOutlined,
  LockOutlined,
  ApiOutlined,
  PoweroffOutlined
} from '@ant-design/icons';

const { Title } = Typography;
const { Content } = Layout;

const DeviceManagement: React.FC = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await getAllDevices();
      setDevices(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch devices');
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'AC':
        return <DesktopOutlined />;
      case 'LIGHT':
        return <BulbOutlined />;
      case 'SPEAKER':
        return <SoundOutlined />;
      case 'DOOR':
        return <LockOutlined />;
      case 'FAN':
        return <ApiOutlined />;
      default:
        return null;
    }
  };

  const getDeviceStatus = (device: Device) => {
    return (
      <Space>
        <Tag color={device.isOn ? 'success' : 'default'} icon={<PoweroffOutlined />}>
          {device.isOn ? 'ON' : 'OFF'}
        </Tag>
        <Tag color={device.status === 'online' ? 'success' : 'error'}>
          {device.status === 'online' ? 'Online' : 'Offline'}
        </Tag>
      </Space>
    );
  };

  const getDeviceDetails = (device: Device) => {
    switch (device.type) {
      case 'FAN':
        return `Speed: ${device.speed}, Mode: ${device.mode}`;
      case 'AC':
        return `Temp: ${device.temperature}°C, Mode: ${device.mode}, Fan: ${device.fanSpeed}`;
      case 'SPEAKER':
        return `Volume: ${device.volume}%, ${device.isPlaying ? 'Playing' : 'Stopped'}`;
      case 'LIGHT':
        return `Brightness: ${device.brightness}%, Color: ${device.color}`;
      case 'DOOR':
        return `${device.isLocked ? 'Locked' : 'Unlocked'}, Auto-lock: ${device.autoLock ? 'ON' : 'OFF'}`;
      default:
        return '';
    }
  };

  const columns = [
    {
      title: 'Thiết bị',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Device) => (
        <Space>
          {getDeviceIcon(record.type)}
          <a onClick={() => navigate(`/devices/${record.id}`)}>{text}</a>
        </Space>
      ),
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: Device) => getDeviceStatus(record),
    },
    {
      title: 'Chi tiết',
      key: 'details',
      render: (_: unknown, record: Device) => getDeviceDetails(record),
    },
    {
      title: 'Lần cuối hoạt động',
      dataIndex: 'lastSeen',
      key: 'lastSeen',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <Title level={2}>Quản lý thiết bị</Title>
        <Card>
          <Table
            columns={columns}
            dataSource={devices}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default DeviceManagement; 