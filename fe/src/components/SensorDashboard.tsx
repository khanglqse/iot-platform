import React from 'react';
import { Card, Row, Col, Typography, Progress } from 'antd';
import {
  ThunderboltOutlined,
  CloudOutlined,
  BulbOutlined,
  ExperimentOutlined,
  DashboardOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

interface SensorData {
  temperature: number;
  humidity: number;
  lightLevel: number;
  co2Level: number;
  airQuality: number;
}

const SensorDashboard: React.FC = () => {
  // Dummy data - replace with actual sensor data from your backend
  const sensorData: SensorData = {
    temperature: 25.5,
    humidity: 65,
    lightLevel: 80,
    co2Level: 450,
    airQuality: 92,
  };

  const SensorCard = ({ 
    title, 
    value, 
    unit, 
    Icon,
    color
  }: { 
    title: string;
    value: number;
    unit: string;
    Icon: typeof ThunderboltOutlined;
    color: string;
  }) => (
    <Card 
      style={{ 
        height: '100%',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
      hoverable
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Icon style={{ fontSize: 24, color, marginRight: 8 }} />
        <Title level={5} style={{ margin: 0 }}>
          {title}
        </Title>
      </div>
      <Title level={3} style={{ marginBottom: 16 }}>
        {value}{unit}
      </Title>
      <Progress 
        percent={Math.min((value / 100) * 100, 100)} 
        strokeColor={color}
        strokeWidth={8}
        showInfo={false}
      />
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Smart Home Sensors
      </Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={8}>
          <SensorCard
            title="Temperature"
            value={sensorData.temperature}
            unit="°C"
            Icon={ThunderboltOutlined}
            color="#FF6B6B"
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <SensorCard
            title="Humidity"
            value={sensorData.humidity}
            unit="%"
            Icon={CloudOutlined}
            color="#4ECDC4"
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <SensorCard
            title="Light Level"
            value={sensorData.lightLevel}
            unit="%"
            Icon={BulbOutlined}
            color="#FFD93D"
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <SensorCard
            title="CO2 Level"
            value={sensorData.co2Level}
            unit="ppm"
            Icon={ExperimentOutlined}
            color="#95A5A6"
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <SensorCard
            title="Air Quality"
            value={sensorData.airQuality}
            unit="%"
            Icon={DashboardOutlined}
            color="#6C5CE7"
          />
        </Col>
      </Row>
    </div>
  );
};

export default SensorDashboard; 