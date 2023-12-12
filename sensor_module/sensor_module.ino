// For the sensor
#include <Adafruit_Sensor.h>
#include <DHT_U.h>
#include <DHT.h>

#include <ESP8266WiFi.h> // For the WiFi
#include <string.h>      // For String manipulation

// Configuration header with WiFi creds, and backend app address
#include "config.h"

// Initialize the sensor
DHT dht11(4, DHT11);

void setup() {

  // Start the sensor
  dht11.begin();
  Serial.begin(115200);

  // Connect to the WiFi network
  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(SSID);

  // Tell the ESP8266 to be a client, not an access point
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  static bool wait = false;

  Serial.println("~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  Serial.print("Connecting to host: ");
  Serial.println(LOCAL_HOST);

  WiFiClient client;
  if (!client.connect(LOCAL_HOST, PORT)) {
    Serial.println("connection failed");
    delay(5000);
    return;
  }

  // This will send a string to the server
  Serial.println("Connected.\nSending data to server:");
  if (!client.connected())
    return;

  // ~~~~~~~~~~~~~~~~ START SENDING POST ~~~~~~~~~~~~~~~~~

  // Reads temp/rh and formats data as JSON string
  float temp = 32.0 + (1.8 * dht11.readTemperature());
  float rh   = dht11.readHumidity();
  char str_temp[8];
  char str_rh[5];
  dtostrf(temp, 4, 2, str_temp);
  dtostrf(rh, 4, 2, str_rh);

  // format data as JSON to send
  int length = 43 + strlen(MODULE_ID);
  char data[length];
  sprintf(data, "{\"id\":\"%s\",\"temp\":\"%s\",\"rh\":\"%s\"}\r", MODULE_ID, str_temp, str_rh);

  char request[300];
  sprintf(request,
    "POST /data HTTP/1.1\r\n"
    "Host: %s\r\n"
    "User-Agent: DogNodeMCU\r\n"
    "Accept: */*\r\n"
    "Content-Type: application/JSON\r\n"
    "Content-Length: %d\r\n\r\n"
    "%s", LOCAL_HOST, strlen(data), data);
  
  Serial.println("Sending the following request:");
  Serial.println("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  Serial.println(request);
  client.println(request);
  Serial.println("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");

  // ~~~~~~~~~~~~~~~~~ DONE SENDING POST ~~~~~~~~~~~~~~~~~

  // wait for data to be available
  unsigned long timeout = millis();
  while (client.available() == 0) {
    if (millis() - timeout > 5000) {
      Serial.println(">>> Client Timeout !");
      client.stop();
      delay(60000);
      return;
    }
  }

  // Read all the lines of the reply from server and print them to Serial
  Serial.println("Receiving from server");
  while (client.available()) {
    char ch = static_cast<char>(client.read());
    Serial.print(ch);
  }

  // Close the connection
  Serial.println();
  Serial.println("closing connection");
  Serial.println("~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  client.stop();

  delay(900000);  // delay 15 seconds!
}
