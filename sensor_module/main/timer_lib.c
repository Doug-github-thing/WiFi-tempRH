/* hw_timer example

   This example code is in the Public Domain (or CC0 licensed, at your option.)

   Unless required by applicable law or agreed to in writing, this
   software is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
   CONDITIONS OF ANY KIND, either express or implied.
*/

#include <stdio.h>
#include "esp_log.h"
#include "driver/hw_timer.h"

void hw_timer_callback(void **arg) {
    *arg += 10000;
}

void setup_timer(uint32_t *current_timestamp_ptr)
{
    hw_timer_init(hw_timer_callback, current_timestamp_ptr);
    hw_timer_alarm_us(1000000, true);
    ESP_LOGI("timer", "Initializing timer to increment current timestamp");
}
