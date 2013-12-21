var util = require('util');
var EventEmitter = require('events').EventEmitter;
var serialport = require('serialport').SerialPort;
var merge = require('merge');

function SerialTFTFactory() {

	//	Define factory as self
	var factory = this;

	//	Default options
	var _options = {
		device: "/dev/ttyAMA0",
		baud_rate: 9600,
		clear_on_exit: true
	}

	function SerialTFT(options) {

		var self = this;

		//	Merge options
		this.options = merge(_options, options)

		self.open();
	}

	SerialTFT.prototype.open = function(callback) {

		var self = this;

		self.emit('open')

		if(callback){ callback(); }
	}

	SerialTFT.prototype._emitData = function(d) {
		var self = this;
		self.options.dataCallback(d);
	};

	factory.SerialTFT = SerialTFT;
}

util.inherits(SerialTFTFactory, EventEmitter);

module.exports = new SerialTFTFactory();