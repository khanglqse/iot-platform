#!/bin/bash

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y python3-pip python3-dev
sudo apt-get install -y mosquitto mosquitto-clients

# Install Python dependencies
pip3 install -r requirements.txt

# Create service file
sudo tee /etc/systemd/system/iot-controller.service << EOF
[Unit]
Description=IoT Device Controller Service
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/iot-controller
ExecStart=/usr/bin/python3 /home/pi/iot-controller/src/device_controller.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable iot-controller
sudo systemctl start iot-controller

echo "Setup completed. Service is running." 