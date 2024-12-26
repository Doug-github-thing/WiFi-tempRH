#include "http_lib.h"

static const char *HTTP_TAG = "http";

/**
 * Sets the value of the global "current_timestamp" variable.
 * Bases on the result of a call to the /timestamp route of the node backend 
 * 
 * @param current_timestamp uint32_t* Pointer to global timestamp tracker
 * @param sensor_id int identifier for this sensor
 * @param hostname String hostname of node backend
 * @param port int port of node backend
 * @returns -1 on failure, 0 on success
 */
int setup_timestamp(uint32_t *current_timestamp, int sensor_id, char *hostname, int port) {
    // Format request
    char request[300];
    snprintf(request, 300,
        "GET /timestamp HTTP/1.1\r\n"
        "Host: %s:%d\r\n"
        "User-Agent: WiFi-TempRHv2.0 Board# %d\r\n"
        "Accept: */*\r\n\r\n"
        , hostname, port, sensor_id);

    const struct addrinfo hints = {
        .ai_family = AF_INET,
        .ai_socktype = SOCK_STREAM,
    };
    struct addrinfo *res;

    char port_str[6];
    snprintf(port_str, 6, "%d", port);

    // DNS lookup hostname and port
    int err = getaddrinfo(hostname, port_str, &hints, &res);
    if(err != 0 || res == NULL) {
        ESP_LOGE(HTTP_TAG, "DNS lookup failed err=%d res=%p", err, res);
        vTaskDelay(1000 / portTICK_PERIOD_MS);
        return -1;
    }

    // Allocate socket
    int s = socket(res->ai_family, res->ai_socktype, 0);
    if(s < 0) {
        ESP_LOGE(HTTP_TAG, "... Failed to allocate socket.");
        freeaddrinfo(res);
        vTaskDelay(1000 / portTICK_PERIOD_MS);
        return -1;
    }

    // Connect to the host
    if(connect(s, res->ai_addr, res->ai_addrlen) != 0) {
        ESP_LOGE("timestamp", "... socket connect failed errno=%d", errno);
        close(s);
        freeaddrinfo(res);
        vTaskDelay(4000 / portTICK_PERIOD_MS);
        return -1;
    }

    freeaddrinfo(res);

    // Send the request!
    if (write(s, request, strlen(request)) < 0) {
        ESP_LOGE("timestamp", "... socket send failed");
        close(s);
        vTaskDelay(4000 / portTICK_PERIOD_MS);
        return -1;
    }

    // Parse the response into received_number
    int r, number_counter;
    char receive_buffer[64];
    char received_number[32];
    bool response_body = false;
    do {
        r = read(s, receive_buffer, sizeof(receive_buffer)-1);
        for(int i = 0; i < r; i++) {
            if (receive_buffer[i] == 13 && receive_buffer[i+1] == 10
                && receive_buffer[i+2] == 13 && receive_buffer[i+3]) {// If you get two CRLFs
                response_body = true;
                number_counter = 0;
                i += 4;
            }
            if (response_body) {
                received_number[number_counter] = receive_buffer[i];
                number_counter++;
            }
        }
    } while(r > 0);
    
    close(s);

    // Parse response number and commit it to the global timestamp tracker
    char* end;
    *current_timestamp = strtol(received_number, &end, 10);
    ESP_LOGI("timestamp", "Timestamp set to %u", *current_timestamp);
    return 0;
}


/**
 * @param request_buff String where the resulting whole request gets stored
 * @param sensor_id int identifier for this sensor
 * @param hostname String hostname
 * @param payload String Data to send, as key value pairs. ie `"temp":69.1,"rh":42.0` 
 */
static void format_JSON_POST(char *request, int sensor_id, char *hostname, char* payload) {
    // Format body as JSON
    char body[46];
    snprintf(body, 46, "{\"id\":%d,%s}\r", sensor_id, payload);

    snprintf(request, 300,
        "POST /data HTTP/1.1\r\n"
        "Host: %s\r\n"
        "User-Agent: WiFi-TempRHv2.0 Board# %d\r\n"
        "Accept: */*\r\n"
        "Content-Type: application/JSON\r\n"
        "Content-Length: %d\r\n\r\n"
        "%s", hostname, sensor_id, strlen(body), body);
}


/**
 * Sends HTTP POST request to the specified host.
 * 
 * @param sensor_id int identifier for this sensor
 * @param hostname String hostname of node backend
 * @param port int port of node backend
 * @param payload String Data to send, as key value pairs. ie `"temp":69.1,"rh":42.0`
 * @returns -1 on failure, 0 on success
 */
int http_send(int sensor_id, char *hostname, int port, char* payload) {
    // Format request
    char request[300];
    format_JSON_POST(request, sensor_id, hostname, payload);
    ESP_LOGI(HTTP_TAG, "Attempting to send request:\n%s", request);

    const struct addrinfo hints = {
        .ai_family = AF_INET,
        .ai_socktype = SOCK_STREAM,
    };
    struct addrinfo *res;
    struct in_addr *addr;

    char port_str[6];
    snprintf(port_str, 6, "%d", port);

    // DNS lookup hostname and port
    int err = getaddrinfo(hostname, port_str, &hints, &res);
    if(err != 0 || res == NULL) {
        ESP_LOGE(HTTP_TAG, "DNS lookup failed err=%d res=%p", err, res);
        vTaskDelay(1000 / portTICK_PERIOD_MS);
        return -1;
    }

    addr = &((struct sockaddr_in *)res->ai_addr)->sin_addr;
    ESP_LOGI(HTTP_TAG, "DNS lookup succeeded. IP=%s:", inet_ntoa(*addr));

    // Allocate socket
    int s = socket(res->ai_family, res->ai_socktype, 0);
    if(s < 0) {
        ESP_LOGE(HTTP_TAG, "... Failed to allocate socket.");
        freeaddrinfo(res);
        vTaskDelay(1000 / portTICK_PERIOD_MS);
        return -1;
    }
    ESP_LOGI(HTTP_TAG, "... allocated socket");

    // Connect to the host
    if(connect(s, res->ai_addr, res->ai_addrlen) != 0) {
        ESP_LOGE(HTTP_TAG, "... socket connect failed errno=%d", errno);
        close(s);
        freeaddrinfo(res);
        vTaskDelay(4000 / portTICK_PERIOD_MS);
        return -1;
    }

    ESP_LOGI(HTTP_TAG, "... connected");
    freeaddrinfo(res);

    // Send the request!
    if (write(s, request, strlen(request)) < 0) {
        ESP_LOGE(HTTP_TAG, "... socket send failed");
        close(s);
        vTaskDelay(4000 / portTICK_PERIOD_MS);
        return -1;
    }
    // ESP_LOGI(HTTP_TAG, "... socket send success");
    // ESP_LOGI(HTTP_TAG, "... closing socket");
    close(s);
    return 0;
}
