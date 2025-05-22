#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Wi-Fi credentials
const char* ssid = "KHANG 1";
const char* password = "123456789";

// MQTT broker (IP của máy laptop chạy Docker Mosquitto)
const char* mqtt_server = "192.168.101.6";
const int mqtt_port = 1883;
const char* mqtt_topic = "iot/devices/1";

// LED nối vào GPIO2
const int ledPin = 32;

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(100);
  Serial.print("Connecting to SSID: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  unsigned long startAttemptTime = millis();

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    Serial.print(" WiFi status: ");
    Serial.println(WiFi.status());

    if (millis() - startAttemptTime > 10000) {
      Serial.println("\nFailed to connect to WiFi.");
      while (true); // Ngưng lại thay vì reset để debug
    }
  }

  Serial.println("\nWiFi connected. IP address: ");
  Serial.println(WiFi.localIP());
}



void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  Serial.write(payload, length);
  Serial.println();

  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }

  if (doc.containsKey("isOn")) {
    bool isOn = doc["isOn"];
    digitalWrite(ledPin, isOn ? HIGH : LOW);
    Serial.print("LED set to: ");
    Serial.println(isOn ? "ON" : "OFF");
  }
}


void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32Client")) {
      Serial.println("connected");
      client.subscribe(mqtt_topic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 1 second");
      delay(1000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000); // Chờ ổn định
  
  WiFi.mode(WIFI_STA); // Rất quan trọng, đặt ESP32 vào chế độ Station trước khi scan

  Serial.println("Scanning WiFi...");
  int n = WiFi.scanNetworks();
  for (int i = 0; i < n; ++i) {
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.println(WiFi.SSID(i));
  }

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  setup_wifi();

  // Kích hoạt MQTT sau khi đã kết nối Wi-Fi
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}


void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
