# IoT Backend System

Hệ thống backend cho IoT với các tính năng:
- Nhận diện giọng nói
- Điều khiển thiết bị qua MQTT
- Lưu trữ dữ liệu với MongoDB
- Containerized với Docker

## Cài đặt

1. Đảm bảo đã cài đặt Docker và Docker Compose
2. Clone repository
3. Di chuyển vào thư mục backend:
```bash
cd be
```

4. Khởi động hệ thống:
```bash
docker-compose up --build
```

## API Endpoints

### Voice Command
- POST `/voice-command`
  - Gửi file audio để xử lý lệnh thoại
  - Trả về text được nhận diện và trạng thái xử lý

### Devices
- GET `/devices`
  - Lấy danh sách các thiết bị
- POST `/devices`
  - Thêm thiết bị mới

## MQTT Topics

- `iot/devices/#` - Topic cho tất cả thiết bị
- `iot/devices/light` - Topic điều khiển đèn

## Cấu hình

Các biến môi trường có thể được cấu hình trong file `.env`:
- MONGODB_URL
- MQTT_BROKER
- MQTT_PORT 