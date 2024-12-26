#ifndef TIMER_LIB_H_
#define TIMER_LIB_H_

#include "esp_system.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "driver/hw_timer.h"
#include "driver/gpio.h"


struct timer_callback_args { /* For passing params to the timer callback handler */
    uint32_t *current_timestamp_ptr;
    int gpio_indicator;
};


void setup_timer(uint32_t *);
void timer_callback(void *);


#endif
