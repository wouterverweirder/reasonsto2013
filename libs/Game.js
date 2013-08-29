var express= require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	path = require('path'),
	Admin = require('./Admin').Admin,
	Player = require('./Player').Player;

var GAME_STATES = {
	WAITING: 0,
	STARTED: 1,
	FINISHED: 2
};

var Game = function(board) {
	this.board = board;
	this.gameState = GAME_STATES.WAITING;
	this.playerTimeout = false;
	this.testInterval = false;
	this.leds = [
		{pin: 8, state: false},
		{pin: 9, state: false},
		{pin: 10, state: false},
		{pin: 11, state: false}
	];
	this.ledCounter = 0;
	this.activeLedCounter = 0;
	this.activeLedDirection = 1;
	this.numLeds = this.leds.length;
	if(this.board) {
		for(var i = 0; i < this.numLeds; i++) {
			this.board.pinMode(this.leds[i].pin, board.MODES.OUTPUT);
		}
	}
	this.playerTime = 1000; //time a player has to press the screen on time
	this.admins = [];
	this.players = [];
	this.numPlayersOverTime = 0;
	this.activePlayer = false;
	this.numPlayers = 0;
	this.startServer();
};

Game.GAME_STATES = GAME_STATES;

Game.prototype.startServer = function() {
	server.listen(80);
	app.use(express.static(path.join(__dirname, '..', 'public')));
	app.get('/', function(req, res){
		res.sendfile(path.join(__dirname, '..', 'public', 'index.html'));
	});
	io.sockets.on('connection', this.onSocketConnection.bind(this));
};

Game.prototype.setGameState = function(gameState) {
	this.gameState = gameState;
	this.sendGameStateToAdmins(gameState);
	clearTimeout(this.playerTimeout);
	clearInterval(this.testInterval);
	switch(this.gameState) {
		case GAME_STATES.WAITING: return this.onGameStateWaiting();
		case GAME_STATES.STARTED: return this.onGameStateStarted();
		case GAME_STATES.FINISHED: return this.onGameStateFinished();
	}
};

Game.prototype.onGameStateWaiting = function() {
	for(var i = 0; i < this.numPlayers; i++) {
		var player = this.players[i];
		player.setPlayerState(Player.PLAYER_STATES.WAIT_FOR_GAME_TO_START);
	}
};

Game.prototype.onGameStateStarted = function() {
	this.activePlayer = false;
	this.ledCounter = 0;
	this.activeLedCounter = 0;
	this.activeLedDirection = 1;
	this.onLedCounterChanged();
	for(var i = 0; i < this.numPlayers; i++) {
		var player = this.players[i];
		player.setPlayerState(Player.PLAYER_STATES.WAIT_FOR_TURN);
	}
	this.activateNextPlayer();
	//test
	//this.testInterval = setInterval(this.onActivePlayerTrigger.bind(this), 200);
};

Game.prototype.onActivePlayerTrigger = function() {
	this.ledCounter++;
	this.activeLedCounter += this.activeLedDirection;
	if(this.activeLedCounter <= 0 || (this.activeLedCounter + 1) >= this.numLeds) {
		this.activeLedDirection *= -1;
	}
	this.onLedCounterChanged();
	this.activateNextPlayer();
};

Game.prototype.onLedCounterChanged = function() {
	for(var i = 0; i < this.numLeds; i++) {
		this.leds[i].state = (this.activeLedCounter == i);
		if(this.board) {
			this.board.digitalWrite(this.leds[i].pin, (this.leds[i].state) ? 1 : 0);
		}
	}
	this.sendLedStates();
};

Game.prototype.activateNextPlayer = function() {
	if(this.gameState == GAME_STATES.STARTED) {
		var previousPlayer = this.activePlayer;
		if(previousPlayer) {
			this.deactivatePlayer(previousPlayer);
		}
		var lastActivePlayerIndex = 1 + this.players.indexOf(previousPlayer);
		if(lastActivePlayerIndex >= this.numPlayers) {
			lastActivePlayerIndex = 0;
		}
		if(lastActivePlayerIndex < this.numPlayers) {
			this.activatePlayer(this.players[lastActivePlayerIndex]);
		}
	}
};

Game.prototype.activatePlayer = function(player) {
	player.setPlayerState(Player.PLAYER_STATES.YOUR_TURN, this.playerTime, this.playerTime);
	this.activePlayer = player;
	player.on('trigger', this.onActivePlayerTrigger.bind(this));
	this.playerTimeout = setTimeout(this.activateNextPlayer.bind(this), this.playerTime);
};

Game.prototype.deactivatePlayer = function(player) {
	clearTimeout(this.playerTimeout);
	player.removeAllListeners('trigger');
	player.setPlayerState(Player.PLAYER_STATES.WAIT_FOR_TURN);
	player.hasTriggered = false;
	this.activePlayer = false;
};

Game.prototype.onGameStateFinished = function() {
	for(var i = 0; i < this.numPlayers; i++) {
		var player = this.players[i];
		player.setPlayerState(Player.PLAYER_STATES.GAME_FINISHED);
	}
};

Game.prototype.onSocketConnection = function(socket) {
	var address = socket.handshake.address;
	if(address.address == '127.0.0.1') {
		this.onAdminJoin(socket);
	} else {
		this.onPlayerJoin(socket);
	}
};

Game.prototype.onAdminJoin = function(socket) {
	var admin = new Admin(socket);
	admin.on('disconnect', this.onAdminDisconnect.bind(this, admin));
	admin.on('gameState', this.onAdminGameState.bind(this));
	this.admins.push(admin);
	admin.sendPlayerCount(this.numPlayers);
	admin.sendGameState(this.gameState);

	var os=require('os');
	var ifaces=os.networkInterfaces();
	var ip = false;
	for (var dev in ifaces) {
	  ifaces[dev].forEach(function(details){
	    if (!ip && details.family=='IPv4' && details.address != '127.0.0.1') {
	    	ip = details.address;
	    }
	  });
	}
	if(ip) {
		admin.sendIp(ip);
	}
};

Game.prototype.onAdminDisconnect = function(admin) {
	var index = this.admins.indexOf(admin);
	if(index > -1) {
		this.admins.splice(index, 1);
	}
};

Game.prototype.onAdminGameState = function(gameState) {
	this.setGameState(gameState);
}

Game.prototype.onPlayerJoin = function(socket) {
	var state = Player.PLAYER_STATES.WAIT_FOR_GAME_TO_START;
	switch(this.gameState) {
		case GAME_STATES.STARTED:
			state = Player.PLAYER_STATES.WAIT_FOR_TURN;
			break;
		case GAME_STATES.FINISHED:
			state = Player.PLAYER_STATES.GAME_FINISHED;
			break;
		default:
			state = Player.PLAYER_STATES.WAIT_FOR_GAME_TO_START;
			break;
	}
	var player = new Player(socket, state, this.numPlayersOverTime);
	player.on('disconnect', this.onPlayerDisconnect.bind(this, player));
	this.players.push(player);
	this.numPlayers++;
	this.numPlayersOverTime++;
	this.sendPlayerCount();
};

Game.prototype.onPlayerDisconnect = function(player){
	var index = this.players.indexOf(player);
	if(index > -1) {
		this.players.splice(index, 1);
	}
	this.numPlayers--;
	this.sendPlayerCount();
	if(player == this.activePlayer) {
		this.activateNextPlayer();
	}
};

Game.prototype.sendPlayerCount = function(){
	var adminCount = this.admins.length;
	for(var i = 0; i < adminCount; i++) {
		this.admins[i].sendPlayerCount(this.numPlayers);
	}
};

Game.prototype.sendLedStates = function(){
	var adminCount = this.admins.length;
	console.log('sendLedStates to ' + adminCount + " admins");
	for(var i = 0; i < adminCount; i++) {
		this.admins[i].sendLedStates(this.ledCounter, this.leds);
	}
};

Game.prototype.sendGameStateToAdmins = function() {
	var adminCount = this.admins.length;
	for(var i = 0; i < adminCount; i++) {
		this.admins[i].sendGameState(this.gameState);
	}
};

exports.Game = Game;