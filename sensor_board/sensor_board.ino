// For the sensor
#include <Adafruit_Sensor.h>
#include <DHT_U.h>
#include <DHT.h>

// For the WiFi
#include <ESP8266WiFi.h>

// Configuration header with WiFi creds, and backend app address
#include "WiFiCredentials.h"

// If this boolean variable is true, 
// the board will connect to the local host, defined in WiFiCredentials.h.
// If false, will attempt to connect to the cloud host, defined in WiFiCredentials.h.
boolean local = true;
const char* HOST = local ? LOCAL_HOST : REMOTE_HOST;

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
  Serial.print("connecting to ");
  Serial.print(HOST);
  Serial.print(':');
  Serial.println(PORT);

  // Use WiFiClient class to create TCP connections
  WiFiClient client;
  if (!client.connect(HOST, PORT)) {
    Serial.println("connection failed");
    delay(5000);
    return;
  }

  // This will send a string to the server
  Serial.println("sending data to server");
  if (!client.connected())
    return;

  // ~~~~~~~~~~~~~~~~ START SENDING POST ~~~~~~~~~~~~~~~~~

  // Reads temp/rh and formats data as JSON string
  // char str_temp[5] = "00.0";
  // char str_rh[5]   = "00.0";
  float temp = 32.0 + (1.8 * dht11.readTemperature());
  float rh   = dht11.readHumidity();
  char str_temp[8];
  char str_rh[5];
  dtostrf(temp, 4, 2, str_temp);
  dtostrf(rh, 4, 2, str_rh);

  // format data as JSON to send
  char data[36];
  sprintf(data, "{\"temp\":\"%s\",\"rh\":\"%s\"}\r\n", str_temp, str_rh);

  // Send the headers, then the data
  client.println("POST /data HTTP/1.1");
  client.print("Host: ");
  client.print(HOST);
  client.println("user-agent: Doug's TempRH Board/1.0");
  client.println("accept: */*");
  // client.println("Connection: close");
  client.println("content-type: application/json");
  client.println("content-length: 29");
  client.println();
  client.println(data);

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
  Serial.println("receiving from remote server");
  // not testing 'client.connected()' since we do not need to send data here
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
