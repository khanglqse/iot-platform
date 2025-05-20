import React from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Header, Content, Sider } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: '/devices',
      icon: <AppstoreOutlined />,
      label: <Link to="/devices">Devices</Link>,
    },
    {
      key: '/triggers',
      icon: <ThunderboltOutlined />,
      label: <Link to="/triggers">Triggers</Link>,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">Settings</Link>,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider>
        <div className="logo" />
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
        />
      </Sider>
      <AntLayout>
        <Header style={{ padding: 0, background: '#fff' }} />
        <Content style={{ margin: '16px' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout; 