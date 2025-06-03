import React from 'react';
import { Layout, Card, Form, Input, Button, Switch, message } from 'antd';
import { UserOutlined, BellOutlined, LockOutlined } from '@ant-design/icons';

const { Content } = Layout;

const Settings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Settings values:', values);
    message.success('Settings updated successfully');
  };

  return (
    <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
      <Card title="Settings" bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            notifications: true,
            darkMode: false,
            language: 'en'
          }}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item
            label="Notifications"
            name="notifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="Dark Mode"
            name="darkMode"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="Language"
            name="language"
            rules={[{ required: true, message: 'Please select your language!' }]}
          >
            <Input prefix={<BellOutlined />} placeholder="Language" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Content>
  );
};

export default Settings; 