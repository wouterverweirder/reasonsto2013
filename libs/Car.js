var EventEmitter = require('events').EventEmitter;
var Player = require('./Player').Player;
var Game;

var Car = function(GameClass, board, leds, team, gameState) {
	Game = GameClass;
	this.board = board;
	this.leds = leds;
	this.team = team;
	this.gameState = gameState;
	this.ledCounter = 0;
	this.activeLedCounter = 0;
	this.activeLedDirection = 1;
	this.numTriggers = 0;
	this.numLeds = this.leds.length;
	if(this.board) {
		for(var i = 0; i < this.numLeds; i++) {
			this.board.pinMode(this.leds[i].pin, board.MODES.OUTPUT);
		}
	}
	this.players = [];
	this.numPlayers = 0;
};

Car.prototype.__proto__ = EventEmitter.prototype;

Car.prototype.onPlayerConnect = function(socket) {
	var player = new Player(Game, socket, this.gameState, this.team);
	player.on('disconnect', this.onPlayerDisconnect.bind(this, player));
	player.on('trigger', this.onPlayerTrigger.bind(this, player));
	this.players.push(player);
	this.numPlayers++;
	this.emit('numPlayers', this.numPlayers);
};

Car.prototype.onPlayerDisconnect = function(player){
	player.removeAllListeners('disconnect');
	player.removeAllListeners('trigger');
	var index = this.players.indexOf(player);
	if(index > -1) {
		this.players.splice(index, 1);
	}
	this.numPlayers--;
	this.emit('numPlayers', this.numPlayers);
};

Car.prototype.setGameState = function(gameState){
	this.gameState = gameState;
	switch(this.gameState) {
		case Game.GAME_STATES.WAITING: return this.onGameStateWaiting();
		case Game.GAME_STATES.STARTED: return this.onGameStateStarted();
		case Game.GAME_STATES.FINISHED: return this.onGameStateFinished();
	}
}

Car.prototype.onGameStateWaiting = function() {
	for(var i = 0; i < this.numPlayers; i++) {
		this.players[i].setGameState(this.gameState);
	}
};

Car.prototype.onGameStateStarted = function() {
	this.activePlayer = false;
	this.numTriggers = 0;
	this.ledCounter = 0;
	this.activeLedCounter = 0;
	this.activeLedDirection = 1;
	this.onLedCounterChanged();
	for(var i = 0; i < this.numPlayers; i++) {
		this.players[i].setGameState(this.gameState);
	}
};

Car.prototype.onPlayerTrigger = function() {
	this.numTriggers++;
	if(this.numTriggers > this.numPlayers) {
		this.numTriggers = 0;
		this.ledCounter++;
		this.activeLedCounter += this.activeLedDirection;
		if(this.activeLedCounter <= 0 || (this.activeLedCounter + 1) >= this.numLeds) {
			this.activeLedDirection *= -1;
		}
		this.onLedCounterChanged();
	}
};

Car.prototype.onLedCounterChanged = function() {
	for(var i = 0; i < this.numLeds; i++) {
		this.leds[i].state = (this.activeLedCounter == i);
		if(this.board) {
			this.board.digitalWrite(this.leds[i].pin, (this.leds[i].state) ? 1 : 0);
		}
	}
	this.emit('ledsChanged');
};

Car.prototype.onGameStateFinished = function() {
	for(var i = 0; i < this.numPlayers; i++) {
		this.players[i].setGameState(this.gameState);
	}
};

exports.Car = Car;