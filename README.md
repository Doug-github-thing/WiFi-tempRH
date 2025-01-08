# WiFi-tempRH
A system to allow a user to access historical temperature / humidity data of any area equipped with an ESP8266 sensor module. The data will be accessed via a cloud hosted web frontend, which accesses historical data backed up on a cloud hosted database. This allows a user to check in on the status of their monitored zones from anywhere in the world.

First generation of this app is up at [https://temprh.vercel.app/](https://temprh.vercel.app/)

Current version is live at [https://monitor.dougrynar.com](https://monitor.dougrynar.com)

## Data flow
1. Temperature and humidity data is acquired from a sensor connected to an ESP8266 on a dedicated board.

1. The ESP8266 sends its data via an HTTP POST request to a locally (sensor_backend) hosted ExpressJS server which is running on a Raspberry Pi (or equivalent) connected to the same WiFi network.

1. The Raspberry Pi hosted local server formats the data and forwards it onto the global backend.

1. A dedicated server will simultaneously run an ExpressJS backend server and an attached MariaDB SQL database. This serves as the global backend, and allows data to be written to the database as it comes in from the sensor_backend.

1. This dedicated server also hosts the frontend, which uses Rest requests to the global backend to query for data.

1. The final web frontend will make ReSTful requests to the web backend for data to display.

This architecture leaves room for future expansion by adding an arbitrarily large number of sensor boards, and simply adding a new SQL table for each unique board ID.

Data acquisition:

- `Data acquired by the sensor board -> Pushed to sensor_backend server - > Pushed to web_backend -> Sent to SQL database`

Data retrieval:

- `SQL database stores data -> Pulled from web_backend -> Pulled from web_frontend -> Displayed on screen`

## Database Structure

Tables:

1. users (id PRIMARY KEY, name, nodes )
    
    ```sql
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_id INT,
        name VARCHAR(50),
        node INT
    );
    ```

    ```sql
    INSERT INTO users (user_id, name, node) values (0, 'Dog', 0);
    ```


1. node#_sensors (id PRIMARY KEY, name)

    ```sql
    CREATE TABLE IF NOT EXISTS node_'#'_sensors (
        sensor_id SERIAL PRIMARY KEY,
        name VARCHAR(50)
    );
    ```
    ```sql
    INSERT INTO node_1_sensors (name) values ('Shed');
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

### 1/8/25
- Containerized each individual process for consistent deployments:
    1. Frontend
    1. Web Backend and MariaDB database
    1. Sensor Backend
- Sensor board schematic / layout updated:
    1. Fixed wiring polarity of SCL and SDA pins on the AHT20 so it can finally read real data
    1. Moved AHT20 farther away from the rest of the board components to minimize thermal interference
    1. Added additional 5V voltage regulator and barrel jack to allow the board to be powered by cheap and readily available power supply transformers. **NOTE, if using this powering method, voltage regulator may dissipate enough heat to make the temperature readings unreliable. Additional temperature calibration may be necessary to offset the heat dissipation of this regulator**
    1. Replaced pre-assembled SMT resistor for ADC pull-down circuit with an empty THT resistor slot, so a custom pull-down resistance can be chosen based on future applications.
    1. Enlarged "future expansion" pins for breadboard compatibility
- Servers moved from Amazon EC2 instance to locally hosted computer

### 6/9/24
- Custom ESP8266 sensor board is set up to read data from peripherals, written with Expressif ESP8266 SDK toolchain:

1. GPIO pins for button interrupts and onboard LED indicators
1. I2C interface AHT20 temp/humidity sensor module
1. ESP-12F onboard WiFi for sending sensor data to the backend
1. I2C interface EEPROM module for offline data storage
1. ADC input to detect leaks with variable resistor leak sensor

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

Sensor:

- Write logic for compressing data into bit efficient bytes to store in EEPROM, and mark stored data based on whether or not it was successfully sent over wifi. 
    - I want to prevent data gaps by having the sensors attempt to send stored sensor data every time it sends a new reading, only stopping this once it receives a response from the server indicating that the data has been added to the database successfully.

Backend:

- Rewrite all backend routes from PostgreSQL to MySQL. Still need some routes for get 1 day's readings, get 1 week's readings, get readings for a custom time range.

- Add oauth. Create a temporary datastore to store valid session tokens, which map to specific user IDs. Require valid session tokens for any backend route.

Frontend:

- needs to implement oauth to manage user accounts.

- needs the function to select a time interval of data to display on the graph.

## Current Backend Routes

### Get

- `/tables` - Returns a list of tables in the database

- `/node/:node` - Gets the ids and names of each sensor in a given node.

- `/node/:node/:sensor` - Gets all data for given sensor in a given node.

### POST

- `/new/node` - Creates a new node_0 and node_0_sensors, in case something had happened to them.

- `/data/:node` - Adds a new data point in the indicated node. Values of `sensor_id`, `temp`, `rh` are passed as json args in the request body.

    ```bash
    curl -X POST https://monitor.dougrynar.com/backend/data/0 --header "Content-Type: application/json" --data '{"sensor_id":0,"temp":12.3,"rh":45.6}'
    ```