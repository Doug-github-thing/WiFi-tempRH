CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(50),
    node INT
);
INSERT INTO users (user_id, name, node) VALUES (0, 'Dog', 0);

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
INSERT INTO node_0_sensors (sensor_id, name) VALUES (1, 'Living Room');

CREATE USER 'monitor'@'%' IDENTIFIED BY 'monitor';
GRANT ALL PRIVILEGES ON monitorDB.* TO 'monitor'@'%';
