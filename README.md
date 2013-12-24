serialtft
=========

NodeJS clone of Gadgetoid's Serial-TFT-Python library for the HobbyTronics Serial-TFT board: http://www.hobbytronics.co.uk/tft-serial-display-18

The original python library can be found at https://github.com/Gadgetoid/Serial-TFT-Python

Install
----

```
npm install serialtft
```


Example
----

```
var SerialTFT = require("serialtft");
var tft = new SerialTFT();

tft.on('connect', function(){
    tft.clear_screen();
    tft.write("Hello world!");
});
```


Important
----

The module was built to work with Gadgetoid's custom firmware for the screen. Although most of the modules methods should work with the firmware that's on the screen from the factory, I can't guarantee everything will be perfect.

For best results, pick up a USB to serial breakout board and flash the custom firmware at https://github.com/Gadgetoid/serial_tft_18

You can pick up a breakout board quite cheap from somewhere like eBay, or you can use this one from HobbyTronics http://www.hobbytronics.co.uk/ftdi-basic. I used a CP2012 USB to UART board I had laying around, it just needed to be modified slightly to bring out the DTR pin for the auto-reset. A quick Google for "CP2012 auto-reset" should help you out if you're using the same breakout board. You'll want to solder some headers to the set of 6 pins on the same side as the SD card slot, and then just link up the breakout board following the names of the pins that should match on both the lcd and breakout. You will want to use DTR on the breakout for the RES pin on the lcd.

Once connected, it'll act as an Arduino UNO, and can be updated using the Arduino software.

