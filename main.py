import RPi.GPIO as GPIO
import time
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# GPIO setup
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

# Define pins
LED_PIN = int(os.getenv('LED_PIN', 17))
RELAY_PIN = int(os.getenv('RELAY_PIN', 18))
IR_PIN = int(os.getenv('IR_PIN', 27))

# Setup pins
GPIO.setup(LED_PIN, GPIO.OUT)
GPIO.setup(RELAY_PIN, GPIO.OUT)
GPIO.setup(IR_PIN, GPIO.OUT)

def control_led(state):
    GPIO.output(LED_PIN, state)

def control_relay(state):
    GPIO.output(RELAY_PIN, state)

def send_ir_signal():
    # Example IR signal sending
    GPIO.output(IR_PIN, GPIO.HIGH)
    time.sleep(0.1)
    GPIO.output(IR_PIN, GPIO.LOW)

def cleanup():
    GPIO.cleanup()

if __name__ == "__main__":
    try:
        # Example usage
        print("Testing LED...")
        control_led(GPIO.HIGH)
        time.sleep(1)
        control_led(GPIO.LOW)

        print("Testing Relay...")
        control_relay(GPIO.HIGH)
        time.sleep(1)
        control_relay(GPIO.LOW)

        print("Testing IR...")
        send_ir_signal()

    except KeyboardInterrupt:
        print("\nProgram stopped by user")
    finally:
        cleanup() 