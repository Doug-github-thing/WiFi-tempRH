#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "esp_event.h"
#include "nvs.h"
#include "nvs_flash.h"

#include <netdb.h>
#include <sys/socket.h>

static const char *HTTP_TAG = "http";


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
        "User-Agent: WiFi-TempRHv2.0 Board %d\r\n"
        "Accept: */*\r\n"
        "Content-Type: application/JSON\r\n"
        "Content-Length: %d\r\n\r\n"
        "%s", hostname, sensor_id, strlen(body), body);
}


/**
 * Sends HTTP POST request to the specified host.
 * 
 * @param sensor_id int identifier for this sensor
 * @param hostname String hostname
 * @param port int port of host
 * @param payload String Data to send, as key value pairs. ie `"temp":69.1,"rh":42.0`
 */
static void http_send(int sensor_id, char *hostname, int port, char* payload) {
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
        return;
    }

    addr = &((struct sockaddr_in *)res->ai_addr)->sin_addr;
    ESP_LOGI(HTTP_TAG, "DNS lookup succeeded. IP=%s:", inet_ntoa(*addr));

    // Allocate socket
    int s = socket(res->ai_family, res->ai_socktype, 0);
    if(s < 0) {
        ESP_LOGE(HTTP_TAG, "... Failed to allocate socket.");
        freeaddrinfo(res);
        vTaskDelay(1000 / portTICK_PERIOD_MS);
        return;
    }
    ESP_LOGI(HTTP_TAG, "... allocated socket");

    // Connect to the host
    if(connect(s, res->ai_addr, res->ai_addrlen) != 0) {
        ESP_LOGE(HTTP_TAG, "... socket connect failed errno=%d", errno);
        close(s);
        freeaddrinfo(res);
        vTaskDelay(4000 / portTICK_PERIOD_MS);
        return;
    }

    ESP_LOGI(HTTP_TAG, "... connected");
    freeaddrinfo(res);

    // Send the request!
    if (write(s, request, strlen(request)) < 0) {
        ESP_LOGE(HTTP_TAG, "... socket send failed");
        close(s);
        vTaskDelay(4000 / portTICK_PERIOD_MS);
        return;
    }
    ESP_LOGI(HTTP_TAG, "... socket send success");
    ESP_LOGI(HTTP_TAG, "... closing socket");
    close(s);
}
