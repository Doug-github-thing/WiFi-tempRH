# WiFi-tempRH
A full fledged project to allow a user to conveniently access historical temperature / humidity data of any area equipped with a ESP8266 sensor module. The data will be accessed via a cloud hosted web frontend, which accesses historical data backed up on a 3rd party PostgreSQL server. This allows a user to check in on the status of their monitored zones from anywhere in the world.

## Data flow:
1. Temp/RH data is acquired from a sensor connected to an ESP8266 module.

2. The ESP8266 sends its data via an HTTP POST request to a locally (sensor_backend) hosted ExpressJS server which is running on a Raspberry Pi connected to the same WiFi network, using the Pi's local ip address.

3. The Raspberry Pi hosted sensor_backend server attaches a timestamp, formats the data, and forwards it on to a PostgreSQL database, hosted by ElephantSQL.  

4. A separate cloud hosted ExpressJS server (hosted on Vercel) will simultaneously connect to this ElephantSQL database, and act as the middleman connecting the web frontend to the data store.

5. The final web frontend will make ReSTful requests to the web backend for data to display.

This architecture leaves room for future expansion by adding an arbitrarily large number of sensor boards, and simply adding a new SQL table for each unique board ID.

Data acquisition:

- `Data acquired by the sensor board -> Pushed to sensor_backend server - > Sent to PostgreSQL server`

Data retrieval:

- `PostgreSQL server stores data -> Pulled from web_backend -> Pulled from web_frontend -> Displayed on screen`

## Status as of 9/27/23:
Hardware Kicad design of the sensor board is completed, but money will not be spent getting the PCBs manufactured until the prototype has a working web frontend.

Arduino sends dummy placeholder data to locally hosted NodeJS server, which prints the data to the console, along with current timestamps.

## Status as of 12/12/23:
I've revised the original Atmega826 microcontroller + attached breakout WiFi board with [a single prebuilt temp/rh and built-in wifi microcontroller board](https://www.amazon.com/dp/B0CCR7B5G5?psc=1&ref=ppx_yo2ov_dt_b_product_details).

I enjoyed the mess of designing my own PCB in KiCad which linked an AVR controller, ISP for programming it, power regulator circuit, display LEDs for debugging, header pins for the WiFI breakout board, and future expansion slots. But a single board manufactured in this way would be over 4 times more expensive than this board off of Amazon, due purely to economies of scale.
