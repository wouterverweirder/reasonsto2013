var EventEmitter = require('events').EventEmitter;

var PLAYER_STATES = {
	WAIT_FOR_GAME_TO_START: 0,
	WAIT_FOR_TURN: 1,
	YOUR_TURN: 2,
	GAME_FINISHED: 3
};

var Player = function(socket, playerState, nr) {
	this.socket = socket;
	this.nr = nr;
	this.hasTriggered = false;
	this.socket.on('disconnect', this.onDisconnect.bind(this));
	this.socket.on('trigger', this.onTrigger.bind(this));
	this.setPlayerState(playerState);
};

Player.prototype.__proto__ = EventEmitter.prototype;

Player.prototype.setPlayerState = function(playerState, timeLeft, timeTotal) {
	this.playerState = playerState;
	this.socket.emit('playerState', {
		state: this.playerState,
		timeLeft: timeLeft,
		timeTotal: timeTotal
	});
};

Player.prototype.onTrigger = function(){
	if(this.playerState == PLAYER_STATES.YOUR_TURN) {
		this.hasTriggered = true;
		this.emit('trigger');
	}
};

Player.prototype.onDisconnect = function(){
	this.emit('disconnect');
};

Player.PLAYER_STATES = PLAYER_STATES;

exports.Player = Player;