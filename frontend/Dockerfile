# Step 1: Build the React app
FROM node:lts-alpine as build
WORKDIR /app

# Set up proper dependencies
COPY package.json package-lock.json ./
RUN npm install react-scripts
RUN npm install -g npm@11.0.0

# Pass the sensitive variables from environment into the app
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
ARG REACT_APP_OAUTH_CLIENT_ID
ENV REACT_APP_OAUTH_CLIENT_ID=${REACT_APP_OAUTH_CLIENT_ID}

RUN echo "Backend URL: $REACT_APP_BACKEND_URL"
RUN echo "ClientID: $REACT_APP_OAUTH_CLIENT_ID"

COPY . .

RUN npm run build

# Step 2: Serve the app using Apache2
FROM httpd:alpine
COPY --from=build /app/build /usr/local/apache2/htdocs/
EXPOSE 80
CMD ["httpd-foreground"]
