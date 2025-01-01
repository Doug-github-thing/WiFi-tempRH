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

#include "wifi_lib.h"
#include "http_lib.h"
#include "gpio_lib.h"
#include "i2c_lib.h"
#include "timer_lib.h"


#define SENSOR_ID   SENSOR_ID              /* Unique identifier of which module this is */
#define HOSTNAME    SENSOR_BACKEND_ADDRESS /* Hostname address of local sensor backend */
#define PORT        SENSOR_PORT            /* Port where sensor backend listens */


uint32_t current_timestamp;         /* Holds the current time in seconds since 01Jan2024 */


void read_data_and_send(void) {
    char reading_str_buffer[23];
    read_aht20(reading_str_buffer);   // Read data from the AHT20, store in 23 byte buffer
    http_send(SENSOR_ID, HOSTNAME, PORT, reading_str_buffer);
}


void app_main()
{
    ESP_ERROR_CHECK(nvs_flash_init());

    ESP_LOGI("main", "ESP booted. Starting peripherals");

    tcpip_adapter_ip_info_t my_wifi_info; // Holds wifi info after config
    setup_wifi_config(&my_wifi_info);     // Connect to the access point

    setup_i2c();                       // Setup I2C pins on ESP
    setup_aht20();                     // Setup AHT20 for data reading
    setup_eeprom();                    // Test connection to eeprom module
    // setup_oled();                      // Setup OLED screen

    char reading_str_buffer[22];
    read_aht20(reading_str_buffer);    // Read data from the AHT20, store in buffer

    setup_gpio_out();                  // Setup LED output pins
    setup_gpio_in(read_data_and_send); // Setup interrupt on BIP button
    setup_adc();                       // Setup ADC


    // Initialize timestamp tracking for data logging
    setup_timestamp(&current_timestamp, SENSOR_ID, HOSTNAME, PORT); 
    setup_timer(&current_timestamp); // Use timer to keep timestamp up to date, show alive LED


    ESP_LOGI("main", "Finished initializiation!");


    bool already_done_this_minute = false;
    while(1) {

        // If it's within 10 seconds of a 30 minute interval
        // AND it hasn't taken a reading yet
        if (!already_done_this_minute && current_timestamp % 900 <= 10) {
            ESP_LOGI("loop", "The time is %u", current_timestamp+1704085200);
            read_data_and_send();
            already_done_this_minute = true;
        }
        // If no longer within 30 seconds of a 30 minute interval, clear the "done" flag
        else if (current_timestamp % 900 > 10) 
            already_done_this_minute = false;

        // Wait 1 second
        vTaskDelay(1000 / portTICK_RATE_MS);
    }
}
