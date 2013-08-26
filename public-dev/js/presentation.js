(function(){

	var GAME_STATES = {
		WAITING: 0,
		STARTED: 1,
		FINISHED: 2
	};

	var $startGameButton = $("#startGameButton");
	var $endGameButton = $("#endGameButton");
	var socket;

	function init() {
		initUI();
		initSocket();
		initCamera();
	}

	function initUI() {
		$startGameButton.hide();
		$startGameButton.click(onStartGameClick);
		$endGameButton.hide();
		$endGameButton.click(onEndGameClick);
	}

	function initSocket() {
		socket = io.connect('/');
		socket.on('connect', function(){
		});
		socket.on('playerCount', function(playerCount){
			$('#playerCount').html(playerCount);
		});
		socket.on('ledStates', function(data){
			$('#ledCounter').html(data.counter);
		});
		socket.on('ip', function(ip){
			$('.ip-address').html(ip);
		});
		socket.on('admin', function(){
		});
		socket.on('gameState', onGameStateChanged);
	}

	function initCamera() {
		if (hasGetUserMedia()) {
			navigator.webkitGetUserMedia({"video": { "mandatory": { "minWidth": "1280", "minHeight": "720" } }}, function(localMediaStream){
				$('#cameraVideo').attr('src', window.URL.createObjectURL(localMediaStream));
			}, function(error){
			});
		}
	}

	function hasGetUserMedia() {
	  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
	            navigator.mozGetUserMedia || navigator.msGetUserMedia);
	}

	function onStartGameClick() {
		socket.emit('gameState', GAME_STATES.STARTED);
	}

	function onEndGameClick() {
		socket.emit('gameState', GAME_STATES.FINISHED);
	}

	function onGameStateChanged(gameState) {
		$startGameButton.toggle(gameState == GAME_STATES.WAITING || gameState == GAME_STATES.FINISHED);
		$endGameButton.toggle(gameState == GAME_STATES.STARTED);
		if(gameState == GAME_STATES.STARTED) {
			$('#knightRiderTheme')[0].play();
		} else {
			$('#knightRiderTheme')[0].pause();
			$('#knightRiderTheme')[0].currentTime = 0;
		}
	}

	init();

})();