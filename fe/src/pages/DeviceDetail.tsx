import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Tabs, Typography, Layout, Space, message, Spin, Alert, Table } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Device, ACDevice, LightDevice, DoorDevice, SpeakerDevice } from '../types/devices';
import ACControl from '../components/device-controls/ACControl';
import LightControl from '../components/device-controls/LightControl';
import DoorControl from '../components/device-controls/DoorControl';
import SpeakerControl from '../components/device-controls/SpeakerControl';
import TimerControl from '../components/device-controls/TimerControl';
import { getDeviceStatus, updateDeviceStatus, getDeviceLogs, DeviceLog } from '../services/deviceService';

const { Title } = Typography;
const { Header, Content } = Layout;

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('control');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

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

  const fetchDeviceLogs = async (page: number = 1, pageSize: number = 10) => {
    if (!id) return;
    
    try {
      setLogsLoading(true);
      const response = await getDeviceLogs(id, page, pageSize);
      
      if (response.status === 'success') {
        setLogs(response.data.logs);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: response.data.pagination.total
        });
      }
    } catch (err) {
      message.error('Không thể tải lịch sử hoạt động');
      console.error('Error fetching device logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'control' || activeTab === 'timer') {
      fetchDeviceDetails();
    } else if (activeTab === 'history') {
      fetchDeviceLogs(pagination.current, pagination.pageSize);
    }
  }, [activeTab]);

  const handleDeviceUpdate = async (updates: Partial<Device>) => {
    if (!device || !id) return;
    
    try {
      await updateDeviceStatus(id, updates);
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

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
      sorter: (a: DeviceLog, b: DeviceLog) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={
          action.includes('on') ? 'green' : 
          action.includes('off') ? 'red' :
          action.includes('update') ? 'blue' : 'default'
        }>
          {action}
        </Tag>
      ),
    },
    {
      title: 'Chi tiết',
      dataIndex: 'details',
      key: 'details',
      render: (details: any) => (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(details, null, 2)}
        </pre>
      ),
    },
  ];

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

  const items = [
    {
      key: 'control',
      label: 'Điều khiển',
      children: (
        <Spin spinning={loading && activeTab === 'control'}>
          {renderDeviceControl()}
        </Spin>
      ),
    },
    {
      key: 'timer',
      label: 'Hẹn giờ',
      children: (
        <Spin spinning={loading && activeTab === 'timer'}>
          {device && <TimerControl device={device} onUpdate={handleDeviceUpdate} />}
        </Spin>
      ),
    },
    {
      key: 'history',
      label: 'Lịch sử hoạt động',
      children: (
        <div>
          <Spin spinning={logsLoading}>
            <Table
              columns={columns}
              dataSource={logs}
              rowKey="timestamp"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page, pageSize) => fetchDeviceLogs(page, pageSize),
                showSizeChanger: true,
                showTotal: (total) => `Tổng số ${total} bản ghi`,
              }}
              scroll={{ x: true }}
            />
          </Spin>
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
          <Title level={3} style={{ margin: '16px 0' }}>
            {device ? device.name : 'Loading...'}
          </Title>
        </Space>
      </Header>
      <Layout style={{ padding: '24px' }}>
        <Content>
          <Card>
            {device && (
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
            )}

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
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