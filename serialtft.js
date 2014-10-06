var events = require('events'),
	util = require('util'),
	merge = require('merge'),
	serialport = require('serialport'),
	sleep = require('sleep'),
	mathjs = require('mathjs'),
	math = mathjs;

// Default options
var _options = {
    device: "/dev/ttyAMA0",
    baud_rate: 9600,
    screen_width: 160,
    screen_height: 128
}
 
var SerialTFT = function(options){
 
 	// Call event emitter
	events.EventEmitter.call(this);

	// Define this as parent
	var parent = this;

	// Merge options
	this.options = merge(_options, options)

	// Create serial connection variable
	var connection = null;

	// Screen info
	this.screen = {
		'width': this.options.screen_width,
		'height': this.options.screen_height,
		'width_half': this.options.screen_width / 2,
		'height_half': this.options.screen_height / 2,
	}

	// Font options
	this.font = {
		'small': 1,
		'medium': 2,
		'large': 3
	};

	// Screen rotation
	this.rotation = {
		'portrait_left': 0,
		'portrait_right': 2,
		'landscape_upsidedown': 1,
		'landscape': 3
	}

	// Colors
	this.color = {
		'black': 0,
		'blue': 1,
		'red': 2,
		'green': 3,
		'cyan': 4,
		'magenta': 5,
		'yellow': 6,
		'white': 7,

		'user_black': 8,
		'user_blue': 9,
		'user_red': 10,
		'user_green': 11,
		'user_cyan': 12,
		'user_magenta': 13,
		'user_yellow': 14,
		'user_white': 15,

		'user_1': 8,
		'user_2': 9,
		'user_3': 10,
		'user_4': 11,
		'user_5': 12,
		'user_6': 13,
		'user_7': 14,
		'user_8': 15
	}

	// TFT library command set
	this.commands = {
		'begin': new Buffer([27]),
		'end': new Buffer([255]),
		'return': new Buffer([13]),

		'clear': new Buffer([0]),
		'fg_color': new Buffer([1]),
		'bg_color': new Buffer([2]),
		'screen_rotation': new Buffer([3]),
		'font_size': new Buffer([4]),
		'line_start': new Buffer([5]),
		'pos_text': new Buffer([6]),
		'pos_pixel': new Buffer([7]),
		'draw_line': new Buffer([8]),
		'draw_box': new Buffer([9]),
		'draw_filled_box': new Buffer([10]),
		'draw_circle': new Buffer([11]),
		'draw_filled_circle': new Buffer([12]),
		'display_bitmap': new Buffer([13]),
		'brightness': new Buffer([14]),
		'set_color': new Buffer([15]),
		'draw_pixel': new Buffer([16]),
	};

	// Call connect function after next tick
	process.nextTick(function(){
		parent.connect();
	})
 
	// Connect function
	this.connect = function(){

		// Create serial connection to screen
		this.connection = new serialport.SerialPort(this.options.device, {
			baudrate: this.options.baud_rate
		});
 
 		// Emit connect event
 		this.connection.on('open', function(){
			parent.emit('connect');
		});
	}

	// Write to serial connection
	var _write = function(command){
		if (Array.isArray(command)){
			command.forEach(function(com){
				parent.connection.write(com);
			})
		}else{
			parent.connection.write(command) ;
		}
	}

	// Clear screen
	this.clear_screen = function(){
		_write([this.commands.begin, this.commands.clear, this.commands.end]);
		sleep.usleep(3000);
	}

	// Write a text string
	this.write = function(text){
		var packet_size = 16;

		if (text.length < packet_size){
			_write(text);
		}else{
			var re = new RegExp('(.{1,' + packet_size + '})', 'g');
			text = text.match(re) 
			text.forEach(function(chunk){
				_write(chunk);
			})
		}
	}

	// Write a text string followed by a carriage return
	this.write_line = function(text){
		this.write(text);
		_write(this.commands.return);
	}

	// Set up font size
	this.font_size = function(font_size){
		_write([this.commands.begin, this.commands.font_size, new Buffer([font_size]), this.commands.end]);
	}

	// Set up screen Rotation
	this.screen_rotation = function(screen_rotation){
		_write([this.commands.begin, this.commands.screen_rotation, new Buffer([screen_rotation]), this.commands.end]);
	}

	// Set screen brightness
	this.brightness = function(brightness){
		_write([this.commands.begin, this.commands.brightness, new Buffer([brightness]), this.commands.end]);
	}

	// Set the active foreground colour
	this.fg_color = function(color){
		_write([this.commands.begin, this.commands.fg_color, new Buffer([color]), this.commands.end]);
	}

	// Set the active background colour
	this.bg_color = function(color){
		_write([this.commands.begin, this.commands.bg_color, new Buffer([color]), this.commands.end]);
	}

	// Draw a bitmap from the SD card
	this.draw_bitmap = function(file, x, y){
		_write([this.commands.begin, this.commands.display_bitmap, new Buffer([x]), new Buffer([y]), file, this.commands.end]);
	}

	// Go to pixel location
	this.goto_pixel = function(pixel_x, pixel_y){
		_write([this.commands.begin, this.commands.pos_pixel, new Buffer([pixel_x]), new Buffer([pixel_y]), this.commands.end]);
	}

	// Go to character position, depends on font size
	this.goto_char = function(char_x, char_y){
		_write([this.commands.begin, this.commands.pos_text, new Buffer([char_x]), new Buffer([char_y]), this.commands.end]);
	}

	// Draw pixel
	this.draw_pixel = function(x, y, color){
		_write([this.commands.begin, this.commands.draw_pixel, new Buffer([x]), new Buffer([y]), new Buffer([color]), this.commands.end]);
	}

	// Draw a line in foreground color
	this.draw_line = function(x1, y1, x2, y2, color){
		_write([this.commands.begin, this.commands.draw_line, new Buffer([x1]), new Buffer([y1]), new Buffer([x2]), new Buffer([y2]), this.commands.end]);
	}

	// Draw box fast
	this.draw_box_fast = function(x1, y1, x2, y2, color){
		this.draw_line(x1, y1, x2, y1, color);
		this.draw_line(x2, y1, x2, y2, color);
		this.draw_line(x2, y2, x1, y2, color);
		this.draw_line(x1, y2, x1, y1, color);
	}

	// Draw a rectangle outline in foreground color
	this.draw_box = function(x1, y1, x2, y2, color){
		_write([this.commands.begin, this.commands.draw_box, new Buffer([x1]), new Buffer([y1]), new Buffer([x2]), new Buffer([y2]), this.commands.end]);
	} 

	// Draw rect
	this.draw_rect = function(x, y, width, height, color){
		this.draw_box(x, y, x + width, y + height, color);
	} 

	// Draw a rectangle filled with foreground color
	this.draw_filled_box = function(x1, y1, x2, y2, color){
		_write([this.commands.begin, this.commands.draw_filled_box, new Buffer([x1]), new Buffer([y1]), new Buffer([x2]), new Buffer([y2]), this.commands.end]);
	}  

	// Draw filled rect
	this.draw_filled_rect = function(x, y, width, height, color){
		this.draw_filled_box(x, y, x + width, y + height, color);
	}

	// Draw a circle outline in foreground color
	this.draw_circle = function(x, y, radius, color){
		_write([this.commands.begin, this.commands.draw_circle, new Buffer([x]), new Buffer([y]), new Buffer([radius]), this.commands.end]);
	}

	// Draw a circle filled with foreground color
	this.draw_filled_circle = function(x, y, radius, color){
		_write([this.commands.begin, this.commands.draw_filled_circle, new Buffer([x]), new Buffer([y]), new Buffer([radius]), this.commands.end]);
	}

	// Draw a line from origin x,y of length radius at degrees minutes
	this.analog_hand = function(origin_x, origin_y, radius, position, intervals, color){

		intervals = intervals == undefined ? 60.0:intervals;

		var angle = (position / intervals) * (2 * math.pi);

		var x = origin_x + radius * math.sin(angle)
		var y = origin_y - radius * math.cos(angle)

		var x_a = origin_x + 6 * math.sin(angle)
		var y_a = origin_y - 6 * math.cos(angle)

		this.draw_line(math.round(x_a), math.round(y_a), math.round(x), math.round(y), color)
	}

	// Convert a hex color to RGB values
	this.hex_to_rgb = function(hex){
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}

	// Set user color to Hex
	this.set_color_hex = function(color, hex){
		hex = this.hex_to_rgb(hex);
		this.set_color_rgb(color, hex.r, hex.g, hex.b);
	}

	// Set user color to RGB
	this.set_color_rgb = function(color, r, g, b){
		rgb565 = (((31*(r+4))/255)<<11) | (((63*(g+2))/255)<<5) | ((31*(b+4))/255)
		this.set_color_packed(color, rgb565);
	}

	// Set user color to packed buffer
	this.set_color_packed = function(color, packed_color){
		var div = math.floor(packed_color/256);
		var rem = packed_color % 256;
		_write([this.commands.begin, this.commands.set_color, new Buffer([color]), new Buffer([div]), new Buffer([rem]), this.commands.end]);
	}
}
 
// 	Inherit event emitter
util.inherits(SerialTFT, events.EventEmitter);

module.exports = SerialTFT;
