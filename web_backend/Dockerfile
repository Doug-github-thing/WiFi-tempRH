# Use the official Node.js LTS image as the base image
FROM --platform=amd64 node:lts-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

RUN npm install express
RUN npm install body-parser
RUN npm install mysql2
RUN npm install cors
RUN npm install fs
RUN npm install crypto
RUN npm install google-auth-library --save

# Copy the server file into the working directory
COPY backend.js ./
COPY index.html ./

# Expose the port the server listens on
EXPOSE 4001


# Start the server
CMD ["node", "backend.js"]
