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
		socket.on('ledStates', function(leds){
			var html = "";
			for(var i = 0; i < leds.length; i++) {
				html += '<div class="led ';
				html += (leds[i].state) ? 'on' : 'off';
				html += '"/>';
			}
			$('#leds').html(html);
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
			navigator.webkitGetUserMedia({video: true, audio: true}, function(localMediaStream){
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
		console.log('start game click');
		socket.emit('gameState', GAME_STATES.STARTED);
	}

	function onEndGameClick() {
		socket.emit('gameState', GAME_STATES.FINISHED);
	}

	function onGameStateChanged(gameState) {
		$startGameButton.toggle(gameState == GAME_STATES.WAITING || gameState == GAME_STATES.FINISHED);
		$endGameButton.toggle(gameState == GAME_STATES.STARTED);
	}

	init();

})();