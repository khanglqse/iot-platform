import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Form, Input, TimePicker, Switch, Button, Table, Space, Modal, message, Select } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Device } from '../../types/devices';
import { Timer, createTimer, getDeviceTimers, updateTimer, deleteTimer } from '../../services/deviceService';
import dayjs from 'dayjs';

interface TimerControlProps {
  device: Device;
  onUpdate: (updates: Partial<Device>) => void;
}

const TimerControl: React.FC<TimerControlProps> = ({ device }) => {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTimer, setEditingTimer] = useState<Timer | null>(null);
  const [form] = Form.useForm();

  const fetchTimers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDeviceTimers(device.id);
      setTimers(data);
    } catch (error) {
      message.error('Không thể tải danh sách hẹn giờ');
    } finally {
      setLoading(false);
    }
  }, [device.id]);

  useEffect(() => {
    fetchTimers();
  }, [fetchTimers]);

  const handleCreateTimer = async (values: any) => {
    try {
      const timerData: Timer = {
        device_id: device.id,
        name: values.name,
        action: values.action,
        value: values.value,
        schedule_time: values.schedule_time.format('YYYY-MM-DD HH:mm:ss'),
        days_of_week: values.days_of_week || [],
        is_active: true
      };

      await createTimer(device.id, timerData);
      message.success('Tạo hẹn giờ thành công');
      setModalVisible(false);
      form.resetFields();
      await fetchTimers();
    } catch (error) {
      message.error('Không thể tạo hẹn giờ');
    }
  };

  const handleUpdateTimer = async (values: any) => {
    console.log('handleUpdateTimer called with values:', values); // Debug log
    if (!editingTimer?.id) {
      console.log('No editingTimer.id found'); // Debug log
      return;
    }

    try {
      // Tạo object timer mới với dữ liệu từ form
      const timerData = {
        id: editingTimer.id,
        device_id: device.id,
        name: values.name,
        action: values.action,
        value: values.value,
        schedule_time: values.schedule_time.format('YYYY-MM-DD HH:mm:ss'),
        days_of_week: values.days_of_week || [],
        is_active: values.is_active ?? true
      };

      console.log('Updating timer with data:', timerData); // Debug log

      await updateTimer(device.id, editingTimer.id, timerData);
      message.success('Cập nhật hẹn giờ thành công');
      setModalVisible(false);
      setEditingTimer(null);
      form.resetFields();
      await fetchTimers();
    } catch (error) {
      console.error('Error updating timer:', error); // Debug log
      message.error('Không thể cập nhật hẹn giờ: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'));
    }
  };

  const handleDeleteTimer = async (timerId: string) => {
    try {
      await deleteTimer(device.id, timerId);
      message.success('Xóa hẹn giờ thành công');
      await fetchTimers();
    } catch (error) {
      message.error('Không thể xóa hẹn giờ');
    }
  };

  const handleEditClick = (record: Timer) => {
    console.log('handleEditClick called with record:', record); // Debug log
    setEditingTimer(record);
    form.setFieldsValue({
      name: record.name,
      action: record.action,
      value: record.value,
      schedule_time: dayjs(record.schedule_time),
      days_of_week: record.days_of_week,
      is_active: record.is_active
    });
    setModalVisible(true);
  };

  const handleFormSubmit = async (values: any) => {
    console.log('Form submitted with values:', values); // Debug log
    if (editingTimer) {
      await handleUpdateTimer(values);
    } else {
      await handleCreateTimer(values);
    }
  };

  const columns = useMemo(() => [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Thời gian',
      dataIndex: 'schedule_time',
      key: 'schedule_time',
      render: (time: string) => dayjs(time).format('HH:mm'),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Ngày trong tuần',
      dataIndex: 'days_of_week',
      key: 'days_of_week',
      render: (days: number[]) => {
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return days.map(day => dayNames[day]).join(', ') || 'Hàng ngày';
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Switch checked={active} disabled />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: Timer) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditClick(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteTimer(record.id!)}
          />
        </Space>
      ),
    },
  ], [form]);

  const getAvailableActions = useMemo(() => {
    switch (device.type) {
      case 'LIGHT':
        return [
          { label: 'Bật đèn', value: 'turn_on' },
          { label: 'Tắt đèn', value: 'turn_off' },
          { label: 'Điều chỉnh độ sáng', value: 'set_brightness' },
          { label: 'Đặt màu sắc', value: 'set_color' },
        ];
      case 'AC':
        return [
          { label: 'Bật điều hòa', value: 'turn_on' },
          { label: 'Tắt điều hòa', value: 'turn_off' },
          { label: 'Điều chỉnh nhiệt độ', value: 'set_temperature' },
          { label: 'Đặt chế độ', value: 'set_mode' },
          { label: 'Đặt tốc độ quạt', value: 'set_fan_speed' },
        ];
      case 'FAN':
        return [
          { label: 'Bật quạt', value: 'turn_on' },
          { label: 'Tắt quạt', value: 'turn_off' },
          { label: 'Đặt tốc độ', value: 'set_speed' },
          { label: 'Đặt chế độ', value: 'set_mode' },
        ];
      case 'SPEAKER':
        return [
          { label: 'Bật loa', value: 'turn_on' },
          { label: 'Tắt loa', value: 'turn_off' },
          { label: 'Đặt âm lượng', value: 'set_volume' },
          { label: 'Phát nhạc', value: 'play' },
          { label: 'Tạm dừng', value: 'pause' },
        ];
      case 'DOOR':
        return [
          { label: 'Khóa cửa', value: 'lock' },
          { label: 'Mở khóa', value: 'unlock' },
          { label: 'Bật tự động khóa', value: 'enable_auto_lock' },
          { label: 'Tắt tự động khóa', value: 'disable_auto_lock' },
        ];
      default:
        return [
          { label: 'Bật', value: 'turn_on' },
          { label: 'Tắt', value: 'turn_off' },
        ];
    }
  }, [device.type]);

  const getValueInputProps = useCallback((action: string) => {
    switch (action) {
      case 'set_brightness':
        return {
          type: 'number',
          min: 0,
          max: 100,
          placeholder: 'Nhập độ sáng (0-100)'
        };
      case 'set_temperature':
        return {
          type: 'number',
          min: 16,
          max: 30,
          placeholder: 'Nhập nhiệt độ (16-30)'
        };
      case 'set_speed':
        return {
          type: 'number',
          min: 0,
          max: 3,
          placeholder: 'Nhập tốc độ (0-3)'
        };
      case 'set_volume':
        return {
          type: 'number',
          min: 0,
          max: 100,
          placeholder: 'Nhập âm lượng (0-100)'
        };
      case 'set_color':
        return {
          type: 'color',
          placeholder: 'Chọn màu sắc'
        };
      default:
        return {
          type: 'text',
          placeholder: 'Nhập giá trị'
        };
    }
  }, []);

  return (
    <div>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setEditingTimer(null);
          form.resetFields();
          setModalVisible(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Thêm hẹn giờ
      </Button>

      <Table
        columns={columns}
        dataSource={timers}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingTimer ? 'Chỉnh sửa hẹn giờ' : 'Thêm hẹn giờ mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTimer(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose={false}
      >
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          preserve={true}
        >
          <Form.Item
            name="name"
            label="Tên hẹn giờ"
            rules={[{ required: true, message: 'Vui lòng nhập tên hẹn giờ' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="schedule_time"
            label="Thời gian"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="days_of_week"
            label="Ngày trong tuần"
          >
            <Select
              mode="multiple"
              placeholder="Chọn các ngày trong tuần"
              options={[
                { label: 'Chủ nhật', value: 0 },
                { label: 'Thứ 2', value: 1 },
                { label: 'Thứ 3', value: 2 },
                { label: 'Thứ 4', value: 3 },
                { label: 'Thứ 5', value: 4 },
                { label: 'Thứ 6', value: 5 },
                { label: 'Thứ 7', value: 6 },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="action"
            label="Hành động"
            rules={[{ required: true, message: 'Vui lòng chọn hành động' }]}
          >
            <Select 
              options={getAvailableActions}
              onChange={(value) => {
                form.setFieldsValue({ value: undefined });
              }}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.action !== currentValues.action
            }
          >
            {({ getFieldValue }) => {
              const action = getFieldValue('action');
              const valueProps = getValueInputProps(action);
              
              if (action && ['set_brightness', 'set_temperature', 'set_speed', 'set_volume', 'set_color'].includes(action)) {
                return (
                  <Form.Item
                    name="value"
                    label="Giá trị"
                    rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
                  >
                    <Input {...valueProps} />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          {editingTimer && (
            <Form.Item
              name="is_active"
              label="Trạng thái"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" onClick={() => console.log('Submit button clicked')}>
                {editingTimer ? 'Cập nhật' : 'Tạo mới'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingTimer(null);
                form.resetFields();
              }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TimerControl; 