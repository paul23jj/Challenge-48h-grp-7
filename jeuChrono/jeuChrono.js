let timerId;
let startTime;
let running = false;

const startButton = document.querySelector('');
const timerDisplay = document.querySelector('');

startButton.addEventListener('click', startGame);

function updateTimer() {
    const elapsed = Date.now() - startTime;
    const seconds = elapsed / 1000;
    timerDisplay.textContent = seconds.toFixed(2);
}

function startGame() {
    if (running) {
        return;
    }
    running = true;
    startTime = Date.now();
    timerId = setInterval(updateTimer, 10);
}