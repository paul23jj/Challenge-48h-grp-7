/**
 * utils.js — Fonctions utilitaires partagées pour le site ARG
 * Importé par tous les mini-jeux via <script src="../../shared/utils.js">
 * Expose un objet global `ARG` avec toutes les méthodes communes.
 */

/* ============================================================================
   NAMESPACE GLOBAL
   Toutes les fonctions sont encapsulées dans l'objet ARG pour éviter les
   conflits avec d'autres scripts.
   ============================================================================ */
window.ARG = (function () {

  /* ===== CONSTANTES ========================================================= */

  /** Clé racine utilisée dans le localStorage */
  const STORAGE_KEY = 'arg_game_state';

  /** Liste des identifiants de jeux disponibles (ordre de la chaîne de déblocage) */
  const GAME_IDS = ['game2', 'game3', 'game4', 'arg'];

  /* ===== GESTION DU LOCALSTORAGE =========================================== */

  /**
   * Charge l'état global depuis le localStorage.
   * Si aucune donnée n'existe, retourne un état initial vide.
   * @returns {Object} État global du jeu
   */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return _createInitialState();
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[ARG] Erreur de lecture localStorage :', e);
      return _createInitialState();
    }
  }

  /**
   * Sauvegarde l'état global dans le localStorage.
   * @param {Object} state - L'état à sauvegarder
   */
  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[ARG] Erreur d\'écriture localStorage :', e);
    }
  }

  /**
   * Retourne un objet d'état initial, vierge de toute progression.
   * @returns {Object}
   * @private
   */
  function _createInitialState() {
    return {
      version: 1,
      games: {
        game2: { status: 'available', score: 0, completedAt: null, word: null },
        game3: { status: 'locked',    score: 0, completedAt: null, word: null },
        game4: { status: 'locked',    score: 0, completedAt: null, word: null },
        arg:   { status: 'locked',    score: 0, completedAt: null, hintsUsed: 0, startedAt: null, word: null },
      },
      totalScore: 0,
      phraseComplete: false,
    };
  }

  /**
   * Récupère l'état d'un jeu spécifique.
   * @param {string} gameId - Identifiant du jeu (ex: 'arg')
   * @returns {Object|null}
   */
  function getGameState(gameId) {
    const state = loadState();
    return state.games[gameId] ?? null;
  }

  /**
   * Met à jour l'état d'un jeu spécifique et sauvegarde.
   * @param {string} gameId - Identifiant du jeu
   * @param {Object} partial - Propriétés à fusionner dans l'état du jeu
   */
  function updateGameState(gameId, partial) {
    const state = loadState();
    if (!state.games[gameId]) {
      console.warn(`[ARG] Jeu inconnu : ${gameId}`);
      return;
    }
    state.games[gameId] = { ...state.games[gameId], ...partial };
    // Recalcul du score total
    state.totalScore = Object.values(state.games)
      .reduce((sum, g) => sum + (g.score || 0), 0);
    saveState(state);
  }

  /**
   * Marque un jeu comme complété, enregistre le score et le mot révélé,
   * déverrouille le jeu suivant et détecte si la phrase est complète.
   * @param {string} gameId
   * @param {number} score
   * @param {string} [word]  - Mot à révéler (ex: 'LE')
   */
  function markGameCompleted(gameId, score, word) {
    const UNLOCK_CHAIN = { game2: 'game3', game3: 'game4', game4: 'arg' };
    const state = loadState();
    if (!state.games[gameId]) return;

    state.games[gameId].status      = 'completed';
    state.games[gameId].score       = score;
    state.games[gameId].completedAt = Date.now();
    if (word) state.games[gameId].word = word;

    // Déverrouiller le jeu suivant
    const nextId = UNLOCK_CHAIN[gameId];
    if (nextId && state.games[nextId] && state.games[nextId].status === 'locked') {
      state.games[nextId].status = 'available';
    }

    // Phrase complète si les 4 jeux sont terminés
    state.phraseComplete = GAME_IDS.every(id => state.games[id].status === 'completed');

    state.totalScore = Object.values(state.games)
      .reduce((sum, g) => sum + (g.score || 0), 0);

    saveState(state);
  }

  /**
   * Réinitialise complètement la progression (utile pour les tests).
   */
  function resetAllProgress() {
    saveState(_createInitialState());
    console.info('[ARG] Progression réinitialisée.');
  }

  /* ===== TIMER ============================================================== */

  /**
   * Crée et gère un chronomètre.
   * @param {Function} onTick - Appelé chaque seconde avec le nombre de secondes écoulées
   * @param {Function} [onStop] - Appelé à l'arrêt avec le temps final
   * @returns {{ start, stop, getElapsed, reset }}
   */
  function createTimer(onTick, onStop) {
    let startTime  = null;
    let elapsed    = 0;         // secondes
    let intervalId = null;
    let running    = false;

    function start() {
      if (running) return;
      running   = true;
      startTime = Date.now() - elapsed * 1000;
      intervalId = setInterval(() => {
        elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (typeof onTick === 'function') onTick(elapsed);
      }, 1000);
    }

    function stop() {
      if (!running) return elapsed;
      running = false;
      clearInterval(intervalId);
      intervalId = null;
      if (typeof onStop === 'function') onStop(elapsed);
      return elapsed;
    }

    function reset() {
      stop();
      elapsed   = 0;
      startTime = null;
    }

    function getElapsed() { return elapsed; }

    return { start, stop, getElapsed, reset };
  }

  /**
   * Formate un nombre de secondes en chaîne MM:SS.
   * @param {number} seconds
   * @returns {string} Ex: "02:45"
   */
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /* ===== CALCUL DE SCORE ==================================================== */

  /**
   * Calcule un score final selon le temps et les indices utilisés.
   * Formule : score = max(0, baseScore - tempsEnSecondes * penaliteTemps - indices * penaliteIndice)
   *
   * @param {number} elapsedSeconds - Temps écoulé en secondes
   * @param {number} hintsUsed      - Nombre d'indices demandés
   * @param {number} [baseScore=1000]      - Score de départ
   * @param {number} [timePenalty=0.5]     - Points perdus par seconde
   * @param {number} [hintPenalty=100]     - Points perdus par indice
   * @returns {number} Score final (entier positif)
   */
  function calculateScore(elapsedSeconds, hintsUsed, baseScore = 1000, timePenalty = 0.5, hintPenalty = 100) {
    const raw = baseScore - (elapsedSeconds * timePenalty) - (hintsUsed * hintPenalty);
    return Math.max(0, Math.round(raw));
  }

  /* ===== ENCODAGE / DÉCODAGE =============================================== */

  /**
   * Encode une chaîne en ROT13.
   * ROT13 est son propre inverse : encoder et décoder utilisent la même fonction.
   * @param {string} str
   * @returns {string}
   */
  function rot13(str) {
    return str.replace(/[a-zA-Z]/g, (c) => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
  }

  /**
   * Encode un texte en code Morse.
   * @param {string} str - Texte en majuscules recommandé
   * @returns {string} Morse avec '/' pour les espaces entre mots
   */
  function textToMorse(str) {
    const TABLE = {
      A:'.-',   B:'-...', C:'-.-.', D:'-..', E:'.',   F:'..-.',
      G:'--.',  H:'....', I:'..',   J:'.---',K:'-.-', L:'.-..',
      M:'--',   N:'-.',   O:'---',  P:'.--.', Q:'--.-',R:'.-.',
      S:'...',  T:'-',    U:'..-',  V:'...-',W:'.--', X:'-..-',
      Y:'-.--', Z:'--..',
      '0':'-----','1':'.----','2':'..---','3':'...--',
      '4':'....-','5':'.....','6':'-....','7':'--...',
      '8':'---..','9':'----.',
      '.':'.-.-.-',',':'--..--','?':'..--..','!':'-.-.--',' ':'/'
    };
    return str.toUpperCase().split('').map(c => TABLE[c] || '?').join(' ');
  }

  /**
   * Décode du code Morse vers du texte.
   * @param {string} morse - Morse avec espaces entre lettres, '/' entre mots
   * @returns {string}
   */
  function morseToText(morse) {
    const TABLE = {
      '.-':'A',   '-...':'B', '-.-.':'C', '-..':'D',  '.':'E',    '..-.':'F',
      '--.':'G',  '....':'H', '..':'I',   '.---':'J', '-.-':'K',  '.-..':'L',
      '--':'M',   '-.':'N',   '---':'O',  '.--.':'P', '--.-':'Q', '.-.':'R',
      '...':'S',  '-':'T',    '..-':'U',  '...-':'V', '.--':'W',  '-..-':'X',
      '-.--':'Y', '--..':'Z',
      '-----':'0','.----':'1','..---':'2','...--':'3','....-':'4',
      '.....':'5','-....':'6','--...':'7','---..':'8','----.':'9',
      '/':' '
    };
    return morse.trim().split(' ').map(tok => TABLE[tok] || '?').join('');
  }

  /**
   * Décode un texte chiffré par le chiffre de Vigenère.
   * Les espaces et caractères non-alphabétiques sont conservés tels quels.
   * La clé ne progresse que sur les caractères alphabétiques.
   * @param {string} ciphertext - Texte chiffré (majuscules ou minuscules)
   * @param {string} key        - Clé de déchiffrement (lettres uniquement)
   * @returns {string} Texte déchiffré en majuscules
   */
  function vigenereDecrypt(ciphertext, key) {
    const k = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!k.length) return '[ CLÉ VIDE — Entre une clé de déchiffrement ]';
    let ki = 0;
    return ciphertext.toUpperCase().split('').map(c => {
      if (c < 'A' || c > 'Z') return c;
      const shift = k.charCodeAt(ki % k.length) - 65;
      ki++;
      return String.fromCharCode(((c.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
    }).join('');
  }

  /**
   * Chiffre un texte avec le chiffre de Vigenère.
   * @param {string} plaintext - Texte clair
   * @param {string} key       - Clé de chiffrement
   * @returns {string} Texte chiffré en majuscules
   */
  function vigenereEncrypt(plaintext, key) {
    const k = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!k.length) return plaintext.toUpperCase();
    let ki = 0;
    return plaintext.toUpperCase().split('').map(c => {
      if (c < 'A' || c > 'Z') return c;
      const shift = k.charCodeAt(ki % k.length) - 65;
      ki++;
      return String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65);
    }).join('');
  }



  /**
   * Affiche un texte lettre par lettre (effet machine à écrire).
   * @param {HTMLElement} el        - Élément cible
   * @param {string}      text      - Texte à afficher
   * @param {number}      [speed=40] - Délai en ms entre chaque lettre
   * @returns {Promise<void>}        - Résolue quand l'animation est terminée
   */
  function typewriterEffect(el, text, speed = 40) {
    return new Promise((resolve) => {
      el.textContent = '';
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          el.textContent += text[i];
          i++;
        } else {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  }

  /**
   * Affiche un message de feedback dans un élément dédié.
   * @param {HTMLElement} el        - Élément conteneur du message
   * @param {string}      message   - Texte à afficher
   * @param {'success'|'error'|'info'|'warning'} type - Type de message
   * @param {number}      [duration=3000] - Durée d'affichage en ms (0 = permanent)
   */
  function showFeedback(el, message, type = 'info', duration = 3000) {
    if (!el) return;
    // Couleurs associées aux types
    const colors = {
      success: 'var(--color-success)',
      error:   'var(--color-danger)',
      warning: 'var(--color-warning)',
      info:    'var(--color-secondary)',
    };
    el.textContent  = message;
    el.style.color  = colors[type] || colors.info;
    el.style.opacity = '1';
    el.classList.remove('hidden');

    if (duration > 0) {
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.classList.add('hidden'), 400);
      }, duration);
    }
  }

  /**
   * Applique une animation de tremblement à un élément (réponse erronée).
   * @param {HTMLElement} el
   */
  function shakeElement(el) {
    if (!el) return;
    el.classList.remove('anim-shake');
    // Force le reflow pour relancer l'animation
    void el.offsetWidth;
    el.classList.add('anim-shake');
    el.addEventListener('animationend', () => el.classList.remove('anim-shake'), { once: true });
  }

  /**
   * Normalise une réponse utilisateur pour la comparaison :
   * - Mise en minuscules
   * - Suppression des espaces superflus
   * - Suppression de la ponctuation
   * @param {string} str
   * @returns {string}
   */
  function normalizeAnswer(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')   // retire ponctuation
      .replace(/\s+/g, ' ');          // espaces multiples → un seul
  }

  /**
   * Vérifie si la réponse de l'utilisateur correspond à la réponse attendue.
   * La comparaison est insensible à la casse, aux espaces et à la ponctuation.
   * @param {string} userAnswer
   * @param {string} expectedAnswer
   * @returns {boolean}
   */
  function checkAnswer(userAnswer, expectedAnswer) {
    return normalizeAnswer(userAnswer) === normalizeAnswer(expectedAnswer);
  }

  /* ===== UTILITAIRES DIVERS ================================================= */

  /**
   * Génère un nombre entier aléatoire entre min et max (inclusifs).
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Mélange un tableau en place (algorithme Fisher-Yates).
   * @param {Array} arr
   * @returns {Array} Le même tableau mélangé
   */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Retarde l'exécution d'une Promise.
   * @param {number} ms - Délai en millisecondes
   * @returns {Promise<void>}
   */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Convertit un nombre décimal en binaire avec un padding optionnel.
   * @param {number} num
   * @param {number} [pad=8] - Nombre de bits minimum
   * @returns {string}
   */
  function toBinary(num, pad = 8) {
    return num.toString(2).padStart(pad, '0');
  }

  /**
   * Convertit une chaîne binaire en nombre décimal.
   * @param {string} bin
   * @returns {number}
   */
  function fromBinary(bin) {
    return parseInt(bin, 2);
  }

  /* ===== INTERFACE PUBLIQUE ================================================= */
  return {
    // localStorage
    loadState,
    saveState,
    getGameState,
    updateGameState,
    markGameCompleted,
    resetAllProgress,

    // Timer
    createTimer,
    formatTime,

    // Score
    calculateScore,

    // Encodage
    rot13,
    textToMorse,
    morseToText,
    vigenereDecrypt,
    vigenereEncrypt,

    // DOM / effets
    typewriterEffect,
    showFeedback,
    shakeElement,
    checkAnswer,
    normalizeAnswer,

    // Utilitaires
    randomInt,
    shuffle,
    delay,
    toBinary,
    fromBinary,

    // Constantes
    GAME_IDS,
  };

})();
