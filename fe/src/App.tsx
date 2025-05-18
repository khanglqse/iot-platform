import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu, message } from 'antd';
import { DashboardOutlined, ApiOutlined } from '@ant-design/icons';
import DeviceManagement from './pages/DeviceManagement';
import DeviceDetail from './pages/DeviceDetail';
import VoiceButton from './components/VoiceButton';
import './App.css';

const { Header, Content, Sider } = Layout;

function App() {
  const [lastTranscription, setLastTranscription] = useState('');

  const handleVoiceData = async (audioBlob: Blob, transcription?: string) => {
    try {
      if (transcription) {
        setLastTranscription(transcription);
        // Here you can process the transcription text
        // For example, you could:
        // 1. Send it to your backend for command processing
        // 2. Update device states based on voice commands
        // 3. Log the command in your system
        
        // Example: Process voice commands
        const command = transcription.toLowerCase();
        if (command.includes('bật') || command.includes('mở')) {
          // Handle turn on command
          message.success('Đang thực hiện lệnh bật thiết bị...');
        } else if (command.includes('tắt') || command.includes('đóng')) {
          // Handle turn off command
          message.success('Đang thực hiện lệnh tắt thiết bị...');
        } else {
          message.info('Đã nhận lệnh: ' + transcription);
        }
      }

      // Send audio data to backend if needed
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      // Example API call (replace with your actual endpoint)
      // const response = await fetch('YOUR_BACKEND_API/voice-command', {
      //   method: 'POST',
      //   body: formData,
      // });
      
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
                <Route path="/devices" element={<DeviceManagement />} />
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
