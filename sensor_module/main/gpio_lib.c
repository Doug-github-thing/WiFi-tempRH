#include "gpio_lib.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"

#include "driver/gpio.h"
#include "driver/adc.h"
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
    if (gpio_config(&io_conf) == 0)
        ESP_LOGI("gpio", "GPIO ouput config successful");
    else
        ESP_LOGE("gpio", "GPIO ouput config unsuccessful");
    gpio_set_level(ONBOARD_BLUE, 1); // Because onboard LED hi/low is inverted
}


/**
 * @param interrupt_fun Function called when interrupt button is pressed 
 */
void setup_gpio_in(void *interrupt_fun) {

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
    if (gpio_config(&io_conf) == 0)
        ESP_LOGI("gpio", "GPIO input config successful");
    else
        ESP_LOGE("gpio", "GPIO input config unsuccessful");
    gpio_set_direction(BUTTON, GPIO_MODE_INPUT);
    
    //change gpio intrrupt type for one pin
    gpio_set_intr_type(BUTTON, GPIO_INTR_POSEDGE);

    //create a queue to handle gpio event from isr
    gpio_evt_queue = xQueueCreate(10, sizeof(uint32_t));
    //start gpio task
    xTaskCreate(queue_handle, "queue_handle", 2048, interrupt_fun, 10, NULL);

    //install gpio isr service
    gpio_install_isr_service(0);
    //hook isr handler for specific gpio pin
    gpio_isr_handler_add(BUTTON, gpio_isr_handler, (void *) BUTTON);
}


static void toggle_led(int gpio_pin) {
    int current = gpio_get_level(gpio_pin);
    gpio_set_level(gpio_pin, current==0 ? 1 : 0);
}


static void gpio_isr_handler(void *arg) {
    uint32_t gpio_num = (uint32_t) arg;
    xQueueSendFromISR(gpio_evt_queue, &gpio_num, NULL);
}


static void queue_handle(void (*function_ptr)()) {
    uint32_t io_num;
    for (;;) 
        if (xQueueReceive(gpio_evt_queue, &io_num, portMAX_DELAY)) {
            (*function_ptr)();        // Execute "read and send" function from main
        }
}


static void adc_task(void) {
    uint16_t adc_data;
    bool previous_high = false;
    while (1) {
        vTaskDelay(200 / portTICK_RATE_MS);

        if (ESP_OK == adc_read(&adc_data)) {
            
            // If the sensor didn't already see something but it does now
            if (!previous_high && adc_data >= 500) {
                gpio_set_level(ONBOARD_BLUE, 0); // turn onboard LED on   
                previous_high = true;
                continue;
            }
            // If the sensor saw something before but doesn't now
            if (previous_high && adc_data < 500) {
                gpio_set_level(ONBOARD_BLUE, 1); // turn onboard LED off
                previous_high = false;
                continue;
            }
        }
    }
}


static void setup_adc(void) {
    adc_config_t adc_config;

    // Depend on menuconfig->Component config->PHY->vdd33_const value
    // When measuring system voltage(ADC_READ_VDD_MODE), vdd33_const must be set to 255.
    adc_config.mode = ADC_READ_TOUT_MODE;
    adc_config.clk_div = 8; // ADC sample collection clock = 80MHz/clk_div = 10MHz
    ESP_ERROR_CHECK(adc_init(&adc_config));

    xTaskCreate(adc_task, "adc_task", 2048, NULL, 10, NULL);
}
