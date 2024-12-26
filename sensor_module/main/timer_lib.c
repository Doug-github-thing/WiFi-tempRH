#include "timer_lib.h"


int timer_counter = 0; /* Tracks how many times the hw timer interrupt has occured */
void timer_callback(void *args) {

    uint32_t * current_time_ptr = (uint32_t *)args;
    *current_time_ptr += 1; // increment 1 second
    
    // Every few ticks, flip the LED, then reset the counter
    if (timer_counter++ > 10)
        gpio_set_level(2, 0);

    if (timer_counter > 12) {
        gpio_set_level(2, 1);
        timer_counter = 0;
    }
}


/**
 * Update the current timestamp counter to keep time up to date.
 * Flip the LED every so often to show it's alive.
 * @param current_timestamp_ptr uint32_t* pointer to the global "current time" storage
 */
void setup_timer(uint32_t *current_timestamp_ptr)
{
    ESP_LOGI("timer", "Initializing timer to increment current timestamp");
    hw_timer_init(timer_callback, current_timestamp_ptr);
    hw_timer_alarm_us(1000000, true); // 1 second
}
