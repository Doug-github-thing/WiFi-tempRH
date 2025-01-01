# Use the official Node.js LTS image as the base image
FROM --platform=amd64 node:lts-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the server files into the working directory
COPY package*.json ./
COPY sensor_backend.js ./
COPY index.html ./

# Expose the port the server listens on
EXPOSE 55555

# Start the server
CMD ["node", "sensor_backend.js"]
