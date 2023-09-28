// This is being written and tested on an Arduino Uno, but the
// intention is to swap it out for an Atmega328p once the software
// reaches a point where it feels like I am taking this project
// seriously enough to start spending money on hardware.

#include <AHT20.h>
#include <Wire.h>
#include "WiFiEsp.h"
#include "SoftwareSerial.h"

#include "WiFiCredentials.h"
char ssid[] = SSID;              // imported from WiFiCredentials.h
char pass[] = PASSWORD;          // imported from WiFiCredentials.h
int status = WL_IDLE_STATUS;     // the Wifi radio's status
SoftwareSerial Serial1(6, 7);    // RX, TX

WiFiEspClient client;
AHT20 aht20;

char url[15] = "192.168.0.39";
int port = 3000;


void setup()
{
    pinMode(LED_BUILTIN, OUTPUT);
    Wire.begin();

    // if unable to read the sensor, blink furiously
    if (aht20.begin() == false) {
        byte hilow = 0;
        for(;;) {
            hilow = hilow == 0 ? 1 : 0; 
            digitalWrite(LED_BUILTIN, hilow);
            delay(100);
        }
    }

    // initialize ESP module
    Serial1.begin(9600);
    WiFi.init(&Serial1);

    // attempt to connect to WiFi network
    while (status != WL_CONNECTED) {
        status = WiFi.begin(ssid, pass);
    }
  
    // blink to show it's live
    byte hilow = 0;
    for(int i = 0; i < 10; i++) {
        hilow = hilow == 0 ? 1 : 0; 
        digitalWrite(LED_BUILTIN, hilow);
        delay(100);
    }
}


void loop()
{
    if (!client.connect(url, port))
        return;

    while (client.connected()) {

        char data[28] = "";
        sprintf(data, "{\"temp\":\"%.1f\",\"rh\":\"%.1f\"}", 69.68123, 42.3243);

        client.print("\r\nPOST /data HTTP/1.1\r\n");
        client.print("Host: ");
        client.print(url);
        client.print(":");
        client.print(port);
        client.print("\r\nContent-Type: application/json\r\n");
        client.print("Content-Length: 29\r\n\r\n");
        client.print("{\"temp\":\"");
        client.print(22.2);
        client.print("\",\"rh\":\"");
        client.print(66.6);
        client.print("\"}\r\n");
        client.println("\r\n");

        //   client.print(32 + (1.8 * aht20.getTemperature()));
        //   client.print(aht20.getHumidity());
        break;
    }
    delay(10000);
}
