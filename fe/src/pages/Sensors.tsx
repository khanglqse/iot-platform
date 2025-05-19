import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Alert, Button, Tabs, Badge } from 'antd';
import sensorService, { LocationData, SensorData } from '../services/sensorService';
import SensorDisplay from '../components/SensorDisplay';
import SensorHistoryChart from '../components/SensorHistoryChart';

const { Title } = Typography;

const { TabPane } = Tabs;

const Sensors: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sensorData, setSensorData] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<SensorData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  useEffect(() => {
    fetchSensorData();
  }, []);
    useEffect(() => {
    // When a location is selected, and we're on the history tab, fetch the history data
    if (selectedLocation && activeTab === '2') {
      const sensor = getSelectedSensor();
      if (sensor) {
        fetchSensorHistory(sensor.device_id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation, activeTab]);

  const fetchSensorData = async () => {
    try {
      setLoading(true);
      const data = await sensorService.getAllSensors();
      setSensorData(data.locations);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sensor data');
      console.error('Error fetching sensor data:', err);
    } finally {
      setLoading(false);
    }
  };  const getSelectedLocationData = () => {
    if (!selectedLocation) {
      return null;
    }
    return sensorData.find(loc => loc.location === selectedLocation) || null;
  };
    const getSelectedSensor = () => {
    const locationData = getSelectedLocationData();
    return locationData?.sensors[0] || null;
  };
  
  const fetchSensorHistory = async (deviceId: string, startDate?: Date, endDate?: Date) => {
    try {
      setHistoryLoading(true);
      const data = await sensorService.getSensorHistory(deviceId, startDate, endDate);
      setHistoryData(data);
    } catch (err) {
      console.error('Error fetching sensor history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    
    // Fetch history data when switching to the history tab
    if (key === '2' && getSelectedSensor()) {
      fetchSensorHistory(getSelectedSensor()!.device_id);
    }
  };
  
  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    const sensor = getSelectedSensor();
    if (sensor && dates[0] && dates[1]) {
      fetchSensorHistory(sensor.device_id, dates[0], dates[1]);
    }
  };
    const renderLocationCard = (location: LocationData) => {
    // Define appropriate icons based on location
    const getLocationIcon = (locName: string) => {
      switch(locName.toLowerCase()) {
        case 'living_room': return '🛋️';
        case 'bed_room': return '🛏️';
        case 'kitchen': return '🍳';
        case 'bathroom': return '🚿';
        case 'garden': return '🌿';
        case 'office': return '💼';
        default: return '🏠';
      }
    };

    const icon = getLocationIcon(location.location);
    const isSelected = selectedLocation === location.location;
    
    return (
      <Col xs={24} sm={12} md={8} lg={6} xl={6} key={location.location}>
        <Card 
          style={{ 
            cursor: 'pointer',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: isSelected 
              ? '0 4px 12px rgba(24, 144, 255, 0.3)' 
              : '0 2px 8px rgba(0, 0, 0, 0.09)',
            border: isSelected ? '2px solid #1890ff' : 'none',
            transition: 'all 0.3s ease'
          }}
          onClick={() => {
            setSelectedLocation(location.location);
          }}
          hoverable
          bodyStyle={{ padding: '16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div 
              style={{ 
                fontSize: '24px',
                marginRight: '12px',
                backgroundColor: isSelected ? '#1890ff' : '#f5f5f5',
                color: isSelected ? 'white' : '#666',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              {icon}
            </div>
            <Title level={4} style={{ margin: 0, color: isSelected ? '#1890ff' : 'inherit' }}>
              {location.location.replace(/_/g, ' ').toUpperCase()}
            </Title>
          </div>
          
          <div style={{ 
            backgroundColor: isSelected ? '#e6f7ff' : '#f9f9f9',
            padding: '8px 12px',
            borderRadius: '6px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '13px', color: '#888' }}>Device ID</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: isSelected ? '#1890ff' : '#333' }}>
              {location.sensors[0]?.device_id || 'No device'}
            </div>
            <div style={{ fontSize: '13px', marginTop: '8px', color: '#888' }}>Type</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: isSelected ? '#1890ff' : '#333' }}>
              {location.sensors[0]?.type || 'Unknown'}
            </div>
          </div>
        </Card>
      </Col>
    );
  };


  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Card bordered={false} style={{ marginBottom: 24, borderRadius: '8px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>Sensor Dashboard</Title>
          </Col>
        </Row>
      </Card>
      
      <div style={{ marginBottom: 24 }}>
        <Card
          title={<Title level={4} style={{ margin: 0 }}>Select a Location</Title>}
          bordered={false}
          style={{ borderRadius: '8px' }}
        >
          <Row gutter={[16, 16]}>
            {sensorData.map(location => renderLocationCard(location))}
          </Row>
        </Card>
      </div>
      
      {selectedLocation && (
        <div style={{ marginBottom: 32 }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Title level={3} style={{ margin: 0 }}>
                  {selectedLocation.replace(/_/g, ' ').toUpperCase()}
                </Title>
                <Button 
                  type="primary"
                  onClick={() => setSelectedLocation(null)}
                >
                  Back to Locations
                </Button>
              </div>
            }
            bordered={false}
            style={{ borderRadius: '8px' }}
          >
            {getSelectedSensor() && (
              <Tabs 
                defaultActiveKey="1" 
                onChange={handleTabChange}
                activeKey={activeTab}
                type="card"
                style={{ marginTop: 16 }}
              >
                <Tabs.TabPane tab="Current Data" key="1">
                  <SensorDisplay data={getSelectedSensor()!} />
                </Tabs.TabPane>
                <Tabs.TabPane tab="History" key="2">
                  <SensorHistoryChart 
                    data={historyData} 
                    loading={historyLoading}
                    onDateRangeChange={handleDateRangeChange}
                  />
                </Tabs.TabPane>
              </Tabs>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Sensors;