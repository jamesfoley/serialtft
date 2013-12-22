var events = require('events'),
	util = require('util'),
	merge = require('merge'),
	serialport = require('serialport'),
	sleep = require('sleep'),
	mathjs = require('mathjs'),
	math = mathjs();

// Default options
var _options = {
    device: "/dev/ttyAMA0",
    baud_rate: 9600,
    clear_on_exit: true,
    screen_width: 160,
    screen_height: 128
}

var commands = {
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
	    'white': 7
	}

	// Call connect function after next tick
	process.nextTick(function(){
		parent.connect();
	})
 
	// Connect function
	this.connect = function(){

		this.connection = new serialport.SerialPort(this.options.device, {
			baudrate: this.options.baud_rate
		});
 
 		// Emit connect event
 		this.connection.on('open', function(){
			parent.emit('connect');
		});

		this.connection.on('close', function(){
			if (clear_on_exit){
				this.clear_screen();
			}
		})
	}

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
		_write([commands.begin, commands.clear, commands.end]);
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
		_write(commands.return);
	}

	// Set up font size
	this.font_size = function(font_size){
		_write([commands.begin, commands.font_size, new Buffer([font_size]), commands.end]);
	}

	// Set up screen Rotation
	this.screen_rotation = function(screen_rotation){
		_write([commands.begin, commands.screen_rotation, new Buffer([screen_rotation]), commands.end]);
	}

	// Set screen brightness
	this.brightness = function(brightness){
		_write([commands.begin, commands.brightness, new Buffer([brightness]), commands.end]);
	}

	// Set the active foreground colour
	this.fg_color = function(color){
		_write([commands.begin, commands.fg_color, new Buffer([color]), commands.end]);
	}

	// Set the active background colour
	this.bg_color = function(color){
		_write([commands.begin, commands.bg_color, new Buffer([color]), commands.end]);
	}

	// Draw a bitmap from the SD card
	this.draw_bitmap = function(file, x, y){
		_write([commands.begin, commands.display_bitmap, new Buffer([x]), new Buffer([y]), file, commands.end]);
	}

	// Go to pixel location
	this.goto_pixel = function(pixel_x, pixel_y){
		_write([commands.begin, commands.pos_pixel, new Buffer([pixel_x]), new Buffer([pixel_y]), commands.end]);
	}

	// Go to character position, depends on font size
	this.goto_char = function(char_x, char_y){
		_write([commands.begin, commands.pos_text, new Buffer([char_x]), new Buffer([char_y]), commands.end]);
	}

	// Draw pixel
	this.draw_pixel = function(x, y, color){
		_write([commands.begin, commands.draw_pixel, new Buffer([x]), new Buffer([y]), new Buffer([color]), commands.end]);
	}

	// Draw a line in foreground color
	this.draw_line = function(x1, y1, x2, y2, color){
		_write([commands.begin, commands.draw_line, new Buffer([x1]), new Buffer([y1]), new Buffer([x2]), new Buffer([y2]), new Buffer([color]), commands.end]);
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
		_write([commands.begin, commands.draw_box, new Buffer([x1]), new Buffer([y1]), new Buffer([x2]), new Buffer([y2]), new Buffer([color]), commands.end]);
	} 

	// Draw rect
	this.draw_rect = function(x, y, width, height, color){
		this.draw_box(x, y, x + width, y + height, color);
	} 

	// Draw a rectangle filled with foreground color
	this.draw_filled_box = function(x1, y1, x2, y2, color){
		_write([commands.begin, commands.draw_filled_box, new Buffer([x1]), new Buffer([y1]), new Buffer([x2]), new Buffer([y2]), new Buffer([color]), commands.end]);
	}  

	// Draw filled rect
	this.draw_filled_rect = function(x, y, width, height, color){
		this.draw_filled_box(x, y, x + width, y + height, color);
	}

	// Draw a circle outline in foreground color
	this.draw_circle = function(x, y, radius, color){
		_write([commands.begin, commands.draw_circle, new Buffer([x]), new Buffer([y]), new Buffer([radius]), new Buffer([color]), commands.end]);
	}

	// Draw a circle filled with foreground color
	this.draw_filled_circle = function(x, y, radius, color){
		_write([commands.begin, commands.draw_filled_circle, new Buffer([x]), new Buffer([y]), new Buffer([radius]), new Buffer([color]), commands.end]);
	}

	// Draw a line from origin x,y of length radius at degrees minutes
	this.analog_hand = function(origin_x, origin_y, radius, position, color){

		var angle = (position / 60.0) * (2 * math.pi);

		var x = origin_x + radius * math.sin(angle)
		var y = origin_y - radius * math.cos(angle)

		var x_a = origin_x + 6 * math.sin(angle)
		var y_a = origin_y - 6 * math.cos(angle)

		this.draw_line(math.round(x_a), math.round(y_a), math.round(x), math.round(y), color)
	}
}
 
// 	Inherit event emitter
util.inherits(SerialTFT, events.EventEmitter);

module.exports = SerialTFT;