import time
import json
import RPi.GPIO as GPIO
import paho.mqtt.client as mqtt
import board
import digitalio
import adafruit_character_lcd.character_lcd as characterlcd

# Thiết lập GPIO
GPIO.setmode(GPIO.BCM)

# Buzzer
BUZZER_PIN = 5
GPIO.setup(BUZZER_PIN, GPIO.OUT)
GPIO.output(BUZZER_PIN, False)

# Stepper pins (6, 13, 19, 26)
StepPins = [6, 13, 19, 26]
for pin in StepPins:
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, False)

# LED RGB pins (12, 16, 20)
LED_R = 12
LED_G = 16
LED_B = 20
GPIO.setup(LED_R, GPIO.OUT)
GPIO.setup(LED_G, GPIO.OUT)
GPIO.setup(LED_B, GPIO.OUT)
GPIO.output(LED_R, False)
GPIO.output(LED_G, False)
GPIO.output(LED_B, False)

# LCD setup (21, 22, 23, 24, 25, 8)
lcd_rs = digitalio.DigitalInOut(board.D21)
lcd_en = digitalio.DigitalInOut(board.D22)
lcd_d4 = digitalio.DigitalInOut(board.D23)
lcd_d5 = digitalio.DigitalInOut(board.D24)
lcd_d6 = digitalio.DigitalInOut(board.D25)
lcd_d7 = digitalio.DigitalInOut(board.D8)

lcd_columns = 16
lcd_rows = 2

lcd = characterlcd.Character_LCD_Mono(
    lcd_rs, lcd_en, lcd_d4, lcd_d5, lcd_d6, lcd_d7,
    lcd_columns, lcd_rows
)

# Hàm quay stepper
def stepper_rotate(rotations=1, delay=0.002):
    seq = [
        [1,0,0,1],
        [1,0,0,0],
        [1,1,0,0],
        [0,1,0,0],
        [0,1,1,0],
        [0,0,1,0],
        [0,0,1,1],
        [0,0,0,1]
    ]
    steps_per_rev = 64 * 8  # 512 steps (full rotation)
    total_steps = int(steps_per_rev * rotations)
    for _ in range(total_steps):
        for step in seq:
            for pin in range(4):
                GPIO.output(StepPins[pin], step[pin])
            time.sleep(delay)
    # Tắt tất cả coil sau khi quay
    for pin in StepPins:
        GPIO.output(pin, False)

# Bật LED RGB với màu tùy chọn
def led_rgb_on(color):
    GPIO.output(LED_R, False)
    GPIO.output(LED_G, False)
    GPIO.output(LED_B, False)

    if color.lower() == "red":
        GPIO.output(LED_R, True)
    elif color.lower() == "green":
        GPIO.output(LED_G, True)
    elif color.lower() == "blue":
        GPIO.output(LED_B, True)
    else:
        print(f"Màu '{color}' không hợp lệ!")

# Tắt LED RGB
def led_rgb_off():
    GPIO.output(LED_R, False)
    GPIO.output(LED_G, False)
    GPIO.output(LED_B, False)

# Callback MQTT khi nhận message
def on_message(client, userdata, message):
    topic = message.topic
    payload = message.payload.decode("utf-8")
    print(f"Topic: {topic}, Payload: {payload}")

    device_id = topic.split("/")[-1]
    
    try:
        data = json.loads(payload)
    except Exception as e:
        print(f"Lỗi payload JSON: {e}")
        return

    if device_id == "20":  # Buzzer
        if data.get("isOn"):
            GPIO.output(BUZZER_PIN, True)
            time.sleep(0.5)
            GPIO.output(BUZZER_PIN, False)
        else:
            GPIO.output(BUZZER_PIN, False)

    elif device_id == "21":  # Stepper
        if data.get("isOn"):
            stepper_rotate(3)
        else:
            # Stepper không có lệnh tắt, nên chỉ dừng nếu cần
            pass

    elif device_id == "22":  # LCD
        if data.get("isOn") is False:
            lcd.clear()
        else:
            display_text = data.get("displayText")
            if display_text:
                lcd.clear()
                lcd.message = display_text

    elif device_id == "23":  # LED RGB
        if data.get("isOn"):
            color = data.get("color")
            if color:
                led_rgb_on(color)
                time.sleep(10)
                led_rgb_off()
            else:
                print("Thiếu thông tin 'color' trong payload!")
        else:
            led_rgb_off()

# Khi kết nối MQTT
def on_connect(client, userdata, flags, rc):
    print("Đã kết nối MQTT với code: " + str(rc))
    client.subscribe("iot/device/#")

# Cấu hình MQTT
client = mqtt.Client("RaspiClient")
client.on_connect = on_connect
client.on_message = on_message

# Địa chỉ MQTT broker (sửa lại IP cho đúng mạng của bạn)
broker_address = "192.168.1.49"
client.connect(broker_address, 1883, 60)

# Vòng lặp chính
try:
    client.loop_forever()
except KeyboardInterrupt:
    print("Dừng chương trình.")
    GPIO.cleanup()
