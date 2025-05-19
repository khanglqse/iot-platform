import React from 'react';
import { Card, Row, Col, DatePicker } from 'antd';
import { Line } from '@ant-design/plots';
import { SensorStatsResponse } from '../types/sensor';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface SensorChartProps {
    data: SensorStatsResponse[];
    onDateRangeChange: (dates: [Date, Date]) => void;
}

const SensorChart: React.FC<SensorChartProps> = ({ data, onDateRangeChange }) => {
    const temperatureConfig = {
        data,
        xField: 'date',
        yField: 'avg_temperature',
        seriesField: 'device_id',
        point: {
            size: 5,
            shape: 'diamond',
        },
        label: {
            style: {
                fill: '#aaa',
            },
        },
    };

    const humidityConfig = {
        data,
        xField: 'date',
        yField: 'avg_humidity',
        seriesField: 'device_id',
        point: {
            size: 5,
            shape: 'diamond',
        },
        label: {
            style: {
                fill: '#aaa',
            },
        },
    };

    const lightConfig = {
        data,
        xField: 'date',
        yField: 'avg_light_level',
        seriesField: 'device_id',
        point: {
            size: 5,
            shape: 'diamond',
        },
        label: {
            style: {
                fill: '#aaa',
            },
        },
    };

    const soilMoistureConfig = {
        data,
        xField: 'date',
        yField: 'avg_soil_moisture',
        seriesField: 'device_id',
        point: {
            size: 5,
            shape: 'diamond',
        },
        label: {
            style: {
                fill: '#aaa',
            },
        },
    };

    const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
        if (dates && dates[0] && dates[1]) {
            onDateRangeChange([dates[0].toDate(), dates[1].toDate()]);
        }
    };

    return (
        <div className="sensor-charts">
            <div className="chart-header">
                <h3>Sensor Data History</h3>
                <RangePicker onChange={handleDateRangeChange} />
            </div>
            <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                    <Card title="Temperature History">
                        <Line {...temperatureConfig} />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="Humidity History">
                        <Line {...humidityConfig} />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="Light Level History">
                        <Line {...lightConfig} />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="Soil Moisture History">
                        <Line {...soilMoistureConfig} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SensorChart; 