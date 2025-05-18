import React from 'react';
import SensorDashboard from '../components/SensorDashboard';
import { Typography } from 'antd';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <SensorDashboard />
    </div>
  );
};

export default Dashboard; 