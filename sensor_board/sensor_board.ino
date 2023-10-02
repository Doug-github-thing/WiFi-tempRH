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

#define HOST "192.168.0.39"
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
    // try to connect to the host, and blink to show if it can't
    if (!client.connect(HOST, port)) {
        digitalWrite(LED_BUILTIN, HIGH);
        delay(100);
        digitalWrite(LED_BUILTIN, LOW);
        delay(200);
        return;
    }

    while (client.connected()) {

        // intialize real data values to send, save as string
        // since AVR controllers don't support sprintf for floats
        float temp = 32.0 + (1.8 * aht20.getTemperature());
        float rh   = aht20.getHumidity();
        char str_temp[8];
        char str_rh[5];
        dtostrf(temp, 4, 2, str_temp);
        dtostrf(rh, 4, 2, str_rh);

        // The HTTP command sent by curl to my ExpressJS app on Vercel
        // I want to emulate this Request to send it from this ESP client:

        // > POST /data HTTP/2
        // > Host: <MY_APP_HOSTNAME>
        // > user-agent: curl/7.81.0
        // > accept: */*
        // > content-type: application/json
        // > content-length: 25

        // But for now, this request hits my ExpressJS server when locally hosted
        client.println("\r\nPOST /data HTTP/1.1");
        char host[];
        sprintf(host, "Host: %s:%d", HOST, port);
        client.println(host);
        client.println("User-Agent: Doug's TempRH Board/1.0");
        client.println("Accept: */*");
        client.println("Content-Type: application/json");

        // format data as JSON to send
        char data[36];
        sprintf(data, "{\"temp\":\"%s\",\"rh\":\"%s\"}", str_temp, str_rh);

        // compute length of the data JSON string
        int content_len = 0;
        while(data[content_len])
            content_len++;

        // format content-length header
        char content_len_str[23];
        sprintf(content_len_str, "Content-Length: %d\r\n\r\n", content_len + 2);

        client.println(content_len_str);
        client.println(data);

        delay(5000);
    }
}
