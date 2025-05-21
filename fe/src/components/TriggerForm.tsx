import React from 'react';
import { Form, Input, Select, Button, InputNumber, message } from 'antd';
import { useDevices } from '../hooks/useDevices';
import { Trigger, createTrigger, updateTrigger } from '../services/triggerService';

const { Option } = Select;

interface TriggerFormProps {
  trigger?: Trigger | null;
  onSuccess: () => void;
}

const TriggerForm: React.FC<TriggerFormProps> = ({ trigger, onSuccess }) => {
  const [form] = Form.useForm();
  const { sensorDevices, devices } = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>(trigger?.sensor_device_id || '');
  const [selectedTargetDeviceId, setSelectedTargetDeviceId] = React.useState<string>(trigger?.target_device_id || '');

  // Get available sensors for selected device
  const availableSensors = React.useMemo(() => {
    const device = sensorDevices.find(d => d.device_id === selectedDeviceId);
    return device?.sensors || [];
  }, [selectedDeviceId, sensorDevices]);

  // Get available actions based on target device type
  const getAvailableActions = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'fan':
        return ['turn_on', 'turn_off', 'set_speed'];
      case 'ac':
        return ['turn_on', 'turn_off', 'set_temperature'];
      case 'speaker':
        return ['turn_on', 'turn_off', 'set_volume'];
      case 'light':
        return ['turn_on', 'turn_off', 'set_brightness'];
      case 'door':
        return ['lock', 'unlock'];
      case 'lcd':
        return ['display_text'];
      default:
        return ['turn_on', 'turn_off'];
    }
  };

  const handleDeviceChange = (value: string) => {
    setSelectedDeviceId(value);
    form.setFieldsValue({ sensor_type: undefined });
  };

  const handleTargetDeviceChange = (value: string) => {
    setSelectedTargetDeviceId(value);
    const device = devices.find(d => d.id === value);
    if (device) {
      form.setFieldsValue({ action: undefined });
      // If device is LCD, automatically set action to display_text
      if (device.type.toLowerCase() === 'lcd') {
        form.setFieldsValue({ action: 'display_text' });
      }
    }
  };

  const onFinish = async (values: any) => {
    try {
      if (trigger) {
        await updateTrigger(trigger.id, values);
        message.success('Trigger updated successfully');
      } else {
        await createTrigger(values);
        message.success('Trigger created successfully');
      }
      onSuccess();
    } catch (error) {
      message.error(trigger ? 'Failed to update trigger' : 'Failed to create trigger');
    }
  };

  React.useEffect(() => {
    if (trigger) {
      form.setFieldsValue(trigger);
      setSelectedDeviceId(trigger.sensor_device_id);
      setSelectedTargetDeviceId(trigger.target_device_id);
    }
  }, [trigger, form]);

  // Check if selected target device is LCD
  const isLCDDevice = React.useMemo(() => {
    const device = devices.find(d => d.id === selectedTargetDeviceId);
    return device?.type.toLowerCase() === 'lcd';
  }, [selectedTargetDeviceId, devices]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={trigger ? { ...trigger, is_active: Boolean(trigger.is_active) } : { is_active: true }}
    >
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

      <Form.Item
        name="sensor_type"
        label="Sensor Type"
        rules={[{ required: true, message: 'Please select a sensor type' }]}
      >
        <Select
          placeholder="Select sensor type"
          disabled={!selectedDeviceId}
        >
          {availableSensors.map(sensor => (
            <Option key={sensor} value={sensor}>
              {sensor.charAt(0).toUpperCase() + sensor.slice(1).replace('_', ' ')}
            </Option>
          ))}
        </Select>
      </Form.Item>

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

      <Form.Item
        name="threshold"
        label="Threshold Value"
        rules={[{ required: true, message: 'Please input threshold value' }]}
      >
        <InputNumber style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="target_device_id"
        label="Target Device"
        rules={[{ required: true, message: 'Please select a target device' }]}
      >
        <Select
          placeholder="Select target device"
          onChange={handleTargetDeviceChange}
        >
          {devices.map(device => (
            <Option key={device.id} value={device.id}>
              {device.name} ({device.type} - {device.location})
            </Option>
          ))}
        </Select>
      </Form.Item>

      {!isLCDDevice && (
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
      )}

      {isLCDDevice && (
        <Form.Item
          name="display_text"
          label="Display Text"
          rules={[
            { required: true, message: 'Please input text to display' },
            { max: 16, message: 'Text cannot be longer than 16 characters' }
          ]}
        >
          <Input maxLength={16} showCount />
        </Form.Item>
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit">
          {trigger ? 'Update' : 'Create'} Trigger
        </Button>
      </Form.Item>
    </Form>
  );
};

export default TriggerForm; 