import React from 'react';
import { Card, Switch, Space, Typography, Button } from 'antd';
import { LockOutlined, UnlockOutlined, HomeOutlined } from '@ant-design/icons';
import { DoorDevice } from '../../types/devices';

const { Title } = Typography;

interface DoorControlProps {
  device: DoorDevice;
  onUpdate: (updates: Partial<DoorDevice>) => void;
}

const DoorControl: React.FC<DoorControlProps> = ({ device, onUpdate }) => {
  const handleLockChange = (isLocked: boolean) => {
    onUpdate({ isLocked });
  };

  
  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={4}>Điều khiển cửa</Title>


        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            {device.isLocked ? <LockOutlined style={{ fontSize: '24px' }} /> : <UnlockOutlined style={{ fontSize: '24px' }} />}
            <span>Khóa cửa</span>
          </Space>
          <Switch
            checked={device.isLocked}
            onChange={handleLockChange}
            checkedChildren="Khóa"
            unCheckedChildren="Mở khóa"
          />
        </div>
      </Space>
    </Card>
  );
};

export default DoorControl; 