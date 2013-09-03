var Board = require('firmata').Board,
	Game = require('./libs/Game').Game;

var boardConnected = true;

if(boardConnected) {
	var board = new Board('/dev/tty.usbmodemfa131', function(){
		var game = new Game(board);
	});
} else {
	var game = new Game();
}