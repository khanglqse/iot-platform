import React, { useState } from 'react';
import { Card, Form, TimePicker, Switch, Button, Space, Typography, Select, Table } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Device } from '../../types/devices';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface TimerControlProps {
  device: Device;
  onUpdate: (updates: Partial<Device>) => void;
}

const TimerControl: React.FC<TimerControlProps> = ({ device, onUpdate }) => {
  const [form] = Form.useForm();

  const handleAddSchedule = (values: any) => {
    const newSchedule = {
      time: values.time.format('HH:mm'),
      action: values.action,
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

  const getActionOptions = () => {
    const baseOptions = [
      { value: 'on', label: 'Bật' },
      { value: 'off', label: 'Tắt' },
    ];

    switch (device.type) {
      case 'AC':
        return [
          ...baseOptions,
          { value: 'set_temperature', label: 'Đặt nhiệt độ' },
          { value: 'set_mode', label: 'Đặt chế độ' },
        ];
      case 'LIGHT':
        return [
          ...baseOptions,
          { value: 'set_brightness', label: 'Đặt độ sáng' },
          { value: 'set_color', label: 'Đặt màu sắc' },
        ];
      case 'SPEAKER':
        return [
          ...baseOptions,
          { value: 'set_volume', label: 'Đặt âm lượng' },
          { value: 'play', label: 'Phát nhạc' },
          { value: 'pause', label: 'Tạm dừng' },
        ];
      case 'DOOR':
        return [
          { value: 'lock', label: 'Khóa' },
          { value: 'unlock', label: 'Mở khóa' },
        ];
      default:
        return baseOptions;
    }
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
      render: (action: string) => {
        const actionOption = getActionOptions().find(opt => opt.value === action);
        return <span>{actionOption?.label || action}</span>;
      },
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
              {getActionOptions().map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
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