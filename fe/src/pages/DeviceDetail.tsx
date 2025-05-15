import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Tabs, Typography, Layout, Space, message, Spin, Alert } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Device, ACDevice, LightDevice, DoorDevice, SpeakerDevice } from '../types/devices';
import ACControl from '../components/device-controls/ACControl';
import LightControl from '../components/device-controls/LightControl';
import DoorControl from '../components/device-controls/DoorControl';
import SpeakerControl from '../components/device-controls/SpeakerControl';
import TimerControl from '../components/device-controls/TimerControl';
import { getDeviceStatus, updateDeviceStatus } from '../services/deviceService';

const { Title } = Typography;
const { Header, Content } = Layout;

interface DeviceLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<DeviceLog[]>([]);

  const fetchDeviceDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const deviceData = await getDeviceStatus(id);
      setDevice(deviceData);
      setError(null);
    } catch (err) {
      setError('Không thể tải thông tin thiết bị');
      message.error('Không thể tải thông tin thiết bị');
      console.error('Error fetching device details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceDetails();
    
    // Set up polling for device status updates
    const intervalId = setInterval(fetchDeviceDetails, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [id]);

  const handleDeviceUpdate = async (updates: Partial<Device>) => {
    if (!device || !id) return;
    
    try {
      await updateDeviceStatus(id, updates);
      // Merge updates with current device state
      setDevice(prevDevice => {
        if (!prevDevice) return null;
        return {
          ...prevDevice,
          ...updates,
          lastSeen: new Date().toISOString()
        } as Device;
      });
      message.success('Cập nhật thiết bị thành công');
    } catch (err) {
      message.error('Không thể cập nhật thiết bị');
      console.error('Error updating device:', err);
    }
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
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi"
        description={error}
        type="error"
        showIcon
        action={
          <Button type="primary" onClick={fetchDeviceDetails}>
            Thử lại
          </Button>
        }
      />
    );
  }

  if (!device) {
    return (
      <Alert
        message="Không tìm thấy thiết bị"
        description="Thiết bị bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."
        type="warning"
        showIcon
        action={
          <Button type="primary" onClick={() => navigate('/devices')}>
            Quay lại danh sách thiết bị
          </Button>
        }
      />
    );
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
      children: <TimerControl device={device} onUpdate={handleDeviceUpdate} />,
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