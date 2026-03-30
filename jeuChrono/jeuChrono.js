const TEMPS_VISIBLE = [5, 7, 9];
const CIBLE = 10;
const TOLERANCE = 0.5;

const slots = document.querySelectorAll('.slot');
const MOT_CODE = 'MOT-SECRET';

const bouton = document.querySelector('#grosBouton');
const timerDisplay= document.querySelector('#affichageTimer');
const texteStatut= document.querySelector('#texteStatut');
const nombreEssais= document.querySelector('#nombreEssais');

// --- CHARGEMENT DES SONS ---
// Remplace les textes entre guillemets par les vrais liens (URL locale ou web) de tes fichiers audio (.mp3 ou .wav)
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
    sonVictoire.play(); // Déclenche le son de victoire
    texteStatut.textContent = `${temps.toFixed(2)}s — CODE : ${MOT_CODE} !`;
    bouton.disabled = true;
    
    // On appelle la fonction pour créer le bouton de suite au lieu de relancer le jeu
    afficherBoutonSuivant();
}

function echec(temps) {
    bouton.disabled = true;
    essais++;
    nombreEssais.textContent = `${essais} / 3`;
    
    // Coche la case d'erreur pour déclencher les flammes CSS
    document.getElementById('err' + essais).checked = true;

    // --- CORRECTION : On utilise les bons sons selon l'essai ---
    if (essais === 1) {
        sonEchec1.play();
    } else if (essais === 2) {
        sonEchec2.play();
    } else if (essais >= 3) {
        sonEchec3.play(); // Déclenche le son de Game Over (le pompe)
        
        texteStatut.textContent = '💀 DESTRUCTION IMMINENTE - GAME OVER';
        afficherBoutonSuivant(); 
        return; 
    }

    texteStatut.textContent = `${temps.toFixed(2)}s — RATÉ !`;
    
    // On redonne une chance après 1.5 secondes
    setTimeout(reset, 1500);
}

function reset() {
    clearInterval(timerId);
    running = false;
    startTime = null;

    timerDisplay.textContent = '0.00';
    timerDisplay.style.visibility = 'visible';
    texteStatut.textContent = 'NE PAS PRESSER';
    
    // CORRECTION : Il faut décocher manuellement les cases pour enlever les flammes si le joueur n'a pas encore perdu !
    // Si on est à l'essai 1 ou 2, on ne veut pas enlever la flamme de l'essai précédent. 
    // La logique CSS gère déjà l'accumulation, on n'a rien à faire de plus ici.

    bouton.disabled = false;
}

// Fonction pour fabriquer et afficher le bouton "Jeu Suivant"
// Fonction pour fabriquer et afficher le bouton "Jeu Suivant"
function afficherBoutonSuivant() {
    if (document.getElementById('btnSuivant')) return;

    const btn = document.createElement('button');
    btn.id = 'btnSuivant';
    
    // CORRECTION : Change le texte selon si on a gagné ou perdu
    if (essais >= 3) {
        btn.textContent = 'RECOMMENCER ➔';
    } else {
        btn.textContent = 'JEU SUIVANT ➔';
    }
    
    btn.className = 'boutonSuivant'; 
    
    btn.onclick = () => {
        window.location.reload(); 
    };

    document.querySelector('.zoneInfos').appendChild(btn);
}