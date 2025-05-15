# Raspberry Pi MQTT Listener

Đây là một ứng dụng đơn giản chạy trên Raspberry Pi để lắng nghe và hiển thị các message MQTT từ hệ thống IoT.

## Cài đặt

1. Clone repository này vào Raspberry Pi:
```bash
git clone <repository-url>
cd raspberry_pi
```

2. Tạo file .env từ file mẫu:
```bash
cp .env.example .env
```

3. Chỉnh sửa file .env với các thông số phù hợp:
- MQTT_BROKER: địa chỉ MQTT broker
- MQTT_PORT: cổng MQTT broker
- MQTT_CLIENT_ID: ID của client MQTT

4. Cài đặt các thư viện Python cần thiết:
```bash
pip3 install -r requirements.txt
```

## Sử dụng

Chạy ứng dụng:
```bash
python3 src/mqtt_listener.py
```

Ứng dụng sẽ:
1. Kết nối với MQTT broker
2. Đăng ký lắng nghe tất cả các topic bắt đầu bằng "iot/devices/"
3. Hiển thị các message nhận được lên console

Để dừng ứng dụng, nhấn Ctrl+C. 