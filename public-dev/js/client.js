(function(){
	var socket = io.connect('/');
	var GAME_STATES = {
		WAITING: 0,
		STARTED: 1,
		FINISHED: 2
	};
	var gameState = GAME_STATES.WAITING;
	var team;

	$('body').on('touchstart mousedown', function(e){
		$('#background').css('left', '10px');
		$('#background').css('top', '10px');
		$('#background').css('right', '10px');
		$('#background').css('bottom', '10px');
		if(gameState == GAME_STATES.STARTED) {
			socket.emit('trigger');
		}
	});

	$('body').on('touchend mouseup', function(e){
		$('#background').css('left', '0px');
		$('#background').css('top', '0px');
		$('#background').css('right', '0px');
		$('#background').css('bottom', '0px');
	});

	socket.on('connect', function(){
	});

	socket.on('team', function(value){
		team = value;
		$('#background').css('background-color', value);
	});

	socket.on('gameState', function(value){
		gameState = value;
		switch(gameState) {
			case GAME_STATES.WAITING:
				$('#gameState').text('wait for game to start');
				break;
			case GAME_STATES.STARTED:
				$('#gameState').text('hit it');
				break;
			case GAME_STATES.FINISHED:
				$('#gameState').text('game finished');
				break;
		}
	});
})();