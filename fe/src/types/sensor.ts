export interface SensorData {
    device_id: string;
    timestamp: string;
    temperature: number;
    humidity: number;
    light_level: number;
    soil_moisture?: number;
    location: string;
    type: string;
    stats?: {
        temperature: {
            min: number;
            max: number;
            avg: number;
        };
        humidity: {
            min: number;
            max: number;
            avg: number;
        };
        light_level: {
            min: number;
            max: number;
            avg: number;
        };
        soil_moisture: {
            min: number;
            max: number;
            avg: number;
        };
        battery: {
            min: number;
            max: number;
            avg: number;
        };
        record_count: number;
    };
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