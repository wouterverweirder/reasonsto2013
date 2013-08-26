(function(){
	var socket = io.connect('/');
	var PLAYER_STATES = {
		WAIT_FOR_GAME_TO_START: 0,
		WAIT_FOR_TURN: 1,
		YOUR_TURN: 2,
		GAME_FINISHED: 3
	};
	var playerState = PLAYER_STATES.WAIT_FOR_GAME_TO_START;

	$('body').on('touchstart click', function(e){
		if(playerState == PLAYER_STATES.YOUR_TURN) {
			socket.emit('trigger');
		}
	});

	socket.on('connect', function(){
	});

	socket.on('playerState', function(value){
		playerState = value.state;
		switch(playerState) {
			case PLAYER_STATES.WAIT_FOR_GAME_TO_START:
				$('#gameState').text('wait for game to start');
				break;
			case PLAYER_STATES.WAIT_FOR_TURN:
				$('#gameState').text('wait for your turn');
				break;
			case PLAYER_STATES.YOUR_TURN:
				setTimeLeft(value.timeLeft, value.timeTotal);
				break;
			case PLAYER_STATES.GAME_FINISHED:
				$('#gameState').text('game finished');
				break;
		}
	});

	function setTimeLeft(timeLeft, timeTotal) {
		$('#gameState').text('HIT IT');
		$("#background").css('width', (timeLeft * 100 / timeTotal) + '%').animate({
			width: '0%'
		}, timeLeft, "linear");
	}
})();