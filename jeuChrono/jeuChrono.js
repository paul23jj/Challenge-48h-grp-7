const TEMPS_VISIBLE = 5;
const CIBLE = 10;
const TOLERANCE = 0.5;

const slots = document.querySelectorAll('.slot');
const MOT_CODE = 'MOT-SECRET';

const bouton = document.querySelector('#grosBouton');
const timerDisplay= document.querySelector('#affichageTimer');
const texteStatut= document.querySelector('#texteStatut');
const nombreEssais= document.querySelector('#nombreEssais');
const flammes= document.querySelectorAll('.flammes-zone');

let timerId= null;
let startTime= null;
let running= false;
let essais= 0;

bouton.addEventListener('click', handleClick);

function handleClick() {
    if (!running) {
        startChrono();
    } else  {
        stopChrono();
    }
}

function startChrono() {
    running = true;
    startTime = Date.now();
    texteStatut.textContent = 'Mémorise bien';
    timerDisplay.style.visibility = 'visible';

    timerId = setInterval(updateTimer, 10);

    setTimeout( () => {
        timerDisplay.style.visibility = 'hidden';
        texteStatut.textContent = 'Appuie à 10.00s ! ';
    }, TEMPS_VISIBLE * 1000);
}

function updateTimer() {
    const elapsed = (Date.now() - startTime) / 1000;
    timerDisplay.textContent = elapsed.toFixed(2);

    if (elapsed > 20) {
        clearInterval(timerId);
        running = false;
        echec(elapsed);
    }
}

function stopChrono() {
    clearInterval(timerId);
    running = false;

    const elapsed = (Date.now() - startTime) / 1000;
    const ecart   = Math.abs(elapsed - CIBLE);

    timerDisplay.textContent          = elapsed.toFixed(2);
    timerDisplay.style.visibility     = 'visible';

    if (ecart <= TOLERANCE) {
        victoire(elapsed);
    } else {
        echec(elapsed);
    }
}

function victoire (temps)  {
    texteStatut.textContent = `${temps.toFixed(2)}s — PARFAIT !`;
    bouton.disabled = true;
    setTimeout(reset, 3000);
}

function echec(temps) {
    texteStatut.textContent = `${temps.toFixed(2)}s — RATÉ !`;
    flammes.forEach(f => f.classList.add('active'));
    bouton.disabled = true;

    essais++;
    nombreEssais.textContent = `${essais} / 3`;
    slots[essais - 1].textContent = '❌';

    if (essais >= 3) {
        texteStatut.textContent = '💀 GAME OVER';
        return;
    }

    setTimeout(reset, 3000);
}

function reset () {
    clearInterval(timerId);
    running = false;
    startTime = null;

    timerDisplay.textContent = '0.00';
    timerDisplay.style.visibility = 'visible';
    texteStatut.textContent = 'NE PAS PRESSER';
    flammes.forEach(f => f.classList.remove('active'));
    slots.forEach(s => s.textContent = '');
    bouton.disabled = false;
}