import React from 'react';
import { Card, Switch, Slider, Space, Typography, Button } from 'antd';
import { SoundOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { SpeakerDevice } from '../../types/devices';

const { Title } = Typography;

interface SpeakerControlProps {
  device: SpeakerDevice;
  onUpdate: (updates: Partial<SpeakerDevice>) => void;
}

const SpeakerControl: React.FC<SpeakerControlProps> = ({ device, onUpdate }) => {
  const handlePlayPause = () => {
    onUpdate({ isPlaying: !device.isPlaying });
  };

  const handleVolumeChange = (volume: number) => {
    onUpdate({ volume });
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={4}>Điều khiển loa</Title>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <SoundOutlined style={{ fontSize: '24px' }} />
            <span>Phát nhạc</span>
          </Space>
          <Button
            type="primary"
            icon={device.isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={handlePlayPause}
          >
            {device.isPlaying ? 'Tạm dừng' : 'Phát'}
          </Button>
        </div>

        {device.currentTrack && (
          <div style={{ textAlign: 'center', margin: '16px 0' }}>
            <Title level={5}>Đang phát: {device.currentTrack}</Title>
          </div>
        )}

        <div>
          <Title level={5}>Âm lượng</Title>
          <Slider
            min={0}
            max={100}
            value={device.volume}
            onChange={handleVolumeChange}
            marks={{
              0: '0%',
              25: '25%',
              50: '50%',
              75: '75%',
              100: '100%',
            }}
          />
        </div>
      </Space>
    </Card>
  );
};

export default SpeakerControl; 