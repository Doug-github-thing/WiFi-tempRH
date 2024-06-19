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
#include "driver/i2c.h"

#include "wifi_lib.c"
#include "http_lib.c"
#include "gpio_lib.c"
#include "i2c_lib.c"
#include "timer_lib.c"


#define SENSOR_ID      1              /* Unique identifier of which module this is */
#define HOSTNAME       "192.168.0.56" /* Hostname address of local sensor backend */
#define PORT           55555          /* Port where sensor backend listens */
#define POLL_INTERVAL  30             /* Time to wait between each reading, in minutes */


uint32_t current_timestamp;           /* Holds the current time in seconds since 01Jan2024 */


void read_data_and_send(void) {
    char reading_str_buffer[23];
    read_aht20(reading_str_buffer);   // Read data from the AHT20, store in buffer
    http_send(SENSOR_ID, HOSTNAME, PORT, reading_str_buffer);
    ESP_LOGW("dummy numbers", "I generated these numbers: %s", reading_str_buffer);
}


void app_main()
{
    ESP_ERROR_CHECK(nvs_flash_init());

    ESP_LOGI("main", "ESP booted. Starting peripherals");

    tcpip_adapter_ip_info_t my_wifi_info; // Holds wifi info after config
    setup_wifi_config(&my_wifi_info);     // Connect to the access point

    // Initialize timestamp tracking for data logging
    setup_timestamp(&current_timestamp, SENSOR_ID, HOSTNAME, PORT); 
    setup_timer(&current_timestamp);      // Use timer to keep timestamp up to date 

    setup_i2c();                       // Setup I2C pins on ESP
    setup_aht20();                     // Setup AHT20 for data reading
    setup_eeprom();                    // Test connection to eeprom module

    char reading_str_buffer[22];
    read_aht20(reading_str_buffer);    // Read data from the AHT20, store in buffer

    setup_gpio_out();                  // Setup LED output pins
    setup_gpio_in(read_data_and_send); // Setup interrupt on BIP button
    setup_adc();                       // Setup ADC


    ESP_LOGI("main", "Finished initializiation!");

    // // Wait until the first 30 minute or so
    while (current_timestamp % 1800 > 30) {
        // setup_timestamp(&current_timestamp, SENSOR_ID, HOSTNAME, PORT);
        vTaskDelay(2000 / portTICK_RATE_MS);
    }

    TickType_t previous_tick;
    bool flag = false;
    while(1) {

        // // if within 30 seconds of a 30 minute point
        // if (current_timestamp % 1800 <= 30) {

        //     flag = flag ? false : true; // flip flag value
        // }

        // setup_timestamp(&current_timestamp, SENSOR_ID, HOSTNAME, PORT);
        previous_tick = xTaskGetTickCount();
        // if (current_timestamp % 1800 <= 5)   // If the current time is close enough to a 30 minute interval
        read_data_and_send();                   // Read data and send to the node 
        vTaskDelayUntil(&previous_tick, POLL_INTERVAL * 60000 / portTICK_RATE_MS);
    }
}
