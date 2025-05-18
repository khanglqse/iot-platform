import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Typography, Spin } from 'antd';
import { DashboardOutlined, ClockCircleOutlined, AppstoreOutlined, FieldTimeOutlined } from '@ant-design/icons';
import { getDashboardOverview } from '../../services/dashboardService';
import type { DashboardOverview } from '../../services/dashboardService';
import { formatDistanceToNow } from 'date-fns';
import { Pie, Line } from '@ant-design/charts';

const { Title } = Typography;

const OverviewDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const overview = await getDashboardOverview();
        setData(overview);
      } catch (error) {
        console.error('Error fetching dashboard overview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDeviceTypeChartData = () => {
    if (!data) return [];
    return Object.entries(data.device_types).map(([type, count]) => ({
      type,
      value: count
    }));
  };

  const pieConfig = {
    data: getDeviceTypeChartData(),
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}'
    },
    interactions: [
      {
        type: 'element-active'
      }
    ]
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return <div>Error loading dashboard data</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Dashboard Overview</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Devices"
              value={data.total_devices}
              prefix={<DashboardOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Timers"
              value={data.active_timers}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Device Types">
            <div style={{ height: 200 }}>
              <Pie {...pieConfig} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="Recent Activities">
            <List
              dataSource={data.recent_activities}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<FieldTimeOutlined />}
                    title={`${item.action} - Device ${item.device_id}`}
                    description={`${formatDistanceToNow(new Date(item.timestamp))} ago`}
                  />
                  <div>
                    {Object.entries(item.details).map(([key, value]) => (
                      <div key={key}>{`${key}: ${value}`}</div>
                    ))}
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OverviewDashboard; 