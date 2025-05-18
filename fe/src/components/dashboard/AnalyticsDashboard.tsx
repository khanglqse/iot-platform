import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin, DatePicker, Space, Statistic } from 'antd';
import { getDashboardAnalytics } from '../../services/dashboardService';
import type { AnalyticsData } from '../../services/dashboardService';
import { BarChartOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Pie, Column } from '@ant-design/charts';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const AnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);

  const fetchData = async (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
    try {
      setLoading(true);
      const analytics = await getDashboardAnalytics(startDate.toDate(), endDate.toDate());
      setData(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(dateRange[0], dateRange[1]);
  }, [dateRange]);

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const getDeviceTypeChartData = () => {
    if (!data) return [];
    return Object.entries(data.device_types).map(([type, count]) => ({
      type,
      value: count
    }));
  };

  const getDeviceActivityChartData = () => {
    if (!data) return [];
    return Object.entries(data.activity_counts).map(([deviceId, count]) => ({
      device: `Device ${deviceId}`,
      activities: count
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

  const columnConfig = {
    data: getDeviceActivityChartData(),
    xField: 'device',
    yField: 'activities',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6
      }
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return <div>Error loading analytics data</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Analytics Dashboard</Title>
          <RangePicker
            onChange={handleDateRangeChange}
            defaultValue={[dateRange[0], dateRange[1]]}
          />
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Timers"
                value={data.timer_stats.total}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Active Timers"
                value={data.timer_stats.active}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Timer Executions"
                value={data.timer_stats.executions}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Device Type Distribution">
              <div style={{ height: 300 }}>
                <Pie {...pieConfig} />
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Device Activity">
              <div style={{ height: 300 }}>
                <Column {...columnConfig} />
              </div>
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
};

export default AnalyticsDashboard; 