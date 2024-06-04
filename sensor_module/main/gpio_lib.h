/**
 * Hardware config for my board:
 * GPIO2: Onboard blue LED
 * GPIO12: Onboard RGB Red
 * GPIO13: Onboard RGB Green
 * GPIO15: Onboard RGB Blue
 * GPIO14: Onboard button 'BIP'
 */

// Outputs
#define ONBOARD_BLUE    GPIO_NUM_2
#define RGB_R           GPIO_NUM_12
#define RGB_G           GPIO_NUM_13
#define RGB_B           GPIO_NUM_15
#define GPIO_OUTPUT_PIN_SEL  ((1ULL<<ONBOARD_BLUE) | (1ULL<<RGB_R) | (1ULL<<RGB_G) | (1ULL<<RGB_B))
// Inputs
#define BUTTON          GPIO_NUM_14
#define GPIO_INPUT_PIN_SEL   1ULL<<BUTTON


static void toggle_led(void);
static void gpio_isr_handler(void *arg);
static void queue_handle(void *arg);

void setup_gpio_in();
void setup_gpio_out();
