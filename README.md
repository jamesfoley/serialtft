serialtft
=========

NodeJS clone of Gadgetoid's Serial-TFT-Python library. Pretty much works exactly the same way as the python library

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
