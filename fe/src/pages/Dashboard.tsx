import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, Spin, Alert, Typography, Divider } from 'antd';
import { 
  DashboardOutlined, 
  AppstoreOutlined, 
  ClockCircleOutlined, 
  HistoryOutlined 
} from '@ant-design/icons';
import { Line, Pie, Column } from '@ant-design/plots';
import { 
  getDashboardOverview, 
  getDeviceStatusDashboard, 
  getDashboardAnalytics,
  DashboardOverview,
  DeviceStatus,
  AnalyticsData
} from '../services/dashboardService';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(new Date().setDate(new Date().getDate() - 7)),
    new Date()
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, deviceStatusData] = await Promise.all([
        getDashboardOverview(),
        getDeviceStatusDashboard()
      ]);
      setOverview(overviewData);
      setDeviceStatus(deviceStatusData);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      if (!dateRange) return;
      
      const analyticsData = await getDashboardAnalytics(dateRange[0], dateRange[1]);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    }
  };

  const handleDateRangeChange: RangePickerProps['onChange'] = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0].toDate(), dates[1].toDate()]);
    }
  };

  // Format device type data for pie chart
  const formatDeviceTypeData = () => {
    if (!overview?.device_types) return [];
    
    return Object.entries(overview.device_types).map(([type, count]) => ({
      type,
      count
    }));
  };

  // Format activity data for column chart
  const formatActivityData = () => {
    if (!analytics?.activity_counts) return [];
    
    return Object.entries(analytics.activity_counts).map(([deviceId, count]) => ({
      device: deviceId,
      activities: count
    }));
  };

  const recentActivitiesColumns = [
    {
      title: 'Device ID',
      dataIndex: 'device_id',
      key: 'device_id',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString()
    }
  ];

  const deviceStatusColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => (
        <span style={{ 
          color: text === 'online' ? '#52c41a' : 
                 text === 'offline' ? '#f5222d' : 
                 '#faad14' 
        }}>
          {text.toUpperCase()}
        </span>
      )
    },
    {
      title: 'Last Updated',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString()
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  return (
    <div className="dashboard-container" style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Card bordered={false} style={{ marginBottom: 24, borderRadius: '8px' }}>
        <Title level={2}>IoT System Dashboard</Title>
      </Card>

      {/* Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={8}>
          <Card bordered={false} style={{ borderRadius: '8px' }}>
            <Statistic
              title="Total Devices"
              value={overview?.total_devices || 0}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={8}>
          <Card bordered={false} style={{ borderRadius: '8px' }}>
            <Statistic
              title="Active Timers"
              value={overview?.active_timers || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={8}>
          <Card bordered={false} style={{ borderRadius: '8px' }}>
            <Statistic
              title="Recent Activities"
              value={overview?.recent_activities.length || 0}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Device Types Pie Chart */}
        <Col xs={24} sm={24} md={12}>
          <Card title="Device Types Distribution" bordered={false} style={{ borderRadius: '8px' }}>
            {overview && (
              <Pie
                data={formatDeviceTypeData()}
                angleField="count"
                colorField="type"
                radius={0.8}
                label={{
                  type: 'outer',
                  content: '{name} {percentage}'
                }}
                interactions={[{ type: 'element-active' }]}
              />
            )}
          </Card>
        </Col>

        {/* Activity Chart */}
        <Col xs={24} sm={24} md={12}>
          <Card 
            title="Device Activities" 
            bordered={false} 
            style={{ borderRadius: '8px' }}
            extra={
              <RangePicker 
                defaultValue={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
                onChange={handleDateRangeChange}
              />
            }
          >
            {analytics && (
              <Column
                data={formatActivityData()}
                xField="device"
                yField="activities"
                label={{
                  position: 'middle',
                  style: {
                    fill: '#FFFFFF',
                    opacity: 0.6,
                  },
                }}
                meta={{
                  device: {
                    alias: 'Device ID',
                  },
                  activities: {
                    alias: 'Activity Count',
                  },
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Device Status Table */}
        <Col xs={24} md={12}>
          <Card title="Device Status" bordered={false} style={{ borderRadius: '8px' }}>
            <Table 
              dataSource={deviceStatus} 
              columns={deviceStatusColumns} 
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>

        {/* Recent Activities Table */}
        <Col xs={24} md={12}>
          <Card title="Recent Activities" bordered={false} style={{ borderRadius: '8px' }}>
            <Table 
              dataSource={overview?.recent_activities || []} 
              columns={recentActivitiesColumns}
              rowKey={(record) => `${record.device_id}-${record.timestamp}`}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
