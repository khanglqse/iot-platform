import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Alert, Button } from 'antd';
import sensorService, { LocationData } from '../services/sensorService';
import SensorDisplay from '../components/SensorDisplay';

const { Title } = Typography;

const Sensors: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sensorData, setSensorData] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    fetchSensorData();
  }, []);

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
  
  const renderLocationCard = (location: LocationData) => (
    <Col xs={24} sm={12} md={8} lg={6} xl={6} key={location.location}>
      <Card 
        style={{ 
          marginBottom: 16, 
          cursor: 'pointer',
          border: selectedLocation === location.location ? '2px solid #1890ff' : '1px solid #f0f0f0' 
        }}
        onClick={() => {
          setSelectedLocation(location.location);
        }}
        hoverable
      >
        <Title level={4} style={{ marginBottom: 8 }}>
          {location.location.replace(/_/g, ' ').toUpperCase()}
        </Title>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
            Sensor: {location.sensors[0]?.device_id || 'None'}
          </div>
        </div>
      </Card>
    </Col>
  );


  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Sensor Dashboard</Title>
        </Col>
      </Row>
      
      <div>
        <Title level={4} style={{ marginBottom: 16 }}>
          Select a location to view sensors
        </Title>
        <Row gutter={[16, 16]}>
          {sensorData.map(location => renderLocationCard(location))}
        </Row>
      </div>      {selectedLocation && (
        <div style={{ marginTop: 32, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Title level={3}>
              {selectedLocation.replace(/_/g, ' ').toUpperCase()} SENSOR
            </Title>
            <Button 
              type="primary"
              onClick={() => setSelectedLocation(null)}
            >
              Back to Locations
            </Button>
          </div>
          
          {getSelectedSensor() && (
            <SensorDisplay data={getSelectedSensor()!} />
          )}
        </div>
      )}
    </div>
  );
};

export default Sensors;