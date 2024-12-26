#ifndef HTTP_LIB_H_
#define HTTP_LIB_H_

#include <string.h>
#include <netdb.h>
#include <sys/socket.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "esp_event.h"
#include "nvs.h"
#include "nvs_flash.h"


int http_send(int sensor_id, char *hostname, int port, char* payload);
int setup_timestamp(uint32_t *current_timestamp, int sensor_id, char *hostname, int port);


#endif
