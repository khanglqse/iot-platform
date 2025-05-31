import React, { useState, useEffect, useRef } from 'react';
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

// Define types for sensor data
interface SensorData {
  location: string;
  timestamp: string;
  sensors: {
    [key: string]: number;
  };
}

interface Alert {
  location: string;
  sensor_type: string;
  value: number;
  timestamp: string;
  status: string;
}

// Define thresholds
const THRESHOLDS: { [key: string]: number } = {
  displacement: 20.0,
  tilt: 3.0,
  vibration: 0.5,
  pore_pressure: 150,
  crack_width: 2.0
};

// Maximum number of data points to show in charts
const MAX_DATA_POINTS = 50;

// Colors for different sensor types
const SENSOR_COLORS: { [key: string]: string } = {
  displacement: '#1890ff',
  tilt: '#52c41a',
  vibration: '#722ed1',
  pore_pressure: '#fa8c16',
  crack_width: '#eb2f96'
};

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
  const [realtimeData, setRealtimeData] = useState<SensorData | null>(null);
  const [realtimeAlerts, setRealtimeAlerts] = useState<Alert[]>([]);
  const [sensorHistory, setSensorHistory] = useState<{
    timestamp: string;
    type: string;
    value: number;
  }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  useEffect(() => {
    // Connect to WebSocket
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8765';
    console.log(`🔌 Connecting to WebSocket at ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket Connected');
    };

    ws.onmessage = (event) => {
      console.log('📥 Received WebSocket message:', event.data);
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'sensor_data') {
          setRealtimeData(message.data);
          
          // Update sensor history
          const newDataPoints = Object.entries(message.data.sensors).map(([type, value]) => ({
            timestamp: message.data.timestamp,
            type,
            value: value as number
          }));

          setSensorHistory(prev => {
            const updated = [...prev, ...newDataPoints];
            // Keep only the last MAX_DATA_POINTS for each sensor type
            const groupedByType = updated.reduce((acc, curr) => {
              if (!acc[curr.type]) {
                acc[curr.type] = [];
              }
              acc[curr.type].push(curr);
              return acc;
            }, {} as { [key: string]: typeof newDataPoints });

            const trimmed = Object.values(groupedByType).flatMap(points => 
              points.slice(-MAX_DATA_POINTS)
            );

            return trimmed.sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });

          if (message.alerts && message.alerts.length > 0) {
            setRealtimeAlerts(prev => [...message.alerts, ...prev].slice(0, 10));
          }
        } else if (message.type === 'connection_status') {
          console.log('📡 Connection status:', message);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = (event) => {
      console.log('🔌 WebSocket Disconnected:', event.code, event.reason);
    };

    return () => {
      if (wsRef.current) {
        console.log('🔌 Closing WebSocket connection');
        wsRef.current.close();
      }
    };
  }, []);

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

      {/* Real-time Data Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title="Recent Alerts" bordered={false} style={{ borderRadius: '8px' }}>
            {realtimeAlerts.length > 0 ? (
              <div>
                {realtimeAlerts.map((alert, index) => (
                  <Alert
                    key={index}
                    message={`${alert.sensor_type} Alert`}
                    description={`Location: ${alert.location}, Value: ${alert.value}`}
                    type="error"
                    showIcon
                    style={{ marginBottom: '8px' }}
                  />
                ))}
              </div>
            ) : (
              <p>No recent alerts</p>
            )}
          </Card>
        </Col>
      </Row>

      {/* Real-time Charts */}
      <Row gutter={[16, 16]}>
        {Object.entries(THRESHOLDS).map(([type, threshold]) => (
          <Col xs={24} md={12} key={type}>
            <Card title={`${type} Trend`} bordered={false} style={{ borderRadius: '8px' }}>
              <Line
                data={sensorHistory.filter(point => point.type === type)}
                xField="timestamp"
                yField="value"
                smooth
                animation={false}
                point={{
                  size: 4,
                  shape: 'circle',
                }}
                meta={{
                  timestamp: {
                    alias: 'Time',
                    formatter: (value) => new Date(value).toLocaleTimeString(),
                  },
                  value: {
                    alias: 'Value',
                  },
                }}
                xAxis={{
                  type: 'time',
                  tickCount: 5,
                }}
                yAxis={{
                  title: {
                    text: 'Value',
                  },
                }}
                tooltip={{
                  formatter: (datum) => {
                    return {
                      name: type,
                      value: datum.value.toFixed(2),
                      time: new Date(datum.timestamp).toLocaleString(),
                    };
                  },
                }}
                color={SENSOR_COLORS[type]}
                annotations={[
                  {
                    type: 'line',
                    start: ['min', threshold],
                    end: ['max', threshold],
                    style: {
                      stroke: SENSOR_COLORS[type],
                      lineDash: [4, 4],
                    },
                    text: {
                      content: 'Threshold',
                      position: 'start',
                      style: {
                        fill: SENSOR_COLORS[type],
                      },
                    },
                  },
                ]}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Dashboard;
