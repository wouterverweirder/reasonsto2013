var Board = require('firmata').Board,
	Game = require('./libs/Game').Game;

/*
var board = new Board('/dev/tty.usbmodemfa131', function(){
	var game = new Game(board);
});
*/
var game = new Game();