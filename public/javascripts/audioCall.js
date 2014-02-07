'use strict';
var isInitiator;
var localStream;
var pc;
var remoteStream;
var turnReady;

var localAudio = null;
var remoteAudio = null;

var remoteDescription;
var candidate;

var pc_config = {'iceServers': [{'url': 'stun:stun.1.google.com:19302'}]};
var pc_constraints = {'optional': [{'DtlsSrtpKeyAgreement': true}]};

var sdpConstraints = {'mandatory': {
	'OfferToReceiveAudio': true,
	'OfferToReceiveVideo': false
}};

var room = null;
var socket = io.connect();
/////////////////////

socket.on('created', function (room) {
	console.log('Created room ' + room);
	document.getElementById("callButton").disabled = true;
	setupMedia();
});

socket.on('joined', function(room) {
	console.log('This peer has joined room ' + room);
	console.log("joined disabled");
	document.getElementById("callButton").disabled = false;
	setupMedia();
});

socket.on('join', function (room) {
	console.log('Another peer made a request to join room ' + room);
	console.log('This peer is the initiator of room ' + room + '!');
	console.log("join disabled");
	document.getElementById("callButton").disabled = false;
});


socket.on('full', function(room) {
	console.log('Room ' + room + ' is full');
});

socket.on('log', function(array) {
	console.log.apply(console, array);
});

socket.on('message', function(message) {
	//console.log('Client received message: ', message);

	if (message.type === 'offer') {
		//remoteDescription = new RTCSessionDescription(message);
		pc.setRemoteDescription(new RTCSessionDescription(message));
		//pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
	}
	else if (message.type === 'answer') {
		pc.setRemoteDescription(new RTCSessionDescription(message));
	}
	else if (message.type === 'candidate') {
		candidate = new RTCIceCandidate({
      		sdpMLineIndex: message.label,
      		candidate: message.candidate
    	});
		pc.addIceCandidate(candidate);		
	}
	else if (message === 'bye') {
		handleRemoteHangup();
	}

	else if (message === 'incoming_call') {
		console.log('incoming_call');
		// if (!pc) {
		// 	setupMedia();
		// }
		document.getElementById("callButton").disabled = true;
		if (isInitiator) {
			document.getElementById("pickButton").disabled = true;
		}
		else {
			console.log("initiator");
			document.getElementById("pickButton").disabled = false;
		}
		document.getElementById("hangupButton").disabled = false;
	}
	else if (message === 'ended_call') {
		document.getElementById("hangupButton").disabled = true;
		document.getElementById("pickButton").disabled = true;
		console.log("ended_call disabled");
		document.getElementById("callButton").disabled = false;
	}
});


$(function() {
	$('#room').addClass('hide');
	document.getElementById("pickButton").disabled = true;
	document.getElementById("hangupButton").disabled = true;
	document.getElementById("callButton").disabled = true;
	
	$('#connectButton').click(function() {
		room = $('#connectId').val();

		if (room != null && room != '') {
			console.log("Create or join room", room);
			socket.emit('create or join', room);
			
		}
	});


	$('#exitButton').click(function() {
		hangup();
		$('#room').addClass('hide');
		$('#index').removeClass('hide');
	});

	$('#callButton').click(function() {
		isInitiator = true;
		document.getElementById("callButton").disabled = true;
		document.getElementById("hangupButton").disabled = false;
		sendMessage('incoming_call');
		doCall();
	});

	$('#pickButton').click(function() {
		doAnswer();
		document.getElementById("pickButton").disabled = true;
	});

	$('#hangupButton').click(function() {
		hangup();
	});
});


//////////////////////////////////////////////
function sendMessage(message) {
	console.log('Client sending message: ', message);
	socket.emit('message', message);
}

function setupMedia() {
	$('#index').addClass('hide');
	$('#room').removeClass('hide');
	localAudio = document.querySelector('#local-audio');
	remoteAudio = document.querySelector('#remote-audio');

	var constraints = {video: false, audio: true};

	getUserMedia(constraints, handleUserMedia, handleUserMediaError);
	console.log('Getting user media with constraints', constraints);
}

function handleUserMedia(stream) {
	console.log('Adding local stream');
	//localAudio.src = window.URL.createObjectURL(stream);
	localStream = stream;
	createPeerConnection();
	alert('Successful!');
	//localAudio.play();
}

function handleUserMediaError(error) {
	console.log('getuserMedia error: ', error);
}

//////////////////////


function createPeerConnection() {
	try {
		pc = new RTCPeerConnection(null);
		pc.onicecandidate = handleIceCandidate;
		pc.onaddstream = handleRemoteStreamAdded;
		pc.onremovestream = handleRemoteStreamRemoved;
		pc.addStream(localStream);
		console.log('Created RTCPeerConnection');
	}
	catch (e) {
		console.log('Failed to create PeerConnection, exception: ' + e.message);
		alert('Cannot create RTCPeerConnection object');
		return;
	}
}

function handleIceCandidate(event) {
  //console.log('handleIceCandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate});
  } else {
    console.log('End of candidates.');
  }
}

function handleRemoteStreamAdded(event) {
	console.log('Remote stream added');
	remoteAudio.src = window.URL.createObjectURL(event.stream);
	remoteStream = event.stream;
	remoteAudio.play();
}


function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

//////////////////////////////

function handleCreateOfferError(event) {
	console.log('createOffer() error: ', e);
}

function doCall() {
	console.log('Sending offer to peer');
	pc.createOffer(setLocalAndSendMessage, null, sdpConstraints);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  //pc.setRemoteDescription(remoteDescription);
  
  pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
}

function setLocalAndSendMessage(sessionDescription) {
	pc.setLocalDescription(sessionDescription);
	console.log('setLocalDescription sending message', sessionDescription);
	sendMessage(sessionDescription);
}


///////////////////////////////////////////


// if(location.hostname != 'localhost') {
//   requestTurn('https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913');
// }



window.onbeforeunload = function(e) {
	sendMessage('ended_call');
	sendMessage('bye');
	pc.null;
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
	console.log('Session terminated.');
  	stop();
}

function stop() {
	isInitiator = false;
	if (pc) {
		pc.remoteStream;
		pc.close();
  		pc = null;
	}
  sendMessage('ended_call');

}
