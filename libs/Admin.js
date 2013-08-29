var EventEmitter = require('events').EventEmitter;

var Admin = function(socket) {
	this.socket = socket;

	this.socket.on('disconnect', this.onDisconnect.bind(this));
	this.socket.on('gameState', this.onSetGameState.bind(this));

	this.socket.join('admin');
	this.socket.set('admin', 'admin');
	this.socket.emit('admin', 'admin');
};

Admin.prototype.__proto__ = EventEmitter.prototype;

Admin.prototype.onDisconnect = function(){
	this.emit('disconnect');
};

Admin.prototype.sendIp = function(ip){
	this.socket.emit('ip', ip);
};

Admin.prototype.sendPlayerCounts = function(playerCounts) {
	this.socket.emit('playerCounts', playerCounts);
};

Admin.prototype.sendLedStates = function(team, ledCounter, leds) {
	this.socket.emit('ledStates', {team: team, scans: ledCounter, leds: leds});
};

Admin.prototype.sendGameState = function(gameState) {
	this.socket.emit('gameState', gameState);
};

Admin.prototype.onSetGameState = function(gameState) {
	this.emit('gameState', gameState);
};

exports.Admin = Admin;