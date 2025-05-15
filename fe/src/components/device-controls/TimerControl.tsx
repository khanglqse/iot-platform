import React, { useState } from 'react';
import { Card, Form, TimePicker, Switch, Button, Space, Typography, Select, Table } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { TimerDevice } from '../../types/devices';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface TimerControlProps {
  device: TimerDevice;
  onUpdate: (updates: Partial<TimerDevice>) => void;
}

const TimerControl: React.FC<TimerControlProps> = ({ device, onUpdate }) => {
  const [form] = Form.useForm();

  const handleAddSchedule = (values: any) => {
    const newSchedule = {
      deviceId: device.id,
      action: values.action,
      time: values.time.format('HH:mm'),
      days: values.days,
    };

    const updatedSchedules = [...(device.schedule || []), newSchedule];
    onUpdate({ schedule: updatedSchedules });
    form.resetFields();
  };

  const handleDeleteSchedule = (index: number) => {
    const updatedSchedules = (device.schedule || []).filter((_, i) => i !== index);
    onUpdate({ schedule: updatedSchedules });
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <span>{action === 'on' ? 'Bật' : 'Tắt'}</span>
      ),
    },
    {
      title: 'Ngày trong tuần',
      dataIndex: 'days',
      key: 'days',
      render: (days: number[]) => {
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return days.map(day => dayNames[day]).join(', ');
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, __: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteSchedule(index)}
        />
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={4}>Hẹn giờ thiết bị</Title>

        <Form
          form={form}
          onFinish={handleAddSchedule}
          layout="vertical"
        >
          <Form.Item
            name="time"
            label="Thời gian"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="action"
            label="Hành động"
            rules={[{ required: true, message: 'Vui lòng chọn hành động' }]}
          >
            <Select>
              <Option value="on">Bật</Option>
              <Option value="off">Tắt</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="days"
            label="Ngày trong tuần"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <Select mode="multiple" placeholder="Chọn các ngày">
              <Option value={0}>Chủ nhật</Option>
              <Option value={1}>Thứ 2</Option>
              <Option value={2}>Thứ 3</Option>
              <Option value={3}>Thứ 4</Option>
              <Option value={4}>Thứ 5</Option>
              <Option value={5}>Thứ 6</Option>
              <Option value={6}>Thứ 7</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              Thêm lịch hẹn giờ
            </Button>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={device.schedule}
          rowKey={(record, index) => index?.toString() || ''}
          pagination={false}
        />
      </Space>
    </Card>
  );
};

export default TimerControl; 