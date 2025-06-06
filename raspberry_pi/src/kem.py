import speech_recognition as sr
from playsound import playsound
import requests
import os
import urllib3
import pygame
# Tắt cảnh báo SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Đường dẫn file âm thanh phản hồi
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESPONSE_AUDIO_PATH = os.path.join(BASE_DIR, "kem2.mp3")
OK_PATH = os.path.join(BASE_DIR, "ok.mp3")

# URL backend
BACKEND_URL = "https://34.126.118.248/api/process-text"

# Khởi tạo nhận diện giọng nói
recognizer = sr.Recognizer()
mic = sr.Microphone()

def listen_and_recognize(timeout=None, phrase_time_limit=None):
    with mic as source:
        recognizer.adjust_for_ambient_noise(source, duration=2)
        print("🎙️ Đang lắng nghe...")
        try:
            audio = recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)
            text = recognizer.recognize_google(audio, language="vi-VN")
            print(f"📢 Nghe được: {text}")
            return text
        except sr.UnknownValueError:
            print("❌ Không thể nhận diện âm thanh.")
        except sr.WaitTimeoutError:
            print("⌛ Không nghe thấy gì trong thời gian chờ.")
        except sr.RequestError as e:
            print(f"❌ Lỗi kết nối Google Speech API: {e}")
        return None
def play_response_sound(input):
    try:
        pygame.mixer.init()
        pygame.mixer.music.load(input)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            continue
        pygame.mixer.quit()
    except Exception as e:
        print(f"❌ Lỗi phát âm thanh: {e}")

def send_message_to_backend(message):
    payload = {"text": message}
    try:
        response = requests.post(BACKEND_URL, json=payload, verify=False)
        print(f"📨 Đã gửi: {payload}, Phản hồi: {response.status_code}")
    except Exception as e:
        print(f"❌ Lỗi gửi dữ liệu: {e}")

def main():
    print("🚀 Trợ lý KEM đang chờ lệnh...")

    while True:
        try:
            # Lắng nghe để phát hiện từ khóa
            wake_text = listen_and_recognize(timeout=5, phrase_time_limit=3)
            if wake_text:
                lowered = wake_text.lower()
                if "kem ơi" in lowered or "em ơi" in lowered:
                    print("🟢 Nhận diện từ khóa kích hoạt.")
                    play_response_sound(RESPONSE_AUDIO_PATH)
                    print("🎤 Mời bạn nói yêu cầu...")
                    command = listen_and_recognize(timeout=5, phrase_time_limit=7)
                    if command:
                        play_response_sound(OK_PATH)
                        send_message_to_backend(command)
        except KeyboardInterrupt:
            print("\n🛑 Kết thúc bởi người dùng.")
            break
        except Exception as e:
            print(f"❗ Lỗi không mong muốn: {e}")

if __name__ == "__main__":
    main()
