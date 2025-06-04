import time
import json
import RPi.GPIO as GPIO
import paho.mqtt.client as mqtt
import board
import digitalio
import adafruit_character_lcd.character_lcd as characterlcd
import subprocess
import pigpio 
# Thiết lập GPIO
GPIO.setmode(GPIO.BCM)
pi = pigpio.pi()
# Buzzer
BUZZER_PIN = 12
GPIO.setup(BUZZER_PIN, GPIO.OUT)
GPIO.output(BUZZER_PIN, False)

# IR Transmitter pin
IR_PIN = 17
GPIO.setup(IR_PIN, GPIO.OUT)
GPIO.output(IR_PIN, False)

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

# Biến lưu process phát nhạc hiện tại
current_music_process = None

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

# Phát nhạc từ YouTube
def play_music(search_query):
    global current_music_process

    try:
        # Nếu đang có bài phát → dừng trước
        if current_music_process is not None:
            current_music_process.terminate()
            current_music_process = None
            print("Đã dừng bài nhạc cũ.")

        # Lấy stream URL từ YouTube bằng yt-dlp
        cmd_get_url = [
    "python3", "-m", "yt_dlp",
    f"ytsearch1:{search_query}",
    "-f", "bestaudio",
    "--get-url"
]
        result = subprocess.run(cmd_get_url, capture_output=True, text=True)
        stream_url = result.stdout.strip()

        if stream_url:
            print(f"Đang phát: {search_query}")
            # Phát nhạc bằng mpv (audio only)
            current_music_process = subprocess.Popen(["mpv", "--no-video", stream_url])
        else:
            print("Không tìm thấy URL video.")
    except Exception as e:
        print(f"Lỗi khi phát nhạc: {e}")

def nec_send(pi, gpio, data):
    """
    Gửi mã NEC 32-bit trên gpio bằng pigpio.

    data: int mã NEC (ví dụ 0x20DF10EF)
    """
    MARK = 560  # microseconds bật sóng 38kHz
    SPACE = 560  # microseconds tắt sóng

    def send_mark(microseconds):
        pi.wave_add_generic([pigpio.pulse(1 << gpio, 0, microseconds)])
    
    def send_space(microseconds):
        pi.wave_add_generic([pigpio.pulse(0, 1 << gpio, microseconds)])

    # Tạo sóng 38kHz bật tắt (khoảng 26us chu kỳ, 50% duty cycle)
    def carrier(microseconds):
        cycles = int(microseconds / 26)
        pulses = []
        for _ in range(cycles):
            pulses.append(pigpio.pulse(1 << gpio, 0, 13))
            pulses.append(pigpio.pulse(0, 1 << gpio, 13))
        pi.wave_add_generic(pulses)

    pi.wave_clear()

    # Lead code NEC: MARK 9ms + SPACE 4.5ms
    carrier(9000)
    pi.wave_add_generic([pigpio.pulse(0, 1 << gpio, 4500)])

    # Gửi 32 bit data LSB first
    for i in range(32):
        bit = (data >> i) & 1
        carrier(MARK)
        if bit == 1:
            pi.wave_add_generic([pigpio.pulse(0, 1 << gpio, SPACE * 3)])  # 1 = 1.69ms space
        else:
            pi.wave_add_generic([pigpio.pulse(0, 1 << gpio, SPACE)])  # 0 = 560us space

    # Kết thúc bằng MARK
    carrier(MARK)

    wave_id = pi.wave_create()
    if wave_id >= 0:
        pi.wave_send_once(wave_id)
        while pi.wave_tx_busy():
            time.sleep(0.001)
        pi.wave_delete(wave_id)
    else:
        print("Tạo sóng IR lỗi!")

def send_ir_code(ir_code):
    try:
        # Chuyển hex string thành int
        code_int = int(ir_code, 16)
        print(f"Phát mã IR: {ir_code} (int: {code_int})")
        nec_send(pi, IR_PIN, code_int)
    except Exception as e:
        print(f"Lỗi khi phát IR: {e}")


# Callback MQTT khi nhận message
def on_message(client, userdata, message):
    global current_music_process

    topic = message.topic
    payload = message.payload
    print(f"Topic: {topic}, Payload: {payload}")

    device_id = topic.split("/")[-1]

    try:
        data = json.loads(current_music_process.payload.decode('utf-8'))
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

    elif device_id == "24":  # Speaker
        if data.get("isOn") is False:
            if current_music_process is not None:
                current_music_process.terminate()
                current_music_process = None
                print("Đã dừng nhạc.")
            else:
                print("Không có nhạc đang phát.")
        else:
            search_query = data.get("search")
            if search_query:
                print(f"Tìm kiếm: {search_query}")
                # play_music(search_query)
            else:
                print("Thiếu thông tin 'search' trong payload!")

    elif device_id == "25":  # IR module
        ir_code = data.get("irCode")
        if ir_code:
            send_ir_code(ir_code)
        else:
            print("Thiếu thông tin 'irCode' trong payload!")

# Khi kết nối MQTT
def on_connect(client, userdata, flags, rc):
    print("Đã kết nối MQTT với code: " + str(rc))
    client.subscribe("iot/device/#")

# Cấu hình MQTT
client = mqtt.Client("RaspiClient")
client.on_connect = on_connect
client.on_message = on_message

# Địa chỉ MQTT broker (sửa lại IP cho đúng mạng của bạn)
broker_address = "34.126.118.248"
client.connect(broker_address, 1883, 60)

# Vòng lặp chính
try:
    client.loop_forever()
except KeyboardInterrupt:
    print("Dừng chương trình.")
    GPIO.cleanup()
    if current_music_process is not None:
        current_music_process.terminate()
