#ifndef I2C_LIB_H_
#define I2C_LIB_H_

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"

#include "esp_log.h"
#include "esp_system.h"
#include "esp_err.h"

#include "driver/i2c.h"


// Hardware constants
#define I2C_SDA_PIN               4     /* GPIO pin on ESP used for SDA */
#define I2C_SCL_PIN               5     /* GPIO pin on ESP used for SCL */
#define I2C_AHT20_ADDR            0x38  /* I2C Address of AHT20 temp/rh sensor*/
#define I2C_EEPROM_ADDR           0x50  /* I2C Address of M24C64 EEPROM module */
#define I2C_OLED_ADDR             0x3C  /* I2C Address of M24C64 EEPROM module */


// General definitions
#define I2C_PORT_NUM              I2C_NUM_0
#define I2C_READ_BIT              I2C_MASTER_READ   /* I2C master read  */
#define I2C_WRITE_BIT             I2C_MASTER_WRITE  /* I2C master write */
#define ACK_CHECK_EN              0x1   /* I2C master will check ack from slave */
#define ACK_CHECK_DIS             0x0   /* I2C master will NOT check ack from slave */


int setup_i2c(void);
int setup_aht20(void);
int setup_eeprom(void);

int read_aht20(char *);
void parse_aht20_data(char *, uint8_t *);
int read_eeprom(uint16_t, int, uint8_t*);
int write_eeprom(uint16_t, int, uint8_t*);

#endif
