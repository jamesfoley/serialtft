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
