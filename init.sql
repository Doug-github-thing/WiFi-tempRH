CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50),       -- User's name
    email VARCHAR(50),      -- User's email, the part before the @
    valid_nodes VARCHAR(32) -- Comma separated list of nodes owned by this user
);
INSERT INTO monitorDB.users VALUES (NULL, 'Doug', 'dougrynar', '0,1');


CREATE TABLE IF NOT EXISTS node_0 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT,
    timestamp TIMESTAMP,
    temp DECIMAL(4,1),
    rh DECIMAL(4,1)
);


CREATE TABLE IF NOT EXISTS node_0_sensors (
    sensor_id INT PRIMARY KEY,
    name VARCHAR(50)
);
INSERT INTO node_0_sensors (sensor_id, name) VALUES (1, 'Game Room');
INSERT INTO node_0_sensors (sensor_id, name) VALUES (2, 'Living Room');
INSERT INTO node_0_sensors (sensor_id, name) VALUES (3, 'Bed Room');
INSERT INTO node_0_sensors (sensor_id, name) VALUES (4, 'Porch');


-- For tracking currently active session IDs. 
-- Default expiry is set to 1 hour after entry is made
CREATE TABLE IF NOT EXISTS session_ids (
    session_id VARCHAR(32) PRIMARY KEY,  -- This session ID
    user_id INT,                         -- ID of the user this session belongs to
    valid_nodes TEXT,                    -- Comma separated list of nodes owned by this user
    expiry TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 1 HOUR) -- Time of expiration for this session id 
);


CREATE USER 'monitor'@'%' IDENTIFIED BY 'monitor';
GRANT ALL PRIVILEGES ON monitorDB.* TO 'monitor'@'%';
