import React, { useState, useMemo } from 'react';
import { Form, Input, Select, Button, Card, Space, InputNumber, message, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useDevices } from '../hooks/useDevices';

const { Option } = Select;

interface TriggerFormData {
  sensor_device_id: string;
  sensor_type: string;
  condition: string;
  threshold: number;
  action: string;
  target_device_id: string;
}

const Trigger: React.FC = () => {
  const [form] = Form.useForm();
  const { sensorDevices, devices, loading, error } = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedTargetDeviceId, setSelectedTargetDeviceId] = useState<string>('');

  // Get available sensors for selected device
  const availableSensors = useMemo(() => {
    const device = sensorDevices.find(d => d.device_id === selectedDeviceId);
    return device?.sensors || [];
  }, [selectedDeviceId, sensorDevices]);

  // Get available actions based on target device type
  const getAvailableActions = (deviceType: string) => {
    switch (deviceType) {
      case 'light':
        return ['turn_on', 'turn_off', 'set_brightness'];
      case 'fan':
        return ['turn_on', 'turn_off', 'set_speed'];
      case 'ac':
        return ['turn_on', 'turn_off', 'set_temperature'];
      case 'speaker':
        return ['turn_on', 'turn_off', 'set_volume'];
      case 'door':
        return ['lock', 'unlock'];
      default:
        return ['turn_on', 'turn_off'];
    }
  };

  const handleDeviceChange = (value: string) => {
    setSelectedDeviceId(value);
    form.setFieldsValue({ sensor_type: undefined }); // Reset sensor selection
  };

  const onFinish = async (values: TriggerFormData) => {
    try {
      console.log('Trigger values:', values);
      message.success('Trigger created successfully');
      form.resetFields();
    } catch (err) {
      message.error('Failed to create trigger');
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Trigger Management</h2>
      <Card>
        <Form
          form={form}
          name="trigger"
          onFinish={onFinish}
          layout="vertical"
        >
          {/* Sensor Device Selection */}
          <Form.Item
            name="sensor_device_id"
            label="Sensor Device"
            rules={[{ required: true, message: 'Please select a sensor device' }]}
          >
            <Select 
              placeholder="Select sensor device"
              onChange={handleDeviceChange}
            >
              {sensorDevices.map(device => (
                <Option key={device.device_id} value={device.device_id}>
                  {device.name} ({device.location})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Sensor Type Selection */}
          <Form.Item
            name="sensor_type"
            label="Sensor Type"
            rules={[{ required: true, message: 'Please select a sensor type' }]}
          >
            <Select 
              placeholder="Select sensor"
              disabled={!selectedDeviceId}
            >
              {availableSensors.map(sensor => (
                <Option key={sensor} value={sensor}>
                  {sensor.charAt(0).toUpperCase() + sensor.slice(1).replace('_', ' ')}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Condition */}
          <Form.Item
            name="condition"
            label="Condition"
            rules={[{ required: true, message: 'Please select a condition' }]}
          >
            <Select placeholder="Select condition">
              <Option value="greater_than">Greater than</Option>
              <Option value="less_than">Less than</Option>
              <Option value="equals">Equals</Option>
            </Select>
          </Form.Item>

          {/* Threshold Value */}
          <Form.Item
            name="threshold"
            label="Threshold Value"
            rules={[{ required: true, message: 'Please input threshold value' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          {/* Target Device Selection */}
          <Form.Item
            name="target_device_id"
            label="Target Device"
            rules={[{ required: true, message: 'Please select a target device' }]}
          >
            <Select 
              placeholder="Select target device"
              onChange={(value) => {
                setSelectedTargetDeviceId(value);
                const device = devices.find(d => d.id === value);
                if (device) {
                  form.setFieldsValue({ action: undefined });
                }
              }}
            >
              {devices.map(device => (
                <Option key={device.id} value={device.id}>
                  {device.name} ({device.type} - {device.location})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Action Selection */}
          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: 'Please select an action' }]}
          >
            <Select 
              placeholder="Select action"
              disabled={!selectedTargetDeviceId}
            >
              {selectedTargetDeviceId && 
                getAvailableActions(
                  devices.find(d => d.id === selectedTargetDeviceId)?.type || ''
                ).map(action => (
                  <Option key={action} value={action}>
                    {action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Option>
                ))
              }
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              Create Trigger
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Trigger; 