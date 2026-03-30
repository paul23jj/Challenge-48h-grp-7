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
const sonVictoire = new Audio('LIEN_SON_VICTOIRE.mp3'); 
const sonEchec = new Audio('LIEN_SON_ECHEC.mp3');
const sonGameOver = new Audio('LIEN_SON_GAME_OVER.mp3'); 

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

    if (essais >= 3) {
        sonGameOver.play(); // Déclenche le son de Game Over
        texteStatut.textContent = '💀 DESTRUCTION IMMINENTE - GAME OVER';
        
        // NOUVEAUTÉ : On affiche le bouton même en cas de défaite totale
        afficherBoutonSuivant(); 
        
        // On s'arrête ici avec "return", le jeu est définitivement bloqué.
        return; 
    }

    sonEchec.play(); // Déclenche le son d'échec simple
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
function afficherBoutonSuivant() {
    // Si le bouton existe déjà (pour éviter d'en créer plusieurs), on ne fait rien
    if (document.getElementById('btnSuivant')) return;

    // Création du bouton
    const btn = document.createElement('button');
    btn.id = 'btnSuivant';
    btn.textContent = 'JEU SUIVANT ➔';
    btn.className = 'boutonSuivant'; // On lui donne une classe pour le styliser en CSS
    
    // L'action à effectuer quand on clique dessus
    btn.onclick = () => {
        // Pour l'instant on recharge la page, on pourra changer ça pour aller vers une autre page web.
        window.location.reload(); 
    };

    // On l'ajoute dans la zone d'informations en bas du panneau
    document.querySelector('.zoneInfos').appendChild(btn);
}