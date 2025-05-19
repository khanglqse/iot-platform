import React from 'react';
import { SensorData } from '../types/sensor';
import './SensorDisplay.css';

interface SensorDisplayProps {
    data: SensorData;
}

const SensorDisplay: React.FC<SensorDisplayProps> = ({ data }) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="sensor-container">
            <div className="sensor-header">
                <h2>Device: {data.device_id}</h2>
                <span className="location-badge">{data.location}</span>
                <span className="type-badge">{data.type}</span>
            </div>
            
            <div className="sensor-timestamp">
                Last Updated: {formatDate(data.timestamp)}
            </div>

            <div className="sensor-grid">
                <div className="sensor-card">
                    <div className="sensor-icon">🌡️</div>
                    <div className="sensor-value">{data.temperature}°C</div>
                    <div className="sensor-label">Temperature</div>
                </div>

                <div className="sensor-card">
                    <div className="sensor-icon">💧</div>
                    <div className="sensor-value">{data.humidity}%</div>
                    <div className="sensor-label">Humidity</div>
                </div>

                <div className="sensor-card">
                    <div className="sensor-icon">☀️</div>
                    <div className="sensor-value">{data.light_level}</div>
                    <div className="sensor-label">Light Level</div>
                </div>

                <div className="sensor-card">
                    <div className="sensor-icon">🌱</div>
                    <div className="sensor-value">{data.soil_moisture}%</div>
                    <div className="sensor-label">Soil Moisture</div>
                </div>
            </div>
        </div>
    );
};

export default SensorDisplay; 