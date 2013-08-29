var express= require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	path = require('path'),
	Admin = require('./Admin').Admin,
	Car = require('./Car').Car;

var GAME_STATES = {
	WAITING: 0,
	STARTED: 1,
	FINISHED: 2
};

var Game = function(board) {
	this.board = board;
	this.gameState = GAME_STATES.WAITING;
	this.cars = [];
	this.createCar([
		{pin: 4, state: false},
		{pin: 5, state: false},
		{pin: 6, state: false},
		{pin: 7, state: false}
	], 'black');
	this.createCar([
		{pin: 8, state: false},
		{pin: 9, state: false},
		{pin: 10, state: false},
		{pin: 11, state: false}
	], 'blue');
	this.numCars = this.cars.length;
	this.admins = [];
	this.startServer();
};

Game.GAME_STATES = GAME_STATES;

Game.prototype.createCar = function(pins, team) {
	var car = new Car(Game, this.board, pins, team, this.gameState);
	car.on('numPlayers', this.sendPlayerCount.bind(this));
	car.on('ledsChanged', this.onLedsChanged.bind(this, car));
	this.cars.push(car);
};

Game.prototype.startServer = function() {
	server.listen(8888);
	app.use(express.static(path.join(__dirname, '..', 'public')));
	app.get('/', function(req, res){
		res.sendfile(path.join(__dirname, '..', 'public', 'index.html'));
	});
	io.sockets.on('connection', this.onSocketConnection.bind(this));
};

Game.prototype.setGameState = function(gameState) {
	this.gameState = gameState;
	this.sendGameStateToAdmins(gameState);
	for(var i = 0; i < this.numCars; i++) {
		this.cars[i].setGameState(this.gameState);
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
	admin.sendPlayerCounts(this.getPlayerCounts());
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

Game.prototype.getPlayerCounts = function() {
	var playerCounts = [];
	for(var i = 0; i < this.numCars; i++) {
		playerCounts.push({team: this.cars[i].team, playerCount: this.cars[i].numPlayers});
	}
	return playerCounts;
};

Game.prototype.onAdminDisconnect = function(admin) {
	var index = this.admins.indexOf(admin);
	if(index > -1) {
		this.admins.splice(index, 1);
	}
};

Game.prototype.onAdminGameState = function(gameState) {
	this.setGameState(gameState);
};

Game.prototype.onPlayerJoin = function(socket) {
	var car = this.getCarToJoin();
	car.onPlayerConnect(socket);
};

Game.prototype.getCarToJoin = function() {
	var smallestCar = this.cars[0];
	for(var i = 1; i < this.numCars; i++) {
		if(this.cars[i].numPlayers < smallestCar.numPlayers) {
			smallestCar = this.cars[i];
		} 
	}
	return smallestCar;
};

Game.prototype.sendPlayerCount = function(){
	var adminCount = this.admins.length;
	var playerCounts = this.getPlayerCounts();
	for(var i = 0; i < adminCount; i++) {
		this.admins[i].sendPlayerCounts(playerCounts);
	}
};

Game.prototype.onLedsChanged = function(car){
	var adminCount = this.admins.length;
	for(var i = 0; i < adminCount; i++) {
		this.admins[i].sendLedStates(car.team, car.ledCounter, car.leds);
	}
};

Game.prototype.sendGameStateToAdmins = function() {
	var adminCount = this.admins.length;
	for(var i = 0; i < adminCount; i++) {
		this.admins[i].sendGameState(this.gameState);
	}
};

exports.Game = Game;