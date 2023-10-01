# This makefile works as a basic script to flash the arduino using the
# ISP pins, and will be used to flash the main board once my generic ATMega
# board comes in from the factory.
# The ino file is manually compiled into ino.hex by the VSCode Arduino extension 
flash:
	avrdude -c usbtiny -p m328p -U flash:w:./build/sensor_board.ino.hex