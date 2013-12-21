var events = require('events');
var util = require('util');
var merge = require('merge');
var serialport = require('serialport');
var sleep = require('sleep');

//	Default options
var _options = {
    device: "/dev/ttyAMA0",
    baud_rate: 9600,
    clear_on_exit: true
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
 
 	//	Call event emitter
	events.EventEmitter.call(this);

	//	Define this as parent
	var parent = this;

	//	Merge options
	this.options = merge(_options, options)
	//	Create serial connection variable
	var connection = null;

	//	Font options
	this.font = {
		'small': 1,
		'medium': 2,
		'large': 3
	};

	//	Screen rotation
	this.rotation = {
		'portrait_left': 0,
		'portrait_right': 2,
		'landscape_upsidedown': 1,
		'landscape': 3
	}

	//	Colors
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

	//	Call connect function after next tick
	process.nextTick(function(){
		parent.connect();
	})
 
	//	Connect function
	this.connect = function(){

		this.connection = new serialport.SerialPort(this.options.device, {
			baudrate: this.options.baud_rate
		});
 
 		//	Emit connect event
 		this.connection.on('open', function(){
			parent.emit('connect');
		});
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

	//	Clear screen
	this.clear_screen = function(){
		_write([commands.begin, commands.clear, commands.end]);
		sleep.usleep(3000);
	}

	//	Write a text string
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

	//	Write a text string followed by a carriage return
	this.write_line = function(text){
		this.write(text);
		_write(commands.return);
	}

	//	Set up font size
	this.font_size = function(font_size){
		_write([commands.begin, commands.font_size, new Buffer([font_size]), commands.end]);
	}

	//	Set up screen Rotation
	this.screen_rotation = function(screen_rotation){
		_write([commands.begin, commands.screen_rotation, new Buffer([screen_rotation]), commands.end]);
	}

	//	Set the active foreground colour
	this.fg_color = function(color){
		_write([commands.begin, commands.fg_color, new Buffer([color]), commands.end]);
	}

	//	Set the active background colour
	this.bg_color = function(color){
		_write([commands.begin, commands.bg_color, new Buffer([color]), commands.end]);
	}

	//	Draw a bitmap from the SD card
	this.draw_bitmap = function(file, x, y){
		_write([commands.begin, commands.display_bitmap, new Buffer([x]), new Buffer([y]), file, commands.end]);
	}
}

//	Inherit event emitter
util.inherits(SerialTFT, events.EventEmitter);

module.exports = SerialTFT;