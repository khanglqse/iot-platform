import React from 'react';
import { Card, Switch, Slider, Space, Typography, ColorPicker } from 'antd';
import { PoweroffOutlined, BulbOutlined } from '@ant-design/icons';
import { LightDevice } from '../../types/devices';

const { Title } = Typography;

interface LightControlProps {
  device: LightDevice;
  onUpdate: (updates: Partial<LightDevice>) => void;
}

const LightControl: React.FC<LightControlProps> = ({ device, onUpdate }) => {
  const handlePowerChange = (isOn: boolean) => {
    onUpdate({ isOn });
  };

  const handleBrightnessChange = (brightness: number) => {
    onUpdate({ brightness });
  };

  const handleColorChange = (color: string) => {
    onUpdate({ color });
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>Điều khiển đèn</Title>
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
              <Title level={5}>Độ sáng</Title>
              <Slider
                min={0}
                max={100}
                value={device.brightness}
                onChange={handleBrightnessChange}
                marks={{
                  0: '0%',
                  25: '25%',
                  50: '50%',
                  75: '75%',
                  100: '100%',
                }}
              />
            </div>

            <div>
              <Title level={5}>Màu sắc</Title>
              <ColorPicker
                value={device.color}
                onChange={(color) => handleColorChange(color.toHexString())}
                showText
              />
            </div>
          </>
        )}
      </Space>
    </Card>
  );
};

export default LightControl; 