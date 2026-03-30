const TEMPS_VISIBLE = [5, 6, 7];
const CIBLE = 10;
const TOLERANCE = 0.5;

const slots = document.querySelectorAll('.slot');
// Constantes à modifier pour sacha
const MOT_CODE = 'ch@ll3nge';
const cheminNiveauSuivant = ''

const bouton = document.querySelector('#grosBouton');
const timerDisplay= document.querySelector('#affichageTimer');
const texteStatut= document.querySelector('#texteStatut');
const nombreEssais= document.querySelector('#nombreEssais');

const sonVictoire = new Audio('sons/SonReussite.mp3'); 
const sonEchec1   = new Audio('sons/SonEchec1.mp3'); 
const sonEchec2   = new Audio('sons/SonEchec2.mp3'); 
const sonEchec3   = new Audio('sons/SonEchec3.mp3');

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
    texteStatut.textContent = 'Mémorise bien le rythme';
    timerDisplay.style.visibility = 'visible';

    timerId = setInterval(updateTimer, 10);

    const dureeVisible = TEMPS_VISIBLE[essais] * 1000;
    setTimeout( () => {
        timerDisplay.style.visibility = 'hidden';
        texteStatut.textContent = 'Appuie à 10.00s ! ';
    }, dureeVisible);
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

function victoire(temps)  {
    sonVictoire.play();
    texteStatut.textContent = `${temps.toFixed(2)}s — CODE : ${MOT_CODE} !`;
    bouton.disabled = true;
    
    afficherBoutonSuivant();
}

function echec(temps) {
    bouton.disabled = true;
    essais++;
    nombreEssais.textContent = `${essais} / 3`;
    
    document.getElementById('err' + essais).checked = true;

    if (essais === 1) {
        sonEchec1.play();
    } else if (essais === 2) {
        sonEchec2.play();
    } else if (essais >= 3) {
        sonEchec3.play();
        
        texteStatut.textContent = '💀 DESTRUCTION IMMINENTE - GAME OVER';
        afficherBoutonSuivant(); 
        return; 
    }

    texteStatut.textContent = `${temps.toFixed(2)}s — RATÉ !`;
    
    setTimeout(reset, 1500);
}

function reset() {
    clearInterval(timerId);
    running = false;
    startTime = null;

    timerDisplay.textContent = '0.00';
    timerDisplay.style.visibility = 'visible';
    texteStatut.textContent = 'NE PAS PRESSER';
    
    bouton.disabled = false;
}

function afficherBoutonSuivant() {
    if (document.getElementById('btnSuivant')) return;

    const btn = document.createElement('button');
    btn.id = 'btnSuivant';
    
    if (essais >= 3) {
        btn.textContent = 'RECOMMENCER ➔';
    } else {
        btn.textContent = 'JEU SUIVANT ➔';
    }
    
    btn.className = 'boutonSuivant'; 
    
    // LIEN A MODIFIER POUR PASSER AU NIVEAU D'APRES
   btn.onclick = () => {
        window.location.href = cheminNiveauSuivant; 
    };

    document.querySelector('.zoneInfos').appendChild(btn);
}