import React from 'react';
import { Card, Switch, Slider, Radio, Space, Typography } from 'antd';
import { PoweroffOutlined, FireOutlined, CloudOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { ACDevice } from '../../types/devices';

const { Title } = Typography;

interface ACControlProps {
  device: ACDevice;
  onUpdate: (updates: Partial<ACDevice>) => void;
}

const ACControl: React.FC<ACControlProps> = ({ device, onUpdate }) => {
  const handleModeChange = (mode: ACDevice['mode']) => {
    onUpdate({ mode });
  };

  const handleFanSpeedChange = (fanSpeed: ACDevice['fanSpeed']) => {
    onUpdate({ fanSpeed });
  };

  const handleTemperatureChange = (temperature: number) => {
    onUpdate({ temperature });
  };

  const handlePowerChange = (isOn: boolean) => {
    onUpdate({ isOn });
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>Điều khiển điều hòa</Title>
          <Switch
            checked={device.isOn}
            onChange={handlePowerChange}
            checkedChildren={<PoweroffOutlined />}
            unCheckedChildren={<PoweroffOutlined />}
          />
        </div>

        {device.isOn && (
          <>
            <div>
              <Title level={5}>Nhiệt độ</Title>
              <Slider
                min={16}
                max={30}
                value={device.temperature}
                onChange={handleTemperatureChange}
                marks={{
                  16: '16°C',
                  20: '20°C',
                  25: '25°C',
                  30: '30°C',
                }}
              />
            </div>

            <div>
              <Title level={5}>Chế độ</Title>
              <Radio.Group value={device.mode} onChange={(e) => handleModeChange(e.target.value)}>
                <Radio.Button value="cool">
                  <CloudOutlined /> Làm lạnh
                </Radio.Button>
                <Radio.Button value="heat">
                  <FireOutlined /> Sưởi ấm
                </Radio.Button>
                <Radio.Button value="dry">
                  <ThunderboltOutlined /> Hút ẩm
                </Radio.Button>
                <Radio.Button value="fan">Quạt</Radio.Button>
              </Radio.Group>
            </div>

            <div>
              <Title level={5}>Tốc độ quạt</Title>
              <Radio.Group value={device.fanSpeed} onChange={(e) => handleFanSpeedChange(e.target.value)}>
                <Radio.Button value="auto">Tự động</Radio.Button>
                <Radio.Button value="low">Thấp</Radio.Button>
                <Radio.Button value="medium">Trung bình</Radio.Button>
                <Radio.Button value="high">Cao</Radio.Button>
              </Radio.Group>
            </div>
          </>
        )}
      </Space>
    </Card>
  );
};

export default ACControl; 