var KEYS = ['c', 'd', 'e', 'f'];
var NOTE_DURATION = 1000;
const WAIT_TIME = 2500;

// NoteBox
//
// Acts as an interface to the coloured note boxes on the page, exposing methods
// for playing audio, handling clicks,and enabling/disabling the note box.
function NoteBox(key, onClick) {
	// Create references to box element and audio element.
	var boxEl = document.getElementById(key);
	var audioEl = document.getElementById(key + '-audio');
	if (!boxEl) throw new Error('No NoteBox element with id' + key);
	if (!audioEl) throw new Error('No audio element with id' + key + '-audio');

	// When enabled, will call this.play() and this.onClick() when clicked.
	// Otherwise, clicking has no effect.
	var enabled = true;
	// Counter of how many play calls have been made without completing.
	// Ensures that consequent plays won't prematurely remove the active class.
	var playing = 0;

	this.key = key;
	this.onClick = onClick || function () {};

	// Plays the audio associated with this NoteBox
	this.play = function () {
		playing++;
		// Always play from the beginning of the file.
		audioEl.currentTime = 0;
		audioEl.play();

		// Set active class for NOTE_DURATION time
		boxEl.classList.add('active');
		setTimeout(function () {
			playing--
			if (!playing) {
				boxEl.classList.remove('active');
			}
		}, NOTE_DURATION)
	}

	// Enable this NoteBox
	this.enable = function () {
		enabled = true;
	}

	// Disable this NoteBox
	this.disable = function () {
		enabled = false;
	}

	// Call this NoteBox's clickHandler and play the note.
	this.clickHandler = function () {
		if (!enabled) return;

		this.onClick(this.key)
		this.play()
	}.bind(this)

	boxEl.addEventListener('mousedown', this.clickHandler);
}

// Example usage of NoteBox.
//
// This will create a map from key strings (i.e. 'c') to NoteBox objects so that
// clicking the corresponding boxes on the page will play the NoteBox's audio.
// It will also demonstrate programmatically playing notes by calling play directly.
var notes = {};

KEYS.forEach(function (key) {
	notes[key] = new NoteBox(key);
});

/**
 * A waiter that can be reset without generating multiple callbacks
 */
function Waiter(callback, waitTime) {
	var timer = null;

	this.reset = function() {
		if(timer != null) {
			clearTimeout(timer);
			timer = null;
		}
		timer = setTimeout(doneTimer, waitTime);
	}

	this.start = function() {
		this.reset();
	}

	function doneTimer() {
		timer = null;
		callback();
	}
}

/**
 * Plays all of the buttons in the sequence with a interval of 
 * NOTE_DURATION
 */
function SeqPlayer(aBtnSequence, onPlayDone) {
	this.play = function() {
		function activate(idx) {
			if(idx < aBtnSequence.length) {
				aBtnSequence[idx].play();
				setTimeout(activate.bind(null, idx + 1), NOTE_DURATION);
			} else {
				if(onPlayDone) onPlayDone();
			}
		}
		activate(0);
	}
}

/**
 * Records note boxes clicks into an array and can play sequences using the
 * SeqPlayer
 */
function SeqRecorder(oWatier) {
	var pressedButtons = [];
	var buttonDictionary = KEYS.map( (key) => new NoteBox(key, onNoteBoxClick)).reduce((acc, b) => {
		b.disable();
		acc[b.key] = b;
		return acc;
	}, {});

	this.playSequence = function(onPlayDone){
		disableButtons();
		new SeqPlayer(pressedButtons, onPlayDone).play();
	}

	this.clearSequence = function() {
		pressedButtons = [];
	}

	this.append = appendFn

	this.startRecording = function() {
		this.clearSequence();
		enableButtons();
	}

	this.stopRecording = function() {
		disableButtons();
	}

	this.getSequence = function() {
		return pressedButtons;
	}

	function enableButtons() {
		Object.values(buttonDictionary).forEach(b => b.enable());
	}

	function disableButtons() {
		Object.values(buttonDictionary).forEach(b => b.disable());
	}

	function onNoteBoxClick(key) {
		oWatier.reset();
		appendFn(key);
	}

	function appendFn(key) {
		pressedButtons.push(buttonDictionary[key])
	}
}

/**
 * Main impl of simon, start the game by calling start. The oNotes object is
 * the one defined above
 */ 
function Simon(oNotes) {
	var currentSequenece = []

	this.start = function() {
		startInstance();
	}
	
	function onSuccess() {
		startInstance();
	}

	function onFailure() {
		clearSequence();
		startInstance();
	}

	function startInstance() {
		appendToSequence();
		var fnValidation = function(selectedNotes) {
			if (selectedNotes.length != currentSequenece.length) return onFailure();
			var i = 0;
			while (i < selectedNotes.length) {
				if (selectedNotes[i].key != currentSequenece[i].key) return onFailure();
				i++;
			}
			onSuccess();
		}
		let simonInstance = new SimonInstance(oNotes, currentSequenece, fnValidation)
		simonInstance.start();

	}

	function appendToSequence() {
		let aNotes = Object.values(oNotes);
		let idx = Math.floor(Math.random() * (aNotes.length - 1));
		currentSequenece.push(aNotes[idx]);
	}

	function clearSequence() {
		currentSequenece = [];
	}

}

/**
 * A instance of Simon for a specific sequence of buttons, when the timer
 * finishes, onTimout is called
 */
function SimonInstance(oNotes, aSequence, onTimout) {
	let timer = new Waiter(onTimerDone, WAIT_TIME);
	let userSeq = new SeqRecorder(timer);
	let simonSeq = new SeqPlayer(aSequence, onStartDone);

	this.start = function() {
		userSeq.stopRecording();
		simonSeq.play();
	}

	this.playUserInput = function() {
		var fnCallback = function() {
			userSeq.startRecording();
		}
		userSeq.playSequence(fnCallback);
	}

	function onStartDone() {
		userSeq.startRecording();
	}

	function onTimerDone() {
		userSeq.stopRecording();
		onTimout(userSeq.getSequence());
	}
}

/**
 * Easy task, its just one simon instance that calls playUserInput
 * every time timeout is reached
 */
function Repeater() {
	let sInstance = new SimonInstance(notes, [], onTimeout)
	this.start = function() {
		init();
	}

	function init() {
		sInstance.start();
	}

	function onTimeout() {
		sInstance.playUserInput();
		init();
	}
}

new Simon(notes).start();
//new Repeater().start();