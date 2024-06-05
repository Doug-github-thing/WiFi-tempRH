/* WiFi station Example

   This example code is in the Public Domain (or CC0 licensed, at your option.)

   Unless required by applicable law or agreed to in writing, this
   software is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
   CONDITIONS OF ANY KIND, either express or implied.
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

/* The event group allows multiple bits for each event, but we only care about two events:
 * - we are connected to the AP with an IP
 * - we failed to connect after the maximum amount of retries */
#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAIL_BIT      BIT1

/* WiFi credentials are set up via the project configuration menu */
static const char *TAG = "wifi";

static int s_retry_num = 0;

static void event_handler(tcpip_adapter_ip_info_t* adapter_info, esp_event_base_t event_base,
                                int32_t event_id, void* event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        if (s_retry_num < CONFIG_ESP_MAXIMUM_RETRY) {
            esp_wifi_connect();
            s_retry_num++;
            ESP_LOGI(TAG, "retry to connect to the AP");
        } else {
            xEventGroupSetBits(s_wifi_event_group, WIFI_FAIL_BIT);
        }
        ESP_LOGI(TAG,"connect to the AP fail");
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        ESP_LOGI(TAG, "got ip:%s",
                 ip4addr_ntoa(&event->ip_info.ip));
        s_retry_num = 0;
        xEventGroupSetBits(s_wifi_event_group, WIFI_CONNECTED_BIT);
        // Capture current ip state and pass it back to the global tracker for adapter stuff,
        // so the rest of the code can use it
        adapter_info->ip = event->ip_info.ip;
        adapter_info->gw = event->ip_info.gw;
        adapter_info->netmask = event->ip_info.netmask;
    }
}


void setup_wifi_config(tcpip_adapter_ip_info_t* my_adapter_info)
{
    s_wifi_event_group = xEventGroupCreate();

    tcpip_adapter_init();

    ESP_ERROR_CHECK(esp_event_loop_create_default());

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler, my_adapter_info));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &event_handler, my_adapter_info));

    wifi_config_t wifi_config = {
        .sta = {
            .ssid = CONFIG_ESP_WIFI_SSID,
            .password = CONFIG_ESP_WIFI_PASSWORD
        },
    };

    /* Setting a password implies station will connect to all security modes including WEP/WPA.
        * However these modes are deprecated and not advisable to be used. Incase your Access point
        * doesn't support WPA2, these mode can be enabled by commenting below line */

    if (strlen((char *)wifi_config.sta.password)) {
        wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;
    }

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA) );
    ESP_ERROR_CHECK(esp_wifi_set_config(ESP_IF_WIFI_STA, &wifi_config) );
    ESP_ERROR_CHECK(esp_wifi_start() );

    ESP_LOGI(TAG, "wifi_init_sta finished.");

    /* Waiting until either the connection is established (WIFI_CONNECTED_BIT) or connection failed for the maximum
     * number of re-tries (WIFI_FAIL_BIT). The bits are set by event_handler() (see above) */
    EventBits_t bits = xEventGroupWaitBits(s_wifi_event_group,
            WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
            pdFALSE,
            pdFALSE,
            portMAX_DELAY);

    /* xEventGroupWaitBits() returns the bits before the call returned, hence we can test which event actually
     * happened. */
    if (bits & WIFI_CONNECTED_BIT) {
        ESP_LOGI(TAG, "connected to ap SSID:%s password:%s",
                 CONFIG_ESP_WIFI_SSID, CONFIG_ESP_WIFI_PASSWORD);
    } else if (bits & WIFI_FAIL_BIT) {
        ESP_LOGI(TAG, "Failed to connect to SSID:%s, password:%s",
                 CONFIG_ESP_WIFI_SSID, CONFIG_ESP_WIFI_PASSWORD);
    } else {
        ESP_LOGE(TAG, "UNEXPECTED EVENT");
    }

    ESP_ERROR_CHECK(esp_event_handler_unregister(IP_EVENT, IP_EVENT_STA_GOT_IP, &event_handler));
    ESP_ERROR_CHECK(esp_event_handler_unregister(WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler));
    vEventGroupDelete(s_wifi_event_group);
}


void setup_wifi_tcp(tcpip_adapter_ip_info_t* my_adapter_info, int SENSOR_ID, uint8_t* mac) {
    ESP_LOGI(TAG, "Initializing TCP adapter");
    ESP_ERROR_CHECK(tcpip_adapter_start(TCPIP_ADAPTER_IF_STA, mac, my_adapter_info));

    tcpip_adapter_up(TCPIP_ADAPTER_IF_STA);

    // Check what ip info is used to run the TCP adapter, and confirm it's the right one.
    tcpip_adapter_ip_info_t my_ip_info;
    tcpip_adapter_get_ip_info(TCPIP_ADAPTER_IF_STA, &my_ip_info);
    if (ip4addr_ntoa(&my_ip_info.ip) == ip4addr_ntoa(&my_adapter_info->ip)
        && ip4addr_ntoa(&my_ip_info.gw) == ip4addr_ntoa(&my_adapter_info->gw)
        && ip4addr_ntoa(&my_ip_info.netmask) == ip4addr_ntoa(&my_adapter_info->netmask))
        ESP_LOGI(TAG, "TCP adapter is up on ip: %s", ip4addr_ntoa(&my_ip_info.ip));
    else {
        ESP_LOGE(TAG, "Error starting TCP adapter station");
        return;
    }

        
}


/**
 * Sends TCP data to the specified host. Establishes a connection if needed.
 * 
 * @param sensor_id int identifier for this sensor
 * @param hostname String hostname
 * @param port int 
 * @param payload String Data to send. ie `69.9;42.0`
 */
static void tcp_send(int sensor_id, char *hostname, int port, char* payload) {

    char location_buff[20]; /* Hostname and port, TCP connection endpoint */
    snprintf(location_buff, 20, "%s:%d", hostname, port);

    ESP_LOGI(TAG, "Establishing connection to: %s", location_buff);
    ESP_LOGI(TAG, "Sending the following data: %s", payload);
}
