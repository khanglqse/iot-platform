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

// Update the Alert interface to match the WebSocket message format
interface Alert {
  location: string;
  sensor_type: string;
  value: number;
  timestamp: string;
  status: string;
  message: string;
}

// Add new interface for grouped sensor data
interface GroupedSensorData {
  [sensorType: string]: {
    [location: string]: {
      timestamp: string;
      value: number;
    }[];
  };
}

// Define thresholds
const THRESHOLDS: { [key: string]: number } = {
  "displacement": 29.0,
    "tilt": 4.8,
    "vibration": 0.65,
    "pore_pressure": 168,
    "crack_width": 2.3
};


// Maximum number of data points to show in charts
const MAX_DATA_POINTS = 100;

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
  const [groupedSensorData, setGroupedSensorData] = useState<GroupedSensorData>({});
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
          
          // Update grouped sensor data
          setGroupedSensorData(prev => {
            const newData = { ...prev };
            const { location, timestamp, sensors } = message.data;

            // Update each sensor type
            Object.entries(sensors).forEach(([sensorType, value]) => {
              if (!newData[sensorType]) {
                newData[sensorType] = {};
              }
              if (!newData[sensorType][location]) {
                newData[sensorType][location] = [];
              }

              // Add new data point
              newData[sensorType][location].push({
                timestamp,
                value: value as number
              });

              // Keep only the last MAX_DATA_POINTS
              if (newData[sensorType][location].length > MAX_DATA_POINTS) {
                newData[sensorType][location] = newData[sensorType][location].slice(-MAX_DATA_POINTS);
              }
            });

            return newData;
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

  // Add new function to format data for sensor type charts
  const formatSensorTypeData = (sensorType: string) => {
    const sensorData = groupedSensorData[sensorType];
    if (!sensorData) return [];

    return Object.entries(sensorData).flatMap(([location, data]) =>
      data.map(point => ({
        timestamp: point.timestamp,
        value: point.value,
        location
      }))
    );
  };

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
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
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
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
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

      {/* Device Status and Recent Activities */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
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


      {/* Real-time Sensor Charts */}
      <Row gutter={[16, 16]}>
      <Col xs={24} md={12} >
          <Card title="Recent Alerts" bordered={false} style={{ borderRadius: '8px' }}>
            <Table
              dataSource={realtimeAlerts}
              rowKey={(record) => `${record.location}-${record.timestamp}-${record.sensor_type}`}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Location',
                  dataIndex: 'location',
                  key: 'location',
                },
                {
                  title: 'Sensor Type',
                  dataIndex: 'sensor_type',
                  key: 'sensor_type',
                  render: (text: string) => text.charAt(0).toUpperCase() + text.slice(1).replace('_', ' '),
                },
                {
                  title: 'Value',
                  dataIndex: 'value',
                  key: 'value',
                  render: (value: number) => value.toFixed(2),
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <span style={{
                      color: status === 'CRITICAL' ? '#ff4d4f' :
                             status === 'WARNING' ? '#faad14' :
                             '#52c41a',
                      fontWeight: 'bold'
                    }}>
                      {status}
                    </span>
                  ),
                },
                {
                  title: 'Message',
                  dataIndex: 'message',
                  key: 'message',
                  ellipsis: true,
                },
                {
                  title: 'Time',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  render: (text: string) => new Date(text).toLocaleString(),
                },
              ]}
            />
          </Card>
        </Col>
        {Object.keys(groupedSensorData).map((sensorType, index) => (
          <Col xs={24} md={12} key={sensorType}>
            <Card 
              title={`${sensorType.charAt(0).toUpperCase() + sensorType.slice(1).replace('_', ' ')} Sensor`} 
              bordered={false} 
              style={{ borderRadius: '8px', marginBottom: 16 }}
            >
              <Line
                data={formatSensorTypeData(sensorType)}
                xField="timestamp"
                yField="value"
                seriesField="location"
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
                  location: {
                    alias: 'Location',
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
                      name: datum.location,
                      value: datum.value.toFixed(2),
                      time: new Date(datum.timestamp).toLocaleString(),
                    };
                  },
                }}
                annotations={[{
                  type: 'line',
                  start: ['min', THRESHOLDS[sensorType]],
                  end: ['max', THRESHOLDS[sensorType]],
                  style: {
                    stroke: SENSOR_COLORS[sensorType] || '#000000',
                    lineDash: [4, 4],
                  },
                  text: {
                    content: `${sensorType} threshold`,
                    position: 'start',
                    style: {
                      fill: SENSOR_COLORS[sensorType] || '#000000',
                    },
                  },
                }]}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Dashboard;
