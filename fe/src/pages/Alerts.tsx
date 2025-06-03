import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Space, Typography, Layout, Spin, Alert, Button, Popconfirm, message } from 'antd';
import { AlertOutlined, WarningOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAllAlerts, deleteAlert, Alert as AlertType, PaginatedResponse } from '../services/alertService';

const { Title } = Typography;
const { Content } = Layout;

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0
  });

  useEffect(() => {
    fetchAlerts();
  }, [pagination.current, pagination.pageSize]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const skip = (pagination.current - 1) * pagination.pageSize;
      const data = await getAllAlerts(skip, pagination.pageSize);
      setAlerts(data.items);
      setPagination(prev => ({
        ...prev,
        total: data.total
      }));
      setError(null);
    } catch (err) {
      setError('Failed to fetch alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await deleteAlert(alertId);
      message.success('Alert deleted successfully');
      fetchAlerts();
    } catch (err) {
      message.error('Failed to delete alert');
      console.error('Error deleting alert:', err);
    }
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CRITICAL':
        return 'error';
      case 'WARNING':
        return 'warning';
      default:
        return 'processing';
    }
  };

  const columns = [
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Loại cảm biến',
      dataIndex: 'sensor_type',
      key: 'sensor_type',
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Nội dung',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: unknown, record: AlertType) => (
        <Space>
          <Popconfirm
            title="Bạn có chắc muốn xóa cảnh báo này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <Title level={2}>Cảnh báo</Title>
        <Card>
          <Table
            columns={columns}
            dataSource={alerts}
            rowKey="id"
            pagination={pagination}
            onChange={handleTableChange}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default Alerts; 