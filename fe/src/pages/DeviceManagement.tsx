import React, { useState } from 'react';
import { Table, Card, Tag, Space, Typography, Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Device } from '../types/devices';

const { Title } = Typography;
const { Header, Content } = Layout;

const DeviceManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading] = useState(false);

  // Mock data
  const mockDevices: Device[] = [
    {
      id: '1',
      name: 'Điều hòa phòng khách',
      type: 'AC',
      status: 'online',
      location: 'Phòng khách',
      lastSeen: new Date().toISOString(),
      temperature: 25,
      mode: 'cool',
      fanSpeed: 'auto',
      isOn: true
    },
    {
      id: '2',
      name: 'Đèn phòng ngủ',
      type: 'LIGHT',
      status: 'online',
      location: 'Phòng ngủ',
      lastSeen: new Date().toISOString(),
      brightness: 80,
      color: '#ffffff',
      isOn: true
    },
    {
      id: '3',
      name: 'Cửa chính',
      type: 'DOOR',
      status: 'online',
      location: 'Cửa ra vào',
      lastSeen: new Date().toISOString(),
      isLocked: true,
      isOpen: false
    },
    {
      id: '4',
      name: 'Loa phòng khách',
      type: 'SPEAKER',
      status: 'online',
      location: 'Phòng khách',
      lastSeen: new Date().toISOString(),
      volume: 50,
      isPlaying: false,
      currentTrack: 'Chưa phát nhạc'
    },
    {
      id: '5',
      name: 'Điều hòa phòng ngủ',
      type: 'AC',
      status: 'offline',
      location: 'Phòng ngủ',
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      temperature: 26,
      mode: 'heat',
      fanSpeed: 'medium',
      isOn: false
    },
    {
      id: '6',
      name: 'Đèn ban công',
      type: 'LIGHT',
      status: 'online',
      location: 'Ban công',
      lastSeen: new Date().toISOString(),
      brightness: 100,
      color: '#ffeb3b',
      isOn: true
    },
    {
      id: '7',
      name: 'Cửa sau',
      type: 'DOOR',
      status: 'online',
      location: 'Cửa sau',
      lastSeen: new Date().toISOString(),
      isLocked: false,
      isOpen: true
    },
    {
      id: '8',
      name: 'Loa phòng ngủ',
      type: 'SPEAKER',
      status: 'offline',
      location: 'Phòng ngủ',
      lastSeen: new Date(Date.now() - 7200000).toISOString(),
      volume: 30,
      isPlaying: false
    }
  ];

  const columns = [
    {
      title: 'Tên thiết bị',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Device) => (
        <a onClick={() => navigate(`/devices/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeNames: { [key: string]: string } = {
          'AC': 'Điều hòa',
          'LIGHT': 'Đèn',
          'DOOR': 'Cửa',
          'SPEAKER': 'Loa',
          'TIMER': 'Hẹn giờ'
        };
        return typeNames[type] || type;
      }
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'online' ? 'green' : 'red'}>
          {status === 'online' ? 'Hoạt động' : 'Mất kết nối'}
        </Tag>
      ),
    },
    {
      title: 'Lần cuối hoạt động',
      dataIndex: 'lastSeen',
      key: 'lastSeen',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
        
        <Content>
        <h3>Quản lý thiết bị</h3>
          <Card>
            <Table
              columns={columns}
              dataSource={mockDevices}
              loading={loading}
              rowKey="id"
            />
          </Card>
        </Content>
    </Layout>
  );
};

export default DeviceManagement; 