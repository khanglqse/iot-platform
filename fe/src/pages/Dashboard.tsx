import React, { useState } from 'react';
import { Tabs } from 'antd';
import OverviewDashboard from '../components/dashboard/OverviewDashboard';
import DeviceStatusDashboard from '../components/dashboard/DeviceStatusDashboard';
import AnalyticsDashboard from '../components/dashboard/AnalyticsDashboard';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const items = [
    {
      key: 'overview',
      label: 'Overview',
      children: <OverviewDashboard />
    },
    {
      key: 'status',
      label: 'Device Status',
      children: <DeviceStatusDashboard />
    },
    {
      key: 'analytics',
      label: 'Analytics',
      children: <AnalyticsDashboard />
    }
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        style={{ background: '#fff', padding: '16px' }}
      />
    </div>
  );
};

export default Dashboard; 