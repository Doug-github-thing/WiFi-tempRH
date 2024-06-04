#include "gpio_lib.h"

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"

#include "driver/gpio.h"

#include "esp_log.h"
#include "esp_system.h"


static xQueueHandle gpio_evt_queue = NULL;


void setup_gpio_out(void) {

    ///////// Output pins config
    gpio_config_t io_conf;
    // disable interrupt
    io_conf.intr_type = GPIO_INTR_DISABLE;
    //set as output mode
    io_conf.mode = GPIO_MODE_OUTPUT;
    //bit mask of pins that to set
    io_conf.pin_bit_mask = GPIO_OUTPUT_PIN_SEL;
    // Disable internal pullup/down
    io_conf.pull_down_en = 0;
    io_conf.pull_up_en = 0;
    //configure GPIO with the given settings
    uint8_t gpio_config_result = gpio_config(&io_conf);
    ESP_LOGI("gpio", "Result of GPIO output config: %d", gpio_config_result);
    gpio_set_level(ONBOARD_BLUE, 1); // Because onboard LED hi/low is inverted
}


void setup_gpio_in() {

    ////////// Interrupt pin config 
    gpio_config_t io_conf;
    // Input mode
    // Disable pullup/down since it's externally pulled down
    // Interrupt at rising edge
    io_conf.pin_bit_mask = GPIO_INPUT_PIN_SEL;
    io_conf.mode = GPIO_MODE_INPUT;
    io_conf.pull_up_en = 0;
    io_conf.pull_down_en = 0;
    io_conf.intr_type = GPIO_INTR_POSEDGE;
    uint8_t gpio_config_result = gpio_config(&io_conf);
    ESP_LOGI("gpio", "Result of GPIO input config: %d", gpio_config_result);
    gpio_set_direction(BUTTON, GPIO_MODE_INPUT);
    
    //change gpio intrrupt type for one pin
    gpio_set_intr_type(BUTTON, GPIO_INTR_POSEDGE);

    //create a queue to handle gpio event from isr
    gpio_evt_queue = xQueueCreate(10, sizeof(uint32_t));
    //start gpio task
    xTaskCreate(queue_handle, "queue_handle", 2048, NULL, 10, NULL);

    //install gpio isr service
    gpio_install_isr_service(0);
    //hook isr handler for specific gpio pin
    gpio_isr_handler_add(BUTTON, gpio_isr_handler, (void *) BUTTON);
}


static void toggle_led(void) {
    // ESP_LOGI("Blonk", "Blinktime");
    int current = gpio_get_level(ONBOARD_BLUE);
    gpio_set_level(ONBOARD_BLUE, current==0 ? 1 : 0);
    // Slight delay after press so it doesn't double trigger
    vTaskDelay(200 / portTICK_RATE_MS); 
}


static void gpio_isr_handler(void *arg) {
    uint32_t gpio_num = (uint32_t) arg;
    xQueueSendFromISR(gpio_evt_queue, &gpio_num, NULL);
}


static void queue_handle(void *arg) {
    uint32_t io_num;

    for (;;) 
        if (xQueueReceive(gpio_evt_queue, &io_num, portMAX_DELAY))
            toggle_led();
}
