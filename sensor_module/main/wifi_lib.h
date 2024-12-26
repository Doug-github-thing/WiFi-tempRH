#ifndef WIFI_LIB_H_
#define WIFI_LIB_H_

/* 
 * This library is based on the WiFi station example from the FreeRTOS sdk for ESP8266.
 */

#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_system.h"
#include "lwip/err.h"
#include "lwip/sys.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "esp_event.h"
#include "esp_wifi.h"
#include "nvs.h"
#include "nvs_flash.h"

/* FreeRTOS event group to signal when we are connected*/
static EventGroupHandle_t s_wifi_event_group;

static const char *WIFI_TAG = "wifi";


/* The event group allows multiple bits for each event, but we only care about two events:
 * - we are connected to the AP with an IP
 * - we failed to connect after the maximum amount of retries */
#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAIL_BIT      BIT1


void setup_wifi_config(tcpip_adapter_ip_info_t*);


#endif
