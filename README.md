# WiFi-tempRH
A full fledged project to connect a WiFi ESP module to send temperature / humidity data to a PostgreSQL backed up web frontend.

## Data flow:
1. Temp/RH data is acquired from a sensor connected to an Atmega328 microcontroller. I am using an Arduino Uno for prototyping, but intend to replace it with an Atmega driven custom PCB once the software proves the concept.

2. The Atmega sends the data to an attached WiFi breakout board, which broadcasts an HTTP POST request to a cloud based web server, which will process the request, read the sensor data, add timestamps, and pass it on to an ElephantSQL database.

3. A cloud based web frontend (hosted on Github pages) will read data saved in the ElephantSQL database and display it in a user-friendly way.

4. This architecture leaves room for future expansion by adding an arbitrarily large number of sensor boards, and simply adding a board ID (possibly MAC address) to each database entry, which can then be read by the web frontend to differentiate the data, tracing each point back to which board acquired it.

## Status as of 9/27/23:
Hardware Kicad design of the sensor board is completed, but money will not be spent getting the PCBs manufactured until the prototype has a working web frontend.

Arduino sends dummy placeholder data to locally hosted NodeJS server, which prints the data to the console, along with current timestamps.
