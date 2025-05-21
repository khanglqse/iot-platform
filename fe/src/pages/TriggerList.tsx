import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, message, Switch } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Trigger, getTriggers, deleteTrigger, updateTrigger } from '../services/triggerService';
import TriggerForm from '../components/TriggerForm';
import { useDevices } from '../hooks/useDevices';

const TriggerList: React.FC = () => {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null);
  const { sensorDevices, devices } = useDevices();

  const fetchTriggers = async () => {
    setLoading(true);
    try {
      const data = await getTriggers();
      setTriggers(data);
    } catch (error) {
      message.error('Failed to fetch triggers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriggers();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteTrigger(id);
      message.success('Trigger deleted successfully');
      fetchTriggers();
    } catch (error) {
      message.error('Failed to delete trigger');
    }
  };

  const handleEdit = (trigger: Trigger) => {
    setEditingTrigger(trigger);
    setIsModalVisible(true);
  };

  const handleToggleActive = async (trigger: Trigger) => {
    try {
      await updateTrigger(trigger.id, { is_active: !trigger.is_active });
      message.success('Trigger status updated successfully');
      fetchTriggers();
    } catch (error) {
      message.error('Failed to update trigger status');
    }
  };

  const columns = [
    {
      title: 'Sensor Device',
      dataIndex: 'sensor_device_id',
      key: 'sensor_device_id',
      render: (id: string) => {
        const device = sensorDevices.find(d => d.device_id === id);
        return device ? `${device.name} (${device.location})` : id;
      }
    },
    {
      title: 'Sensor Type',
      dataIndex: 'sensor_type',
      key: 'sensor_type',
      render: (type: string) => type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      render: (condition: string) => condition.replace('_', ' ')
    },
    {
      title: 'Threshold',
      dataIndex: 'threshold',
      key: 'threshold',
    },
    {
      title: 'Target Device',
      dataIndex: 'target_device_id',
      key: 'target_device_id',
      render: (id: string) => {
        const device = devices.find(d => d.id === id);
        return device ? `${device.name} (${device.location})` : id;
      }
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string | null, record: Trigger) => {
        const device = devices.find(d => d.id === record.target_device_id);
        if (device?.type.toLowerCase() === 'lcd') {
          return 'Display Text';
        }
        return action ? action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';
      }
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: Trigger) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record)}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Trigger) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => Modal.confirm({
              title: 'Delete Trigger',
              content: 'Are you sure you want to delete this trigger?',
              onOk: () => handleDelete(record.id)
            })}
          />
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Triggers</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingTrigger(null);
            setIsModalVisible(true);
          }}
        >
          Add Trigger
        </Button>
      </div>

      <Table
        loading={loading}
        dataSource={triggers}
        columns={columns}
        rowKey="id"
      />

      <Modal
        title={editingTrigger ? 'Edit Trigger' : 'Create Trigger'}
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingTrigger(null);
        }}
        footer={null}
        width={800}
      >
        <TriggerForm
          trigger={editingTrigger}
          onSuccess={() => {
            setIsModalVisible(false);
            setEditingTrigger(null);
            fetchTriggers();
          }}
        />
      </Modal>
    </div>
  );
};

export default TriggerList; 