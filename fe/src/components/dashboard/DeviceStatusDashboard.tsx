import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin, Tag, Space } from 'antd';
import { getDeviceStatusDashboard } from '../../services/dashboardService';
import type { DeviceStatus } from '../../services/dashboardService';
import { formatDistanceToNow } from 'date-fns';
import { Gauge } from '@ant-design/charts';

const { Title, Text } = Typography;

const getStatusColor = (type: string, value: any): string => {
  switch (type) {
    case 'LIGHT':
      return value?.brightness > 0 ? 'green' : 'red';
    case 'FAN':
      return value?.speed > 0 ? 'green' : 'red';
    case 'AC':
      return value?.temperature ? 'green' : 'red';
    case 'SPEAKER':
      return value?.volume > 0 ? 'green' : 'red';
    case 'DOOR':
      return value?.lock_action === 'unlock' ? 'green' : 'red';
    default:
      return 'default';
  }
};

const getStatusValue = (device: DeviceStatus): number => {
  switch (device.type) {
    case 'LIGHT':
      return device.brightness || 0;
    case 'FAN':
      return (device.speed || 0) * 33.33; // Convert 0-3 to 0-100
    case 'AC':
      return ((device.temperature || 16) - 16) * 7.14; // Convert 16-30 to 0-100
    case 'SPEAKER':
      return device.volume || 0;
    case 'DOOR':
      return device.lock_action === 'unlock' ? 100 : 0;
    default:
      return 0;
  }
};

const getStatusText = (device: DeviceStatus): string => {
  switch (device.type) {
    case 'LIGHT':
      return `Brightness: ${device.brightness || 0}%`;
    case 'FAN':
      return `Speed: ${device.speed || 0}`;
    case 'AC':
      return `Temperature: ${device.temperature || '--'}°C`;
    case 'SPEAKER':
      return `Volume: ${device.volume || 0}%`;
    case 'DOOR':
      return `Status: ${device.lock_action || 'Unknown'}`;
    default:
      return 'Status: Unknown';
  }
};

const DeviceStatusDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<DeviceStatus[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDeviceStatusDashboard();
        setDevices(data);
      } catch (error) {
        console.error('Error fetching device status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Device Status</Title>
      
      <Row gutter={[16, 16]}>
        {devices.map(device => (
          <Col xs={24} sm={12} lg={8} key={device.id}>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={4}>{device.name}</Title>
                  <Tag color={getStatusColor(device.type, device)}>
                    {device.type}
                  </Tag>
                </div>
                
                <Text type="secondary">Location: {device.location}</Text>
                
                <div style={{ height: 150 }}>
                  <Gauge 
                    {...{
                      percent: getStatusValue(device) / 100,
                      range: {
                        color: ['l(0) 0:#FF0000 1:#00FF00'],
                      },
                      indicator: {
                        pointer: {
                          style: {
                            stroke: '#D0D0D0',
                          },
                        },
                        pin: {
                          style: {
                            stroke: '#D0D0D0',
                          },
                        },
                      },
                      statistic: {
                        content: {
                          formatter: () => getStatusText(device),
                          style: {
                            fontSize: '14px',
                          },
                        },
                      },
                    }}
                  />
                </div>
                
                <Text type="secondary">
                  Last updated: {formatDistanceToNow(new Date(device.timestamp))} ago
                </Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DeviceStatusDashboard; 