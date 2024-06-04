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
#include "gpio_lib.c"
#include "i2c_lib.c"


#define SENSOR_ID    2              /* Unique identifier of which module this is */
#define HOSTNAME     "192.168.0.39" /* Hostname address of local sensor backend */
#define PORT         55555          /* Port where sensor backend listens */

void app_main()
{
    ESP_ERROR_CHECK(nvs_flash_init());
    wifi_init_sta();

    // Setup LED output pins
    setup_gpio_out();
    // Setup interrupt on BIP button
    setup_gpio_in();

    // Setup I2C pins on ESP
    setup_i2c();
    // Setup AHT20 for data reading
    setup_aht20();

    char reading_str_buffer[22];
    // Read data from the AHT20
    read_aht20(reading_str_buffer);

    ESP_LOGW("bwa", "Sensor read result: %s", reading_str_buffer);
    
    tcp_send(SENSOR_ID, HOSTNAME, PORT, reading_str_buffer);

}
