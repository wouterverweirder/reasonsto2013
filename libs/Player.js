var EventEmitter = require('events').EventEmitter;

var Game;
var Player = function(gameClass, socket, gameState, team) {
	Game = gameClass;
	this.socket = socket;
	this.socket.on('disconnect', this.onDisconnect.bind(this));
	this.socket.on('trigger', this.onTrigger.bind(this));
	this.setGameState(gameState);
	this.setTeam(team);
};

Player.prototype.__proto__ = EventEmitter.prototype;

Player.prototype.setGameState = function(gameState) {
	this.gameState = gameState;
	this.socket.emit('gameState', this.gameState);
};

Player.prototype.setTeam = function(team) {
	this.team = team;
	this.socket.emit('team', this.team);
};

Player.prototype.onTrigger = function(){
	if(this.gameState == Game.GAME_STATES.STARTED) {
		this.emit('trigger');
	}
};

Player.prototype.onDisconnect = function(){
	this.emit('disconnect');
};

exports.Player = Player;