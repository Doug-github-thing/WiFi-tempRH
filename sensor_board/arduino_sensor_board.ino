// // This is being written and tested on an Arduino Uno, but the
// // intention is to swap it out for an Atmega328p once the software
// // reaches a point where it feels like I am taking this project
// // seriously enough to start spending money on hardware.

// #include <AHT20.h>
// #include "WiFiEsp.h"
// #include "SoftwareSerial.h"
// #include "WiFiCredentials.h"

// SoftwareSerial Serial1(6, 7);    // RX, TX

// WiFiEspClient client;
// AHT20 aht20;

// // a variable so I can quickly swap between "pushing to local/remote backend" modes
// // for testing why one works and the other doesn't
// bool local = true;

// // set HOST based on value of bool descripter "local"
// // hostnames imported from WiFICredentials.h for security
// #define HOST local ? LOCAL_HOST : REMOTE_HOST
// #define PORT local ? 3000 : 443

// void setup()
// {
//     pinMode(LED_BUILTIN, OUTPUT);

//     // if unable to read the sensor, blink furiously
//     if (aht20.begin() == false) {
//         for(;;) {
//             blink(LED_BUILTIN, 2);
//         }
//     }

//     // initialize ESP module
//     Serial1.begin(9600);
//     WiFi.init(&Serial1);

//     // attempt to connect to WiFi network
//     int status = WL_IDLE_STATUS;     // default Wifi radio's status
//     while (status != WL_CONNECTED) {
//         // SSID and PASSWORD imported from WiFiCredentials.h
//         status = WiFi.begin(SSID, PASSWORD);
//     }
  
//     // blink to show it's live
//     blink(LED_BUILTIN, 5);
// }

// void loop()
// {
//     // try to connect to the host, and blink to show if it can't
//     if (!client.connect(HOST, PORT)) {
//         blink(LED_BUILTIN, 3);
//         return;
//     }

//     while(client.connected()) {
//         sendPOST();
//         blink(LED_BUILTIN, 2);
//         delay(5000);
//     }

//     client.stop();
// }

// void blink(byte pin, int times) {
//     byte hilow = 0;
//     for(int i = 0; i < 2 * times; i++) {
//         hilow = hilow == 0 ? 1 : 0; 
//         digitalWrite(pin, hilow);
//         delay(100);
//     }
// }


// // send the request over the client
// void sendPOST() {

//     // intialize real data values to send, save as string
//     // since AVR controllers don't support sprintf for floats
//     // float temp = 32.0 + (1.8 * aht20.getTemperature());
//     // float rh   = aht20.getHumidity();
//     // char str_temp[8];
//     // char str_rh[5];
//     // dtostrf(temp, 4, 2, str_temp);
//     // dtostrf(rh, 4, 2, str_rh);
//     char str_temp[5] = "00.0";
//     char str_rh[5] = "00.0";     

//     // format data as JSON to send
//     char data[36];
//     sprintf(data, "{\"temp\":\"%s\",\"rh\":\"%s\"}\r\n", str_temp, str_rh);

//     // This is the HTTP request taken from `curl` output when posting via linux cli
//     // and successfully hits the database every time
//     // > POST /data HTTP/2
//     // > Host: <MY_APP_HOSTNAME>
//     // > user-agent: curl/7.81.0
//     // > accept: */*
//     // > content-type: application/json
//     // > content-length: 25

//     client.println("POST /data HTTP/1.1");
//     client.print("Host: ");
//     client.println(HOST);
//     client.println("user-agent: Doug's TempRH Board/1.0");
//     client.println("accept: */*");
//     // client.println("Connection: close");
//     client.println("content-type: application/json");
//     client.println("content-length: 29");
//     client.println();
//     client.println(data);
// }
