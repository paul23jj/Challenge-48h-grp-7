/**
 * hub.js — Logique du hub central (index.html)
 * Gère l'affichage de la progression, les interactions et les mises à jour des cartes.
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Éléments DOM ──────────────────────────────────────────────────────── */
  const elSubtitle   = document.getElementById('js-subtitle');
  const elTotalScore = document.getElementById('js-total-score');
  const elDate       = document.getElementById('js-date');
  const elResetBtn   = document.getElementById('js-reset-btn');
  const elModalReset = document.getElementById('js-modal-reset');
  const elModalOK    = document.getElementById('js-modal-confirm');
  const elModalCancel= document.getElementById('js-modal-cancel');
  const elBravoScreen= document.getElementById('js-bravo-screen');
  const elBravoText  = document.getElementById('js-bravo-text');
  const elBravoPhrase= document.getElementById('js-bravo-phrase');
  const elBravoClose = document.getElementById('js-bravo-close');

  /* ── Données de configuration des cartes ──────────────────────────────── */
  const CARDS = {
    arg:   { card: document.getElementById('card-arg'),   badge: document.getElementById('badge-arg'),   score: document.getElementById('score-arg'),   btn: document.getElementById('btn-arg')   },
    game2: { card: document.getElementById('card-game2'), badge: document.getElementById('badge-game2'), score: document.getElementById('score-game2'), btn: document.getElementById('btn-game2') },
    game3: { card: document.getElementById('card-game3'), badge: document.getElementById('badge-game3'), score: document.getElementById('score-game3'), btn: document.getElementById('btn-game3') },
    game4: { card: document.getElementById('card-game4'), badge: document.getElementById('badge-game4'), score: document.getElementById('score-game4'), btn: document.getElementById('btn-game4') },
  };

  /* ── Slots de phrase ───────────────────────────────────────────────────── */
  const PHRASE_SLOTS = {
    arg:   document.getElementById('phrase-slot-arg'),
    game2: document.getElementById('phrase-slot-game2'),
    game3: document.getElementById('phrase-slot-game3'),
    game4: document.getElementById('phrase-slot-game4'),
  };

  /* ── Sous-titres narratifs (défilement rotatif) ─────────────────────── */
  const SUBTITLES = [
    'Signal de détresse détecté — origine inconnue.',
    'Chiffrement AES-256 contourné. Données partiellement récupérées.',
    'Ils savent que tu es là. Continue quand même.',
    'Trois couches de sécurité. Une seule vérité.',
    'Le fantôme transmet toujours. Écoute attentivement.',
    'Tout ce que tu crois savoir est une simulation.',
  ];
  let subtitleIndex = 0;

  /* ══════════════════════════════════════════════════════════════════════
     INITIALISATION
     ══════════════════════════════════════════════════════════════════════ */

  function init() {
    elDate.textContent = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    renderProgress();
    startSubtitleRotation();

    elResetBtn.addEventListener('click', () => openModal());
    elModalOK.addEventListener('click', () => confirmReset());
    elModalCancel.addEventListener('click', () => closeModal());
    elModalReset.addEventListener('click', (e) => {
      if (e.target === elModalReset) closeModal();
    });
    if (elBravoClose) {
      elBravoClose.addEventListener('click', () => {
        elBravoScreen.classList.add('hidden');
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     AFFICHAGE DE LA PROGRESSION
     ══════════════════════════════════════════════════════════════════════ */

  function renderProgress() {
    const state = ARG.loadState();

    elTotalScore.textContent = String(state.totalScore).padStart(4, '0');

    ARG.GAME_IDS.forEach((gameId) => {
      const gameState = state.games[gameId];
      const els       = CARDS[gameId];
      if (!els || !els.card) return;

      const { status, score, word } = gameState;

      // Badge
      if (els.badge) {
        els.badge.className = 'game-card__badge badge';
        if (status === 'completed') {
          els.badge.className += ' badge-done';
          els.badge.textContent = '✅ COMPLÉTÉ';
        } else if (status === 'available') {
          els.badge.className += ' badge-playing';
          els.badge.textContent = '▶ DISPONIBLE';
        } else {
          els.badge.className += ' badge-locked';
          els.badge.textContent = '🔒 VERROUILLÉ';
        }
      }

      // Classe CSS de la carte
      els.card.classList.remove('game-card--locked', 'game-card--completed');
      if (status === 'completed') {
        els.card.classList.add('game-card--completed');
      } else if (status === 'locked') {
        els.card.classList.add('game-card--locked');
      }

      // Score affiché
      if (els.score) {
        els.score.textContent = status === 'completed' ? `Score : ${score}` : 'Score : —';
      }

      // Bouton / lien
      if (els.btn) {
        if (status === 'locked') {
          els.btn.textContent = 'ACCÈS REFUSÉ';
          els.btn.setAttribute('tabindex', '-1');
          els.btn.setAttribute('aria-disabled', 'true');
          // Bloquer la navigation sur le <a>
          els.btn._lockHandler = (e) => e.preventDefault();
          els.btn.addEventListener('click', els.btn._lockHandler);
        } else {
          // Débloquer si précédemment locked
          if (els.btn._lockHandler) {
            els.btn.removeEventListener('click', els.btn._lockHandler);
            delete els.btn._lockHandler;
          }
          els.btn.removeAttribute('tabindex');
          els.btn.removeAttribute('aria-disabled');
          if (status === 'completed') {
            els.btn.textContent = 'REJOUER';
          } else {
            els.btn.textContent = 'DÉMARRER';
          }
        }
      }

      // Slot de phrase
      const slot = PHRASE_SLOTS[gameId];
      if (slot) {
        if (status === 'completed' && word) {
          slot.textContent = word;
          slot.classList.add('phrase-slot--revealed');
        } else {
          slot.textContent = '???';
          slot.classList.remove('phrase-slot--revealed');
        }
      }
    });

    // Bravo screen si tous les jeux sont terminés
    if (state.phraseComplete && elBravoScreen && elBravoScreen.classList.contains('hidden')) {
      setTimeout(() => showBravo(state), 800);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     ÉCRAN BRAVO HACKER
     ══════════════════════════════════════════════════════════════════════ */

  function showBravo(state) {
    if (!elBravoScreen) return;

    // Construire la phrase complète
    const words = ARG.GAME_IDS.map(id => state.games[id].word || '???');
    const phrase = words.join(' ');

    // Afficher la phrase dans le slot bravo
    if (elBravoPhrase) {
      elBravoPhrase.innerHTML = words
        .map(w => `<span class="bravo-word">${w}</span>`)
        .join('<span class="bravo-sep">·</span>');
    }

    // Afficher l'overlay
    elBravoScreen.classList.remove('hidden');

    // Typewriter hacker
    if (elBravoText) {
      elBravoText.textContent = '';
      const lines = [
        '> INITIALISATION PROTOCOLE FINAL...',
        '> VÉRIFICATION DES 4 NIVEAUX D\'ACCÈS...',
        `> [OK] MISSION 01 — PROTOCOLE OMEGA COMPLÉTÉ`,
        `> [OK] MISSION 02 — FRÉQUENCE INTERDITE COMPLÉTÉE`,
        `> [OK] MISSION 03 — NŒUD TERMINAL COMPLÉTÉ`,
        `> [OK] MISSION 04 — SIGNAL FANTÔME COMPLÉTÉ`,
        '> ─────────────────────────────────────',
        '> DÉCRYPTAGE DU MESSAGE FINAL...',
        `> PHRASE RECONSTITUÉE : "${phrase}"`,
        '> ─────────────────────────────────────',
        '> IDENTIFIANTS SYSTÈME DÉVERROUILLÉS :',
        '> LOGIN    : ynov26',
        '> PASSWORD : ch@ll3nge_48h',
        '> ─────────────────────────────────────',
        '> ACCÈS TOTAL ACCORDÉ.',
        '> Félicitations, opérateur.',
        '> Tu as percé le secret du Signal Fantôme.',
        '> /sys/shutdown --reason="mission_accomplie"',
      ];
      let i = 0;
      function printNextLine() {
        if (i >= lines.length) return;
        elBravoText.textContent += (i > 0 ? '\n' : '') + lines[i];
        i++;
        setTimeout(printNextLine, i < 3 ? 120 : i < 8 ? 80 : 200);
      }
      setTimeout(printNextLine, 300);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     ROTATION DES SOUS-TITRES
     ══════════════════════════════════════════════════════════════════════ */

  function startSubtitleRotation() {
    ARG.typewriterEffect(elSubtitle, SUBTITLES[0], 30);

    setInterval(async () => {
      subtitleIndex = (subtitleIndex + 1) % SUBTITLES.length;
      elSubtitle.style.opacity = '0';
      await ARG.delay(400);
      await ARG.typewriterEffect(elSubtitle, SUBTITLES[subtitleIndex], 30);
      elSubtitle.style.opacity = '1';
    }, 7000);
  }

  /* ══════════════════════════════════════════════════════════════════════
     MODAL RESET
     ══════════════════════════════════════════════════════════════════════ */

  function openModal()  { elModalReset.classList.remove('hidden'); }
  function closeModal() { elModalReset.classList.add('hidden');    }

  function confirmReset() {
    ARG.resetAllProgress();
    // Réinitialiser aussi le compte à rebours global de 12 minutes
    localStorage.removeItem('arg_challenge_start');
    closeModal();
    elTotalScore.style.color = 'var(--color-danger)';
    setTimeout(() => { elTotalScore.style.color = ''; }, 1000);
    renderProgress();
  }

  /* ══════════════════════════════════════════════════════════════════════
     DÉMARRAGE
     ══════════════════════════════════════════════════════════════════════ */
  init();
});
