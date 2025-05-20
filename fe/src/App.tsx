import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu, message } from 'antd';
import { DashboardOutlined, ApiOutlined, ThunderboltOutlined } from '@ant-design/icons';
import DeviceManagement from './pages/DeviceManagement';
import DeviceDetail from './pages/DeviceDetail';
import Sensors from './pages/Sensors';
import Dashboard from './pages/Dashboard';
import Trigger from './pages/Trigger';
import VoiceButton from './components/VoiceButton';
import './App.css';

const { Header, Content, Sider } = Layout;

function App() {
  const [lastTranscription, setLastTranscription] = useState('');

  // Dummy data for testing - replace with actual API call
  const sensorData = {
    locations: [
      {
        location: "living_room",
        sensors: [
          {
            device_id: "raspberry_pi_001",
            timestamp: "2025-05-19T00:37:34.260+00:00",
            temperature: 20.2,
            humidity: 65.5,
            light_level: 32.92,
            soil_moisture: 34.89,
            location: "living_room",
            type: "plant"
          }
        ]
      },
      {
        location: "bedroom",
        sensors: [
          {
            device_id: "raspberry_pi_002",
            timestamp: "2025-05-19T00:37:34.260+00:00",
            temperature: 22.5,
            humidity: 60.0,
            light_level: 15.0,
            soil_moisture: 0,
            location: "bedroom",
            type: "environment"
          }
        ]
      }
    ]
  };

  const handleVoiceData = async (audioBlob: Blob, transcription?: string) => {
    try {
      if (transcription) {
        setLastTranscription(transcription);
        const command = transcription.toLowerCase();
        if (command.includes('bật') || command.includes('mở')) {
          message.success('Đang thực hiện lệnh bật thiết bị...');
        } else if (command.includes('tắt') || command.includes('đóng')) {
          message.success('Đang thực hiện lệnh tắt thiết bị...');
        } else {
          message.info('Đã nhận lệnh: ' + transcription);
        }
      }

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      console.log('Audio data ready to be sent to backend:', audioBlob);
    } catch (error) {
      console.error('Error processing voice data:', error);
      message.error('Có lỗi xảy ra khi xử lý lệnh thoại');
    }
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header className="header">
          <div className="logo" />
          <h1 style={{ color: 'white', margin: 0 }}>IoT Platform</h1>
        </Header>
        <Layout>
          <Sider width={200} className="site-layout-background">
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              style={{ height: '100%', borderRight: 0 }}
            >
              <Menu.Item key="1" icon={<DashboardOutlined />}>
                <Link to="/">Dashboard</Link>
              </Menu.Item>
              <Menu.Item key="2" icon={<ApiOutlined />}>
                <Link to="/devices">Devices</Link>
              </Menu.Item>
              <Menu.Item key="3" icon={<DashboardOutlined />}>
                <Link to="/sensors">Sensors</Link>
              </Menu.Item>
              <Menu.Item key="4" icon={<ThunderboltOutlined />}>
                <Link to="/triggers">Triggers</Link>
              </Menu.Item>
            </Menu>
          </Sider>
          <Layout style={{ padding: '0 24px 24px' }}>
            <Content
              className="site-layout-background"
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/devices" element={<DeviceManagement />} />
                <Route path="/sensors" element={<Sensors />} />
                <Route path="/triggers" element={<Trigger />} />
                <Route path="/devices/:id" element={<DeviceDetail />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
        <VoiceButton onVoiceData={handleVoiceData} />
      </Layout>
    </Router>
  );
}

export default App;
