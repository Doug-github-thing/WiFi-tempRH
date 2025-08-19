#!/usr/bin/bash

# Rebuild the frontend and backends
sudo docker-compose up --build -d

# Rebuild the sensor backend
cd sensor_backend/
sudo docker-compose up --build -d
