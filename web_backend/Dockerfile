# Use the official Node.js LTS image as the base image
FROM --platform=amd64 node:lts-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

RUN npm install express
RUN npm install body-parser
RUN npm install mysql2
RUN npm install cors
RUN npm install fs

# Copy the server file into the working directory
COPY backend.js ./
COPY index.html ./

# Expose the port the server listens on
EXPOSE 3000


# Start the server
CMD ["node", "backend.js"]
