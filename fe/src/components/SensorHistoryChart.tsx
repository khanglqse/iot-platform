import React from 'react';
import { Card, Row, Col, DatePicker, Empty, Spin } from 'antd';
import { Line, LineConfig } from '@ant-design/plots';
import { SensorData } from '../services/sensorService';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';

const { RangePicker } = DatePicker;

interface SensorHistoryChartProps {
  data: SensorData[];
  loading: boolean;
  onDateRangeChange: (dates: [Date | null, Date | null]) => void;
}

type MetricType = 'temperature' | 'humidity' | 'light_level' | 'soil_moisture' | 'battery';

interface ChartDataPoint {
  timestamp: string;
  type: string;
  value: number;
}

const SensorHistoryChart: React.FC<SensorHistoryChartProps> = ({ data, loading, onDateRangeChange }) => {
  const formatData = (data: SensorData[], metric: MetricType): ChartDataPoint[] => {
    return data.flatMap(item => {
      if (!item.stats) return [];
      
      const stats = item.stats[metric];
      if (!stats) return [];

      return [
        {
          timestamp: new Date(item.timestamp).toISOString(),
          type: 'Min',
          value: stats.min,
        },
        {
          timestamp: new Date(item.timestamp).toISOString(),
          type: 'Max',
          value: stats.max,
        },
        {
          timestamp: new Date(item.timestamp).toISOString(),
          type: 'Average',
          value: stats.avg,
        },
      ];
    });
  };

  const commonConfig: Partial<LineConfig> = {
    xField: 'timestamp',
    yField: 'value',
    seriesField: 'type',
    xAxis: {
      type: 'time',
      title: {
        text: 'Time',
      },
    },
    yAxis: {
      title: {
        text: 'Value',
      },
    },
    legend: {
      position: 'top',
    },
    smooth: true,
    point: {
      size: 3,
      shape: 'circle',
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: datum.type,
          value: datum.value.toFixed(2),
        };
      },
    },
  };

  const handleDateRangeChange: RangePickerProps['onChange'] = (dates) => {
    if (dates && dates[0] && dates[1]) {
      onDateRangeChange([dates[0].toDate(), dates[1].toDate()]);
    } else {
      onDateRangeChange([null, null]);
    }
  };

  // Disable dates after today
  const disabledDate = (current: dayjs.Dayjs) => {
    return current && current > dayjs().endOf('day');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  const noDataContent = (
    <Empty 
      description="No history data available" 
      image={Empty.PRESENTED_IMAGE_SIMPLE} 
      style={{ padding: '30px 0' }}
    />
  );

  const renderChart = (title: string, metric: MetricType, unit: string) => (
    <Col xs={24} sm={24} md={12} key={metric}>
      <Card title={`${title} (${unit})`} bordered={false}>
        {data.length > 0 ? (
          <Line 
            {...commonConfig} 
            data={formatData(data, metric)}
            color={['#ff4d4f', '#52c41a', '#1890ff']} // Red for min, Green for max, Blue for avg
          />
        ) : noDataContent}
      </Card>
    </Col>
  );

  return (
    <div className="sensor-history-chart">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Sensor Data History</h3>
        <RangePicker 
          onChange={handleDateRangeChange}
          disabledDate={disabledDate}
          showTime
        />
      </div>
      <Row gutter={[24, 24]}>
        {renderChart('Temperature', 'temperature', '°C')}
        {renderChart('Humidity', 'humidity', '%')}
        {renderChart('Light Level', 'light_level', 'lux')}
        {renderChart('Soil Moisture', 'soil_moisture', '%')}
        {renderChart('Battery', 'battery', '%')}
      </Row>
    </div>
  );
};

export default SensorHistoryChart;
