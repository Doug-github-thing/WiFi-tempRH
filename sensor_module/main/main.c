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


#define SENSOR_ID      3              /* Unique identifier of which module this is */
#define HOSTNAME       "192.168.0.56" /* Hostname address of local sensor backend */
#define PORT           55555          /* Port where sensor backend listens */
#define POLL_INTERVAL  15             /* Time to wait between each reading, in minutes */


void read_data_and_send(void) {
    char reading_str_buffer[22];
    read_aht20(reading_str_buffer);   // Read data from the AHT20, store in buffer
    http_send(SENSOR_ID, HOSTNAME, PORT, reading_str_buffer);
}


void app_main()
{
    ESP_ERROR_CHECK(nvs_flash_init());


    tcpip_adapter_ip_info_t my_wifi_info;
    setup_wifi_config(&my_wifi_info);  // Connect to the access point

    setup_gpio_out();                  // Setup LED output pins
    setup_gpio_in(read_data_and_send); // Setup interrupt on BIP button
    setup_adc();                       // Setup ADC
    
    setup_i2c();                       // Setup I2C pins on ESP
    setup_aht20();                     // Setup AHT20 for data reading

    ESP_LOGI("main", "Finished initializiation");

    TickType_t previous_tick;
    while(1) {
        previous_tick = xTaskGetTickCount();
        read_data_and_send();                   // Read data and send to the node 
        vTaskDelayUntil(&previous_tick, POLL_INTERVAL * 60000 / portTICK_RATE_MS);
    }
}
