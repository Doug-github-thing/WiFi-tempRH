# WiFi-tempRH
A system to allow a user to access historical temperature / humidity data of any area equipped with an ESP8266 sensor module. The data will be accessed via a cloud hosted web frontend, which accesses historical data backed up on a cloud hosted database. This allows a user to check in on the status of their monitored zones from anywhere in the world.

App is up at [https://temprh.vercel.app/](https://temprh.vercel.app/)

## Data flow
1. Temp/RH data is acquired from a sensor connected to an ESP8266 module.

TODO: Update this for new Node-based architecture, and new central AWS EC2 hosted backend.


<!-- 
1. The ESP8266 sends its data via an HTTP POST request to a locally (sensor_backend) hosted ExpressJS server which is running on a Raspberry Pi connected to the same WiFi network, using the Pi's local ip address.

1. The Raspberry Pi hosted "node" server formats the data and forwards it onto the global backend, which hands .  

1. A separate cloud hosted ExpressJS server (hosted in an AWS EC2 instance) will simultaneously connect to this RDS database, and act as the middleman connecting the web frontend to the data store.

1. The final web frontend will make ReSTful requests to the web backend for data to display. -->

This architecture leaves room for future expansion by adding an arbitrarily large number of sensor boards, and simply adding a new SQL table for each unique board ID.

Data acquisition:

- `Data acquired by the sensor board -> Pushed to sensor_backend server - > Sent to MySQL server`

Data retrieval:

- `MySQL server stores data -> Pulled from web_backend -> Pulled from web_frontend -> Displayed on screen`

## Database Structure

Tables:

1. node#_sensors (id PRIMARY KEY, name)

    ```sql
    CREATE TABLE IF NOT EXISTS node_'#'_sensors (
        sensor_id SERIAL PRIMARY KEY,
        name VARCHAR(50)
    );
    ```

1. node# (id PRIMARY KEY, sensor, unix timestamp, temp, rh)

    ```sql
    CREATE TABLE IF NOT EXISTS node_'id' (
        id SERIAL PRIMARY KEY,
        sensor_id INT,
        timestamp TIMESTAMP,
        temp DECIMAL(4,1),
        rh DECIMAL(4,1)
    );
    ```

    - id tracks the number of this node
    - sensor_id tracks which sensor module the data came from. Used when pulling data from specific sensors.
    - timestamp, temp, rh do what they say

## Updates

### 5/30/24
- Data currently stored in 2 tables, `node_0`, and `node_0_sensors`. Access list of sensors with GET `/node/0`, and list of data for a given sensor with GET `/node/0/:sensor_id`. Supports variable node numbers as well, for when additional nodes are added.

- Add sensor data points with new POST `/data/:node` + body route.

### 5/29/24
ElephantSQL announced EOL for PostgreSQL server hosting. Beginning migration to AWS RDS and MySQL for data hosting.
As of 5/29/24, spun up an EC2 instance, connected to an RDS instance. The EC2 instance hosts the backend server, and is accessible at `http://temprh-backend.duckdns.org:3333/all`. This dumps the current contents of the single placeholder table in the RDS.

### 4/1/24
The project has its first user! Raspi node and single temp/rh monitor board hooked up, and working with minimum viable frontend, able to display one single input. All data is stored in table `temprh_1`. 

### 12/12/23
I've revised the original Atmega826 microcontroller + attached breakout WiFi board with [a single prebuilt temp/rh and built-in wifi microcontroller board](https://www.amazon.com/dp/B0CCR7B5G5?psc=1&ref=ppx_yo2ov_dt_b_product_details).

I enjoyed designing my own PCB in KiCad which linked an AVR controller, ISP for programming it, power regulator circuit, display LEDs for debugging, header pins for the WiFI breakout board, and future expansion slots. But a single board manufactured in this way would be more expensive than that board off of Amazon, so I decided to go with that to get a minimum viable up and running.

### 9/27/23
Hardware Kicad design of the sensor board is completed, but money will not be spent getting the PCBs manufactured until the prototype has a working web frontend.

Arduino sends dummy placeholder data to locally hosted NodeJS server, which prints the data to the console, along with current timestamps.


## TO-DO

Backend:

- Build new schema for RDS. Rewrite backend routes from PostgreSQL to MySQL.

- It is currently hard coded to offer up data from the sensor ID 1. Needs to be updated to return values corresponding to any given sensor ID. (/current/node:sensor route)

Frontend:

- needs the function to select a time interval of data to display on the graph.

- needs the function to select which sensor ID to view, from a list of all valid sensor IDs.

## Current Backend Routes

### Get

- `/tables` - Returns a list of tables in the database

- `/node/:node` - Gets the ids and names of each sensor in a given node.

- `/node/:node/:sensor` - Gets all data for given sensor in a given node.

### POST

- `/new/node` - Creates a new node_0 and node_0_sensors, in case something had happened to them.

- `/data/:node` - Adds a new data point in the indicated node. Values of `sensor_id`, `temp`, `rh` are passed as json args in the request body.

    ```bash
    curl -X POST http://temprh-backend.duckdns.org:3333/data/0 --header "Content-Type: application/json" --data '{"sensor_id":0,"temp":12.3,"rh":45.6}'
    ```