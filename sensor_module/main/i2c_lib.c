#include "i2c_lib.h"

/**
 * Configures I2C interface for the ESP as Master
 */
static void setup_i2c(void) {
    ESP_LOGI("i2c", "Initializing ESP I2C interface");

    int i2c_master_port = I2C_PORT_NUM;
    i2c_config_t conf;
    conf.mode = I2C_MODE_MASTER;
    conf.sda_io_num = I2C_SDA_PIN;
    conf.sda_pullup_en = 1;
    conf.scl_io_num = I2C_SCL_PIN;
    conf.scl_pullup_en = 1;
    conf.clk_stretch_tick = 300; // 300 ticks, Clock stretch is about 210us, you can make changes according to the actual situation.
    ESP_ERROR_CHECK(i2c_driver_install(i2c_master_port, conf.mode));
    ESP_ERROR_CHECK(i2c_param_config(i2c_master_port, &conf));
    ESP_LOGI("i2c", "ESP I2C interface Initialized");
    return ESP_OK;
}


/**
 * Initialize the AHT20 temp/humidity sensor.
 * From the datasheet:
 *  - After poweron, wait 100ms
 *  - Send 0x71 to get byte status word. If it's 0x18, good to go.
 *  - Wait 10ms before getting data
 */
static int setup_aht20(void) {
    ESP_LOGI("i2c", "Initializing AHT20");

    int ret;
    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, I2C_AHT20_ADDR << 1 | I2C_WRITE_BIT, ACK_CHECK_EN); // Send I2C address
    i2c_master_write_byte(cmd, 0x71, ACK_CHECK_EN); // Send 0xAC Command
    i2c_master_stop(cmd);
    ret = i2c_master_cmd_begin(I2C_PORT_NUM, cmd, 1000 / portTICK_RATE_MS);
    i2c_cmd_link_delete(cmd);

    if (ret != ESP_OK) {
        ESP_LOGE("i2c", "Error initializing AHT20 sensor");
        return ret;
    }

    // Datasheet recommends 10ms delay after queuing for status byte
    vTaskDelay(10 / portTICK_RATE_MS); 
    ESP_LOGI("i2c", "ready to proceed");
 
    // Create "reading" to parse the status byte
    uint8_t reading = 0;

    cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, I2C_AHT20_ADDR << 1 | I2C_READ_BIT, ACK_CHECK_EN);
    int read_result = i2c_master_read(cmd, &reading, 1, ACK_CHECK_EN);
    i2c_master_stop(cmd);
    ret = i2c_master_cmd_begin(I2C_PORT_NUM, cmd, 1000 / portTICK_RATE_MS);
    i2c_cmd_link_delete(cmd);

    if (read_result != ESP_OK) {
        ESP_LOGW("i2c", "result of \"master_read()\" is invald.");
        return read_result;
    }

    if (read_result == 0x18) {
        ESP_LOGW("i2c", "AHT20 not properly initialized;\n\tThe reading is: %d", reading);
        return read_result;
    }
    
    ESP_LOGI("i2c", "AHT20 initialized");
    return ESP_OK;
}


/**
 * Initialize the M24C24 EEPROM module.
 * No initialization is strictly necessary. This simply checks whether the
 * ESP is able to communicate with the module, and returns an error if it cannot.
 * From the datasheet:
 *  - Address based on wiring: 0b1010000, or 0x50
 *  - 8th bit of address byte is Read/Write bit. 1 for read, 0 for write.
 *  - Device Select byte for READ operation:
 *      1 0 1 0 | 0 0 0 | 1, or 0xA1
 *  - Dataflow for single byte read operation:
 *      1. I2C start command
 *      2. Device Select byte
 *      3. Read address byte1 
 *      4. Read address byte2 
 *      5. I2C start command (again)
 *      6. Device Select byte (read bit selected)
 *      7. Data is sent
 *      8. Stop command
 */
static int setup_eeprom() {
    ESP_LOGI("i2c", "Initializing EEPROM");

    uint16_t byte_addr = 0x0000; // Memory address to read
    uint8_t dev_select_read  = I2C_EEPROM_ADDR << 1 | I2C_READ_BIT;  // EEPROM addr + Read/Write bit
    uint8_t dev_select_write = I2C_EEPROM_ADDR << 1 | I2C_WRITE_BIT; // EEPROM addr + Read/Write bit
    uint8_t read_buffer[16];
    uint8_t last_byte;

    int ret;    // Return status
    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);                                               // 1. I2C start command
    i2c_master_write_byte(cmd, dev_select_write, ACK_CHECK_EN);             // 2. Send I2C address + read
    i2c_master_write_byte(cmd, (byte_addr & 0xff00) >> 8, ACK_CHECK_EN); // 3. Send read address byte1
    i2c_master_write_byte(cmd, (byte_addr & 0x00ff),      ACK_CHECK_EN); // 4. Send read address byte2
    i2c_master_start(cmd);                                               // 5. I2C start command
    i2c_master_write_byte(cmd, dev_select_read, ACK_CHECK_EN);           // 6. Send I2C address + read
    i2c_master_read(cmd, read_buffer, 15, ACK_CHECK_EN);                 // 7. Read data into read buffer
    i2c_master_read(cmd, &last_byte, 1, ACK_CHECK_DIS);                  // 7. Read data into read buffer
    i2c_master_stop(cmd);                                                // 8. Stop command
    ret = i2c_master_cmd_begin(I2C_PORT_NUM, cmd, 1000 / portTICK_RATE_MS);
    i2c_cmd_link_delete(cmd);

    if (ret != ESP_OK) {
        ESP_LOGE("i2c", "Error initializing EEPROM module");
        return ret;
    }
    ESP_LOGI("i2c", "EEPROM connected successfully");
    for(int i = 0; i<15; i++)
        ESP_LOGW("i2c", "Read data: %u", read_buffer[i]);
    ESP_LOGW("i2c", "Read data: %u", last_byte);
    return ESP_OK;
}


/**
 * Read from the M24C24 EEPROM module.
 * @param byte_addr 16 bit byte address in EEPROM to read
 * @param uint8_t Byte buffer where reading of memory at that location is stored
 * From the datasheet:
 *  - Address based on wiring: 0b1010000, or 0x50
 *  - 8th bit of address byte is Read/Write bit. 1 for read, 0 for write.
 *  - Device Select byte for READ operation:
 *      1 0 1 0 | 0 0 0 | 1, or 0xA1
 */
static int read_byte_eeprom(uint16_t byte_addr, uint8_t* result_buffer) {
    ESP_LOGI("i2c", "Preparing to query EEPROM at address %u", byte_addr);

    uint8_t device_select = I2C_EEPROM_ADDR << 1 | I2C_READ_BIT; // EEPROM addr + Read/Write bit

    int ret;    // Return status
    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, device_select, ACK_CHECK_EN); // Send I2C address
    // i2c_master_write_byte(cmd, 0xA1, ACK_CHECK_EN); // Send 0xAC Command
    i2c_master_stop(cmd);
    ret = i2c_master_cmd_begin(I2C_PORT_NUM, cmd, 1000 / portTICK_RATE_MS);
    i2c_cmd_link_delete(cmd);

    if (ret != ESP_OK) {
        ESP_LOGE("i2c", "Error sending to EEPROM module");
        return ret;
    }
    ESP_LOGI("i2c", "gwar");
    return ESP_OK;
}


/**
 * Send 4 packets:
 * (0x38<<1 | read_bit), 0xAC, 0x33, 0x00
 * Parse the result, return it as a string.
 * 
 * @param result_buff Char buffer where the result is stored
 * 
 * Returns the result in a char buffer 
 * of the form <"temp":69.2,"rh":42.0> for easy jsonification
 */
static int read_aht20(char *result_buff) {
    int ret;
    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, I2C_AHT20_ADDR << 1 | I2C_WRITE_BIT, ACK_CHECK_EN); // Send I2C address
    i2c_master_write_byte(cmd, 0xAC, ACK_CHECK_EN); // Send 0xAC Command
    i2c_master_write_byte(cmd, 0x33, ACK_CHECK_EN); // Send 0x33 data
    i2c_master_write_byte(cmd, 0x00, ACK_CHECK_EN); // Send 0x00 data
    i2c_master_stop(cmd);
    ret = i2c_master_cmd_begin(I2C_PORT_NUM, cmd, 1000 / portTICK_RATE_MS);
    i2c_cmd_link_delete(cmd);

    if (ret != ESP_OK) {
        ESP_LOGW("i2c", "Error querying AHT20 sensor");
        // return ret;
    }

    // Datasheet recommends 80ms delay after asking for data for the sensor to take a reading
    vTaskDelay(800 / portTICK_RATE_MS); 
    ESP_LOGI("i2c", "ready to read");

    // Reads a buffer of 7 bytes
    uint8_t data_buff[7];
    
    cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, I2C_AHT20_ADDR << 1 | I2C_READ_BIT, ACK_CHECK_EN);
    i2c_master_read(cmd, data_buff, 7, ACK_CHECK_DIS);
    // i2c_master_read_byte(cmd, &last, ACK_CHECK_DIS);
    i2c_master_stop(cmd);
    ret = i2c_master_cmd_begin(I2C_PORT_NUM, cmd, 1000 / portTICK_RATE_MS);
    i2c_cmd_link_delete(cmd);

    if (ret != ESP_OK) {
        ESP_LOGW("i2c", "Error reading result from AHT20 sensor");
        // return ret;
    }

    // Dummy placeholder values to test in lieu of real AHT20 data
    data_buff[0] = 28;
    data_buff[1] = 111;
    data_buff[2] = 143;
    data_buff[3] = 165;
    data_buff[4] = 166;
    data_buff[5] = 5;
    data_buff[6] = 232;

    parse_aht20_data(result_buff, data_buff);

    return ESP_OK;
}


/**
 * Takes a data buffer of length 7 bytes from the output of the AHT20
 * Byte 1 is "state". Should be 0x18 if all good.
 * Byte 2, 3, and first half of 4 are humidity data 
 * First half of byte 4, byte 5, 6 are temperature data
 * Byte 7 is CRC data.
 * 
 * Conversion from raw to readable data
 * For temp: Temp(celcius) = (RAW)/2^20 - 50
 * For humidity: %RH = (RAW)/2^20 * 100
 * 
 * @param result_buff Char buffer where the result is stored
 * @param data_buff Byte buffer containing raw data from the AHT sensor
 * 
 * Returns the result in a char buffer 
 * of the form <"temp":69.2,"rh":42.0> for easy jsonification
 */
static void parse_aht20_data(char *result_buff, uint8_t *data_buff) {

    // Parse temperature
    uint32_t temp_signal = 0;
    temp_signal = ((data_buff[3] & 0b1111) << 16) // MSByte. Get the second half of the 4th byte 
                    + (data_buff[4] << 8)         // Get the 5th byte
                    + data_buff[5];               // LSByte
    // Convert from signal to degC
    float temp_float = (temp_signal * 200);
    temp_float = temp_float / (1<<20) - 50;
    temp_float = temp_float * 1.8 + 32; // Convert from C to F

    // Parse Humidity
    uint32_t rh_signal = 0;
    rh_signal = ((data_buff[3] & 0b11110000) >> 4) // LSByte. left 4 bits of 4th data byte
                    + (data_buff[2] << 4)
                    + (data_buff[1] << 12);
    // Convert from signal to %rh
    float rh_float = (rh_signal * 100);
    rh_float = rh_float / (1<<20);

    snprintf(result_buff, 22, "\"temp\":%3.1f,\"rh\":%3.1f", temp_float, rh_float);
    return;
}
