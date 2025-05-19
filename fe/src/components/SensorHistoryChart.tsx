import React, { useState } from 'react';
import { Card, Row, Col, DatePicker, Empty, Spin } from 'antd';
import { Line } from '@ant-design/plots';
import { SensorData } from '../types/sensor';
import dayjs from 'dayjs';
import type { DatePickerProps, RangePickerProps } from 'antd/es/date-picker';

const { RangePicker } = DatePicker;

interface SensorHistoryChartProps {
  data: SensorData[];
  loading: boolean;
  onDateRangeChange: (dates: [Date | null, Date | null]) => void;
}

const SensorHistoryChart: React.FC<SensorHistoryChartProps> = ({ data, loading, onDateRangeChange }) => {
  const formatData = (data: SensorData[], field: keyof SensorData) => {
    return data.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleString(),
      value: item[field],
    }));
  };

  const commonConfig = {
    xField: 'timestamp',
    yField: 'value',
    smooth: true,
    point: {
      size: 5,
      shape: 'circle',
    },
    tooltip: {
      formatter: (datum: any) => {
        return { name: 'Value', value: datum.value };
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

  return (
    <div className="sensor-history-chart">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Sensor Data History</h3>
        <RangePicker 
          onChange={handleDateRangeChange}
          disabledDate={disabledDate}
        />
      </div>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={24} md={12}>
          <Card title="Temperature (°C)" bordered={false}>
            {data.length > 0 ? (
              <Line {...commonConfig} data={formatData(data, 'temperature' as keyof SensorData)} />
            ) : noDataContent}
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12}>
          <Card title="Humidity (%)" bordered={false}>
            {data.length > 0 ? (
              <Line {...commonConfig} data={formatData(data, 'humidity' as keyof SensorData)} />
            ) : noDataContent}
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12}>
          <Card title="Light Level (lux)" bordered={false}>
            {data.length > 0 ? (
              <Line {...commonConfig} data={formatData(data, 'light_level' as keyof SensorData)} />
            ) : noDataContent}
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12}>
          <Card title="Soil Moisture (%)" bordered={false}>
            {data.length > 0 ? (
              <Line {...commonConfig} data={formatData(data, 'soil_moisture' as keyof SensorData)} />
            ) : noDataContent}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SensorHistoryChart;
