export interface SensorData {
    device_id: string;
    timestamp: string;
    temperature: number;
    humidity: number;
    light_level: number;
    soil_moisture: number;
    location: string;
    type: string;
}

export interface LocationData {
    location: string;
    sensors: SensorData[];
}

export interface SensorDashboardData {
    locations: LocationData[];
}

export interface SensorStatsResponse {
    date: string;
    avg_temperature: number;
    avg_humidity: number;
    avg_light_level: number;
    avg_soil_moisture: number;
    location: string;
}

export interface PaginatedSensorResponse {
    items: SensorData[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
} 