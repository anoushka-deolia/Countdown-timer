const timeInput = document.getElementById('timeInput');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resetButton = document.getElementById('resetButton');
const timerDisplay = document.getElementById('timeDisplay');
const finishMessage = document.getElementById('finishMessage');

let totalSeconds = 0;
let remaining = 0;
let intervalId = null;
let running = false;

let _audioContext = null;
function getAudioContext() {
  if (!_audioContext) {
    _audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioContext;
}

function formatTime(sec){
    sec = Math.max(0, Math.floor(sec));
    let m = Math.floor(sec / 60);
    let s = sec % 60;
    return String(m).padStart(2, '0') + ":" + String(s).padStart(2, '0');
}

function parseInput(value) {
  value = String(value || "").trim();
  if (!value) return NaN;
  if (value.includes(':')) {
    const parts = value.split(':').map(v => parseInt(v || 0, 10));
    const mm = Number.isFinite(parts[0]) ? parts[0] : 0;
    const ss = Number.isFinite(parts[1]) ? parts[1] : 0;
    return Math.max(0, mm * 60 + ss);
  }
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : NaN;
}

function updateDisplay() {
  timerDisplay.textContent = formatTime(remaining);
}

function startTimer(seconds) {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  finishMessage.style.display = "none";

  totalSeconds = Math.max(0, Math.floor(seconds));
  remaining = totalSeconds;

  if (totalSeconds === 0) {
    timerDisplay.textContent = "00:00";
    return;
  }

  startButton.disabled = true;
  pauseButton.disabled = false;
  resetButton.disabled = false;

  running = true;
  updateDisplay();

  getAudioContext().resume().catch(()=>{});

  intervalId = setInterval(() => {
    remaining = remaining - 1;

    if (remaining <= 0) {
      remaining = 0;
      updateDisplay();
      clearInterval(intervalId);
      intervalId = null;
      finishTimer();
    } else {
      updateDisplay();
    }
  }, 1000);
}

function pauseTimer() {
  if (!running) return;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  running = false;
  startButton.disabled = false;
  pauseButton.disabled = true;
}

function resetTimer() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  running = false;
  totalSeconds = 0;
  remaining = 0;

  timerDisplay.textContent = "00:00";

  finishMessage.style.display = "none";

  startButton.disabled = false;
  pauseButton.disabled = true;
  resetButton.disabled = true;
}

function finishTimer(){
    running = false;

    timerDisplay.textContent = "Time's up!";
    finishMessage.style.display = "block";

    startButton.disabled = false;
    pauseButton.disabled = true;
    resetButton.disabled = false;

    playBeep();

    if (typeof Notification !== 'undefined') {
        if (Notification.permission === "granted") {
            new Notification("⏰ Timer Finished!", { 
                body: "Your countdown has ended."
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("⏰ Timer Finished!", { 
                        body: "Your countdown has ended."
                    });
                }
            });
        }
    }

    setTimeout(() => {
      timerDisplay.textContent = "00:00";
    }, 1200);
}

function playBeep(){
    const context = getAudioContext();
    if (context.state === 'suspended') {
      context.resume().catch(()=>{});
    }

    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = 'sine';
    osc.frequency.value = 900;

    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.6, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(context.destination);

    osc.start(context.currentTime);
    osc.stop(context.currentTime + 0.27);
}

startButton.addEventListener('click', function() {
  const raw = timeInput.value;
  const secs = parseInput(raw);

  if (isNaN(secs) || secs <= 0) {
    alert("Please enter a valid time in seconds or mm:ss.");
    return;
  }

  startTimer(secs);
});

pauseButton.addEventListener('click', function() {
  pauseTimer();
});

resetButton.addEventListener('click', function() {
  resetTimer();
});

timeInput.addEventListener('keyup', function(e) {
  if (e.key === 'Enter') {
    startButton.click();
  }
});

(function init() {
  timerDisplay.textContent = "00:00";
  finishMessage.style.display = "none";
  startButton.disabled = false;
  pauseButton.disabled = true;
  resetButton.disabled = true;
})();
