/**
 * game.js — Logique complète du jeu ARG "Signal Fantôme"
 *
 * Architecture :
 *  - Un objet `Game` gère l'état global (étape courante, timer, indices)
 *  - Chaque énigme est un objet avec : setup(), check(), showHint()
 *  - Des transitions narratives relient les étapes
 *
 * Étapes :
 *  0 → Intro narrative
 *  1 → Énigme ROT13 (email crypté)
 *  2 → Transition narrative
 *  3 → Énigme Morse / binaire (coordonnées GPS)
 *  4 → Transition narrative
 *  5 → Énigme Vigenère (transmission chiffrée)
 *  6 → Écran de victoire
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════════════════════════════════
     ÉTAT GLOBAL DU JEU
     ══════════════════════════════════════════════════════════════════════ */
  const Game = {
    step:       0,       // Étape courante (0-6)
    hintsUsed:  0,       // Nombre total d'indices utilisés
    timer:      null,    // Instance du timer ARG
    elapsed:    0,       // Secondes écoulées à la fin

    /** Démarre le jeu à l'étape 0 */
    start() {
      this.step      = 0;
      this.hintsUsed = 0;
      // Enregistrer le démarrage dans le localStorage
      ARG.updateGameState('arg', { startedAt: Date.now(), status: 'available' });
      // Initialiser le timer
      this.timer = ARG.createTimer(
        (s) => updateTimerDisplay(s),
        (s) => { this.elapsed = s; }
      );
      this.timer.start();
      showStep(0);
    },

    /** Passe à l'étape suivante */
    nextStep() {
      this.step++;
      showStep(this.step);
    },

    /** Enregistre l'utilisation d'un indice */
    useHint() {
      this.hintsUsed++;
      ARG.updateGameState('arg', { hintsUsed: this.hintsUsed });
    },

    /** Finalise le jeu (victoire) */
    finish() {
      const elapsed = this.timer.stop();
      this.elapsed  = elapsed;
      const score   = ARG.calculateScore(elapsed, this.hintsUsed, 1000, 0.5, 100);
      ARG.markGameCompleted('arg', score, '_48h');
      showStep(6);
    },
  };

  /* ══════════════════════════════════════════════════════════════════════
     SECTIONS DOM
     ══════════════════════════════════════════════════════════════════════ */

  // Toutes les sections du jeu (une par étape)
  const SECTIONS = {
    intro:        document.getElementById('section-intro'),
    puzzle1:      document.getElementById('section-puzzle1'),
    transition1:  document.getElementById('section-transition1'),
    puzzle2:      document.getElementById('section-puzzle2'),
    transition2:  document.getElementById('section-transition2'),
    puzzle3:      document.getElementById('section-puzzle3'),
    victory:      document.getElementById('section-victory'),
  };

  // Ordre des sections selon l'étape
  const STEP_SECTIONS = [
    'intro', 'puzzle1', 'transition1',
    'puzzle2', 'transition2', 'puzzle3', 'victory'
  ];

  // Éléments du HUD
  const elTimer     = document.getElementById('hud-timer');
  const elStep      = document.getElementById('hud-step');
  const elHints     = document.getElementById('hud-hints');

  /* ══════════════════════════════════════════════════════════════════════
     GESTION DES SECTIONS
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * Affiche uniquement la section correspondant à l'étape donnée.
   * Toutes les autres sections sont masquées.
   * @param {number} step
   */
  function showStep(step) {
    const target = STEP_SECTIONS[step];

    // Masquer toutes les sections
    Object.values(SECTIONS).forEach(el => {
      if (el) el.classList.add('hidden');
    });

    // Afficher la cible
    if (SECTIONS[target]) {
      SECTIONS[target].classList.remove('hidden');
      SECTIONS[target].classList.add('anim-fade-in');
    }

    // Mettre à jour le HUD
    updateHUD(step);

    // Initialiser la section si nécessaire
    switch (target) {
      case 'puzzle1':     puzzle1.setup();    break;
      case 'transition1': setupTransition1(); break;
      case 'puzzle2':     puzzle2.setup();    break;
      case 'transition2': setupTransition2(); break;
      case 'puzzle3':     puzzle3.setup();    break;
      case 'victory':     setupVictory();     break;
    }
  }

  /**
   * Met à jour l'affichage du HUD (timer, étape, indices).
   * @param {number} step
   */
  function updateHUD(step) {
    if (elStep) {
      const puzzleNum = Math.min(Math.ceil(step / 2), 3); // 1, 2 ou 3
      elStep.textContent = step === 0 ? '—' : `${puzzleNum} / 3`;
    }
    if (elHints) {
      elHints.textContent = Game.hintsUsed;
    }
  }

  /** Met à jour l'affichage du timer */
  function updateTimerDisplay(seconds) {
    if (elTimer) elTimer.textContent = ARG.formatTime(seconds);
    if (elHints) elHints.textContent = Game.hintsUsed;
  }

  /* ══════════════════════════════════════════════════════════════════════
     SECTION 0 — INTRO
     ══════════════════════════════════════════════════════════════════════ */

  const elStartBtn = document.getElementById('intro-start-btn');
  if (elStartBtn) {
    elStartBtn.addEventListener('click', () => Game.nextStep());
  }

  // Lancer l'intro directement au chargement
  Game.start();

  /* ══════════════════════════════════════════════════════════════════════
     ÉNIGME 1 — EMAIL ROT13
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * Données de l'énigme 1 :
   * Le message ROT13 à décoder est : "LES MURS ONT DES YEUX"
   * En ROT13 cela donne : "YRF ZHEF BAG QRF LRHK"
   */
  const PUZZLE1 = {
    // Phrase codée en ROT13
    encodedMessage: 'YRF ZHEF BAG QRF LRHK',
    // Réponse attendue (en clair)
    answer: 'les murs ont des yeux',
    // Indice
    hint: 'ROT13 décale chaque lettre de 13 positions dans l\'alphabet. A→N, B→O, etc. Essaie de décoder lettre par lettre.',
    // Timer de verrouillage de l'indice (secondes)
    hintDelay: 60,
    hintUnlocked: false,
    hintTimer: null,
  };

  const puzzle1 = {
    /** Initialise l'affichage de l'énigme 1 */
    setup() {
      const elCode    = document.getElementById('p1-encoded-msg');
      const elInput   = document.getElementById('p1-input');
      const elSubmit  = document.getElementById('p1-submit');
      const elHintBtn = document.getElementById('p1-hint-btn');
      const elHintTxt = document.getElementById('p1-hint-text');
      const elFeedback= document.getElementById('p1-feedback');
      const elCountdown = document.getElementById('p1-hint-countdown');

      // Afficher le message codé
      if (elCode) elCode.textContent = PUZZLE1.encodedMessage;

      // Réinitialiser les champs
      if (elInput) { elInput.value = ''; elInput.focus(); }
      if (elFeedback) elFeedback.classList.add('hidden');
      if (elHintTxt) elHintTxt.classList.add('hidden');

      // Compte à rebours pour l'indice
      PUZZLE1.hintUnlocked = false;
      if (elHintBtn) elHintBtn.setAttribute('disabled', 'true');
      let countdown = PUZZLE1.hintDelay;

      if (elCountdown) elCountdown.textContent = `Indice disponible dans ${countdown}s`;

      PUZZLE1.hintTimer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(PUZZLE1.hintTimer);
          PUZZLE1.hintUnlocked = true;
          if (elHintBtn) elHintBtn.removeAttribute('disabled');
          if (elCountdown) elCountdown.textContent = 'Indice disponible';
        } else {
          if (elCountdown) elCountdown.textContent = `Indice dans ${countdown}s`;
        }
      }, 1000);

      // Événement : afficher l'indice
      elHintBtn && elHintBtn.addEventListener('click', () => {
        if (!PUZZLE1.hintUnlocked) return;
        Game.useHint();
        if (elHintTxt) {
          elHintTxt.textContent = PUZZLE1.hint;
          elHintTxt.classList.remove('hidden');
        }
        elHintBtn.setAttribute('disabled', 'true');
      }, { once: true });

      // Événement : validation de la réponse
      const validate = () => {
        const val = elInput ? elInput.value : '';
        if (ARG.checkAnswer(val, PUZZLE1.answer)) {
          // Bonne réponse
          clearInterval(PUZZLE1.hintTimer);
          ARG.showFeedback(elFeedback, '✓ ACCÈS AUTORISÉ — Déchiffrement réussi.', 'success', 0);
          if (elSubmit) elSubmit.setAttribute('disabled', 'true');
          if (elInput)  elInput.setAttribute('disabled', 'true');
          // Transition automatique
          setTimeout(() => Game.nextStep(), 1800);
        } else {
          // Mauvaise réponse
          ARG.showFeedback(elFeedback, '✗ RÉPONSE INCORRECTE — Réessaie.', 'error', 2500);
          ARG.shakeElement(elInput);
        }
      };

      elSubmit && elSubmit.addEventListener('click', validate);
      elInput  && elInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') validate();
      });
    },
  };

  /* ══════════════════════════════════════════════════════════════════════
     TRANSITION NARRATIVE 1
     ══════════════════════════════════════════════════════════════════════ */

  function setupTransition1() {
    const elText = document.getElementById('trans1-text');
    const elBtn  = document.getElementById('trans1-next-btn');

    if (elText) {
      ARG.typewriterEffect(
        elText,
        '> Message déchiffré. Le fantôme répond.\n' +
        '> "Tu es plus malin que je ne le pensais."\n' +
        '> "Mais es-tu capable de lire entre les chiffres ?"\n' +
        '> "Les coordonnées t\'attendent. Elles pointent vers tout."\n' +
        '> Connexion sécurisée... Prochaine transmission en cours.',
        25
      );
    }

    if (elBtn) {
      elBtn.addEventListener('click', () => Game.nextStep(), { once: true });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     ÉNIGME 2 — COORDONNÉES GPS EN MORSE
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * Le fichier donne les coordonnées d'un "lieu fictif" encodées en Morse.
   *
   * Coordonnées fictives : 48° N, 2° E (Paris, pour le scénario)
   * Nom de code secret du lieu : "ZEPHYR"
   *
   * Les coordonnées sont encodées ainsi :
   *   48 en Morse : "....- ----."   → "48"
   *    2 en Morse : "..---"         → "2"
   * Le joueur doit reconnaître "48" et "2" puis saisir "ZEPHYR" comme nom de code.
   */
  const PUZZLE2 = {
    // Morse pour "4" et "8", puis "2"
    morseCoords: {
      lat: '....- ---..',   // 4 puis 8  →  48° N
      lon: '..---',         // 2         →   2° E
    },
    answer: 'zephyr',
    hint: 'Décode d\'abord le morse : chaque groupe de points/traits = un chiffre. LAT = 48, LON = 2. Puis cherche 48°N · 2°E dans l\'index des archives visible à droite.',
    hintDelay: 90,
    hintUnlocked: false,
    hintTimer: null,
  };

  const puzzle2 = {
    setup() {
      const elLatMorse    = document.getElementById('p2-lat-morse');
      const elLonMorse    = document.getElementById('p2-lon-morse');
      const elDecodeLat   = document.getElementById('p2-decode-lat-btn');
      const elDecodeLon   = document.getElementById('p2-decode-lon-btn');
      const elLatResult   = document.getElementById('p2-lat-result');
      const elLonResult   = document.getElementById('p2-lon-result');
      const elLatValue    = document.getElementById('p2-lat-value');
      const elLonValue    = document.getElementById('p2-lon-value');
      const elArchiveRow  = document.getElementById('p2-archive-target');
      const elInput       = document.getElementById('p2-input');
      const elSubmit      = document.getElementById('p2-submit');
      const elHintBtn     = document.getElementById('p2-hint-btn');
      const elHintTxt     = document.getElementById('p2-hint-text');
      const elFeedback    = document.getElementById('p2-feedback');
      const elCountdown   = document.getElementById('p2-hint-countdown');

      // Afficher les codes morse
      if (elLatMorse) elLatMorse.textContent = PUZZLE2.morseCoords.lat;
      if (elLonMorse) elLonMorse.textContent = PUZZLE2.morseCoords.lon;

      // Réinitialiser
      if (elInput)    { elInput.value = ''; elInput.focus(); }
      if (elFeedback) elFeedback.classList.add('hidden');
      if (elHintTxt)  elHintTxt.classList.add('hidden');

      let latDecoded = false;
      let lonDecoded = false;

      // Active la ligne de l'archive quand les deux coordonnées sont décodées
      function tryActivateArchive() {
        if (!latDecoded || !lonDecoded) return;
        if (!elArchiveRow) return;
        elArchiveRow.classList.add('archive-row--active');
        // Mettre à jour le contenu des cellules
        const cells = elArchiveRow.querySelectorAll('td');
        if (cells[0]) { cells[0].className = 'text-primary'; }
        if (cells[1]) { cells[1].className = 'text-primary'; }
        if (cells[2]) { cells[2].className = 'text-warning'; cells[2].textContent = '[ACTIF]'; }
        // Scroll vers la ligne
        elArchiveRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Bouton DÉCODER LAT
      if (elDecodeLat) {
        elDecodeLat.addEventListener('click', () => {
          const decoded = ARG.morseToText(PUZZLE2.morseCoords.lat);
          if (elLatValue) elLatValue.textContent = `→  ${decoded}° N`;
          if (elLatResult) elLatResult.classList.remove('hidden');
          elDecodeLat.setAttribute('disabled', 'true');
          elDecodeLat.textContent = '✓ LAT DÉCODÉE';
          latDecoded = true;
          tryActivateArchive();
        }, { once: true });
      }

      // Bouton DÉCODER LON
      if (elDecodeLon) {
        elDecodeLon.addEventListener('click', () => {
          const decoded = ARG.morseToText(PUZZLE2.morseCoords.lon);
          if (elLonValue) elLonValue.textContent = `→  ${decoded}° E`;
          if (elLonResult) elLonResult.classList.remove('hidden');
          elDecodeLon.setAttribute('disabled', 'true');
          elDecodeLon.textContent = '✓ LON DÉCODÉE';
          lonDecoded = true;
          tryActivateArchive();
        }, { once: true });
      }

      // Compte à rebours indice
      PUZZLE2.hintUnlocked = false;
      if (elHintBtn)    elHintBtn.setAttribute('disabled', 'true');
      let countdown = PUZZLE2.hintDelay;
      if (elCountdown) elCountdown.textContent = `Indice dans ${countdown}s`;

      PUZZLE2.hintTimer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(PUZZLE2.hintTimer);
          PUZZLE2.hintUnlocked = true;
          if (elHintBtn)   elHintBtn.removeAttribute('disabled');
          if (elCountdown) elCountdown.textContent = 'Indice disponible';
        } else {
          if (elCountdown) elCountdown.textContent = `Indice dans ${countdown}s`;
        }
      }, 1000);

      elHintBtn && elHintBtn.addEventListener('click', () => {
        if (!PUZZLE2.hintUnlocked) return;
        Game.useHint();
        if (elHintTxt) {
          elHintTxt.textContent = PUZZLE2.hint;
          elHintTxt.classList.remove('hidden');
        }
        elHintBtn.setAttribute('disabled', 'true');
      }, { once: true });

      const validate = () => {
        const val = elInput ? elInput.value : '';
        if (ARG.checkAnswer(val, PUZZLE2.answer)) {
          clearInterval(PUZZLE2.hintTimer);
          ARG.showFeedback(elFeedback, '✓ NOM DE CODE VALIDÉ — Localisation confirmée.', 'success', 0);
          if (elSubmit) elSubmit.setAttribute('disabled', 'true');
          if (elInput)  elInput.setAttribute('disabled', 'true');
          setTimeout(() => Game.nextStep(), 1800);
        } else {
          ARG.showFeedback(elFeedback, '✗ NOM DE CODE INVALIDE — Analyse en cours.', 'error', 2500);
          ARG.shakeElement(elInput);
        }
      };

      elSubmit && elSubmit.addEventListener('click', validate);
      elInput  && elInput.addEventListener('keydown', e => { if (e.key === 'Enter') validate(); });
    },
  };

  /* ══════════════════════════════════════════════════════════════════════
     TRANSITION NARRATIVE 2
     ══════════════════════════════════════════════════════════════════════ */

  function setupTransition2() {
    const elText = document.getElementById('trans2-text');
    const elBtn  = document.getElementById('trans2-next-btn');

    if (elText) {
      ARG.typewriterEffect(
        elText,
        '> Localisation déchiffrée. Archive Fantôme Zeta.\n' +
        '> "Tu approches de la vérité, opérateur."\n' +
        '> "Une dernière transmission a été interceptée ce soir."\n' +
        '> "Elle est chiffrée. Le protocole est inconnu."\n' +
        '> "Mais quelqu\'un a laissé une trace... si tu sais où chercher."\n' +
        '> Analyse en cours — chiffrement non identifié.',
        25
      );
    }

    if (elBtn) {
      elBtn.addEventListener('click', () => Game.nextStep(), { once: true });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     ÉNIGME 3 — CHIFFRE DE VIGENÈRE
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * Transmission interceptée chiffrée par Vigenère avec la clé "GHOST".
   *
   * Plaintext  : "TRANSMISSION DELTA SEPT POINT ZERO AGENT VERITAS CONFIRME
   *               EXTRACTION REUSSIE DESTINATION INCONNUE"
   * Clé        : "GHOST"
   * Ciphertext : "ZYOFLSPGKBUU RWEZH GWIZ WCAGZ GSJH GNSFM BLFAMGZ QGGLPFEX
   *               KEHJTIAWGG XLIKLOL RWLZPBSMOVB AGIVBFNK"
   *
   * La clé se trouve dans l'acrostiche du protocole de sécurité :
   *   Guardian... Hostile... Origin... Security... Transmission... → GHOST
   *
   * Réponse attendue : "veritas"  (le nom de code agent dans le message déchiffré)
   */
  const PUZZLE3 = {
    answer: 'veritas',
    cipherLines: [
      'ZYOFLSPGKBUU RWEZH GWIZ',
      'WCAGZ GSJH GNSFM BLFAMGZ',
      'QGGLPFEX KEHJTIAWGG',
      'XLIKLOL RWLZPBSMOVB',
      'AGIVBFNK',
    ],
    reportLines: [
      { text: 'RAPPORT D\'INCIDENT CLASSIFIÉ — SECTEUR-NULL', type: 'header' },
      { text: 'Niveau d\'autorisation requis : ROUGE', type: 'meta' },
      { text: '', type: 'spacer' },
      { text: 'Une fuite a été identifiée au sein du GROUPE FANTÔME à 03h42.', type: 'body' },
      { text: 'L\'HABILITATION des agents de niveau 3 a été révoquée sans préavis.', type: 'body' },
      { text: 'L\'OPÉRATION en cours est suspendue jusqu\'à nouvel ordre du commandement.', type: 'body' },
      { text: 'Le SECTEUR est placé en quarantaine — protocole ALPHA en vigueur.', type: 'body' },
      { text: 'Toute TRANSMISSION est désormais filtrée et archivée par le système NULL.', type: 'body' },
      { text: '', type: 'spacer' },
      { text: 'Référence : INC-2026-0330-7734 — CONFIDENTIEL', type: 'footer' },
    ],
    hint: 'Dans le rapport classifié, certains mots ressortent. Cherche ce qu\'ils ont en commun et ce que leurs initiales pourraient cacher.',
    hintDelay: 90,
    hintUnlocked: false,
    hintTimer: null,
  };

  const puzzle3 = {
    setup() {
      const elCipher    = document.getElementById('p3-ciphertext');
      const elClue      = document.getElementById('p3-key-clue');
      const elKeyInput  = document.getElementById('p3-key-input');
      const elDecodeBtn   = document.getElementById('p3-decode-btn');
      const elDecoded     = document.getElementById('p3-decoded-area');
      const elDecodedTxt  = document.getElementById('p3-decoded-text');
      const elDecodeFb    = document.getElementById('p3-decode-feedback');
      const elInput       = document.getElementById('p3-input');
      const elSubmit    = document.getElementById('p3-submit');
      const elHintBtn   = document.getElementById('p3-hint-btn');
      const elHintTxt   = document.getElementById('p3-hint-text');
      const elFeedback  = document.getElementById('p3-feedback');
      const elCountdown = document.getElementById('p3-hint-countdown');

      // Afficher le texte chiffré ligne par ligne
      if (elCipher) {
        elCipher.innerHTML = PUZZLE3.cipherLines
          .map(l => `<span class="cipher-line">${l}</span>`)
          .join('');
      }

      // Afficher le rapport classifié
      // Les mots ALL CAPS significatifs (GROUPE, HABILITATION, OPÉRATION, SECTEUR, TRANSMISSION)
      // sont mis en couleur warning. Les leurres (ROUGE, ALPHA, NULL) restent neutres.
      const KEY_WORDS = ['GROUPE', 'HABILITATION', 'OPÉRATION', 'SECTEUR', 'TRANSMISSION'];
      if (elClue) {
        elClue.innerHTML = PUZZLE3.reportLines.map(({ text, type }) => {
          if (type === 'spacer') return '<div class="report-spacer"></div>';
          // Surligner les mots-clés en warning dans les lignes body
          const html = type === 'body'
            ? text.replace(/\b([A-ZÀÂÄÉÈÊËÎÏÔÙÛÜ]{3,})\b/g, (m) => {
                return KEY_WORDS.includes(m)
                  ? `<span class="report-keyword text-warning">${m}</span>`
                  : m;
              })
            : text;
          return `<div class="report-line report-line--${type}">${html}</div>`;
        }).join('');
      }

      // Réinitialiser
      if (elKeyInput) { elKeyInput.value = ''; }
      if (elInput)    { elInput.value = ''; elInput.focus(); }
      if (elFeedback) elFeedback.classList.add('hidden');
      if (elHintTxt)  elHintTxt.classList.add('hidden');
      if (elDecoded)  elDecoded.classList.add('hidden');

      // Bouton DÉCODER — déchiffre et affiche le message
      const tryDecode = () => {
        const keyVal = elKeyInput ? elKeyInput.value.trim() : '';
        if (!keyVal) {
          ARG.showFeedback(elDecodeFb, '⚠ Entre une clé de déchiffrement.', 'error', 2500);
          if (elDecoded) elDecoded.classList.add('hidden');
          return;
        }
        // Clé trop longue = probablement pas un mot-clé (ex: copier-coller du cipher)
        if (keyVal.replace(/[^A-Z]/gi, '').length > 12) {
          ARG.showFeedback(elDecodeFb, '⚠ La clé doit être un mot court (5-10 lettres max).', 'error', 3000);
          if (elDecoded) elDecoded.classList.add('hidden');
          return;
        }

        const cipherFull = PUZZLE3.cipherLines.join(' ');
        const decoded    = ARG.vigenereDecrypt(cipherFull, keyVal);

        if (elDecodedTxt) {
          elDecodedTxt.textContent = decoded;
        }
        if (elDecoded) elDecoded.classList.remove('hidden');
        if (elDecodeBtn) elDecodeBtn.textContent = 'RE-DÉCODER';

        // Vérifier si le résultat est lisible (clé correcte = "AGENT" présent dans le déchiffré)
        const isReadable = /\bAGENT\b/.test(decoded);
        if (isReadable) {
          ARG.showFeedback(elDecodeFb, '✓ Déchiffrement réussi — analyse le contenu.', 'success', 0);
          if (elInput) elInput.focus();
        } else {
          ARG.showFeedback(elDecodeFb, '✗ Clé incorrecte — le message reste illisible.', 'error', 3000);
        }
      };

      elDecodeBtn && elDecodeBtn.addEventListener('click', tryDecode);
      elKeyInput  && elKeyInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') tryDecode();
      });

      // Compte à rebours indice
      PUZZLE3.hintUnlocked = false;
      if (elHintBtn) elHintBtn.setAttribute('disabled', 'true');
      let countdown = PUZZLE3.hintDelay;
      if (elCountdown) elCountdown.textContent = `Indice dans ${countdown}s`;

      PUZZLE3.hintTimer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(PUZZLE3.hintTimer);
          PUZZLE3.hintUnlocked = true;
          if (elHintBtn)   elHintBtn.removeAttribute('disabled');
          if (elCountdown) elCountdown.textContent = 'Indice disponible';
        } else {
          if (elCountdown) elCountdown.textContent = `Indice dans ${countdown}s`;
        }
      }, 1000);

      elHintBtn && elHintBtn.addEventListener('click', () => {
        if (!PUZZLE3.hintUnlocked) return;
        Game.useHint();
        if (elHintTxt) {
          elHintTxt.textContent = PUZZLE3.hint;
          elHintTxt.classList.remove('hidden');
        }
        elHintBtn.setAttribute('disabled', 'true');
      }, { once: true });

      // Validation de la réponse finale
      const validate = () => {
        const val = elInput ? elInput.value : '';
        if (ARG.checkAnswer(val, PUZZLE3.answer)) {
          clearInterval(PUZZLE3.hintTimer);
          ARG.showFeedback(elFeedback, '✓ NOM DE CODE VALIDÉ — Transmission déchiffrée.', 'success', 0);
          if (elSubmit) elSubmit.setAttribute('disabled', 'true');
          if (elInput)  elInput.setAttribute('disabled', 'true');
          setTimeout(() => Game.finish(), 1800);
        } else {
          ARG.showFeedback(elFeedback, '✗ NOM DE CODE INVALIDE — Vérifier le déchiffrement.', 'error', 2500);
          ARG.shakeElement(elInput);
        }
      };

      elSubmit && elSubmit.addEventListener('click', validate);
      elInput  && elInput.addEventListener('keydown', e => { if (e.key === 'Enter') validate(); });
    },
  };

  /* ══════════════════════════════════════════════════════════════════════
     SECTION 6 — VICTOIRE
     ══════════════════════════════════════════════════════════════════════ */

  function setupVictory() {
    const state     = ARG.getGameState('arg');
    const finalScore = state ? state.score : 0;
    const elapsed   = Game.elapsed;

    const elScore    = document.getElementById('victory-score');
    const elTime     = document.getElementById('victory-time');
    const elHints    = document.getElementById('victory-hints');
    const elRating   = document.getElementById('victory-rating');
    const elNarrative= document.getElementById('victory-narrative');
    const elBackBtn  = document.getElementById('victory-back-btn');

    if (elScore)  elScore.textContent  = finalScore;
    if (elTime)   elTime.textContent   = ARG.formatTime(elapsed);
    if (elHints)  elHints.textContent  = Game.hintsUsed;

    // Note basée sur le score
    let rating = '★★★★★';
    if (finalScore < 200)     rating = '★☆☆☆☆';
    else if (finalScore < 400) rating = '★★☆☆☆';
    else if (finalScore < 600) rating = '★★★☆☆';
    else if (finalScore < 800) rating = '★★★★☆';
    if (elRating) elRating.textContent = rating;

    // Narration finale
    if (elNarrative) {
      ARG.typewriterEffect(
        elNarrative,
        'VERITAS. La vérité.\n\n' +
        'Le fantôme n\'était pas un ennemi. Il était l\'un des nôtres — \n' +
        'un lanceur d\'alerte piégé dans le système CHALLENGE-48H.\n\n' +
        'Ses coordonnées pointaient vers une archive souterraine oubliée.\n' +
        'Ses mots cachaient un avertissement que personne ne voulait entendre :\n\n' +
        '"LES MURS ONT DES YEUX — et ils nous voient tous."\n\n' +
        'Tu as déchiffré le message. La vérité est entre tes mains.\n' +
        'Ce que tu en fais maintenant... c\'est ton choix.',
        30
      );
    }

    // Bouton retour au hub
    if (elBackBtn) {
      elBackBtn.addEventListener('click', () => {
        window.location.href = '../../index.html';
      }, { once: true });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     LANCEMENT
     ══════════════════════════════════════════════════════════════════════ */
  // Le jeu est déjà lancé via Game.start() au chargement de la page.
  // La première section (intro) est affichée et le timer tourne.

});
