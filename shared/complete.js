/**
 * complete.js — Module de complétion de jeu
 * ─────────────────────────────────────────────────────────────────────────
 * À inclure dans la page de fin de chaque mini-jeu (après utils.js).
 *
 * UTILISATION :
 *   <script src="../../shared/utils.js"></script>
 *   <script src="../../shared/complete.js"></script>
 *   <script>
 *     ARG_complete('game2', 1500, 'ynov');   // gameId, score, mot
 *   </script>
 *
 * La fonction :
 *   1. Enregistre la complétion dans localStorage (unlock jeu suivant)
 *   2. Injecte un écran de transition "Mission accomplie"
 *   3. Redirige vers le hub (../../index.html) après 4 secondes
 *
 * GAME IDs et MOTS associés (NE PAS MODIFIER) :
 *   game2 → 'ynov'
 *   game3 → '26'
 *   game4 → 'ch@ll3nge'
 *   arg   → '_48h'          ← géré par l'équipe ARG directement
 * ─────────────────────────────────────────────────────────────────────────
 */

/* eslint-disable no-unused-vars */

/**
 * Enregistre la fin d'un jeu et redirige vers le hub.
 * @param {string} gameId  - Identifiant du jeu ('game2' | 'game3' | 'game4')
 * @param {number} score   - Score final du joueur (entier)
 * @param {string} word    - Mot secret à injecter dans la phrase finale
 * @param {number} [delay] - Délai avant redirection en ms (défaut : 4000)
 */
function ARG_complete(gameId, score, word, delay = 4000) {
  /* ── 1. Enregistrement ─────────────────────────────────────────────── */
  if (typeof ARG === 'undefined' || typeof ARG.markGameCompleted !== 'function') {
    console.error('[ARG_complete] utils.js non chargé — impossible d\'enregistrer la progression.');
    return;
  }
  ARG.markGameCompleted(gameId, score, word);

  /* ── 2. Injection de l'overlay de transition ───────────────────────── */
  _injectCompleteOverlay(gameId, score, word, delay);
}

function _injectCompleteOverlay(gameId, score, word, delay) {
  /* Styles inline pour ne pas dépendre d'une CSS externe */
  const style = document.createElement('style');
  style.textContent = `
    #arg-complete-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.97);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: 'Courier New', Courier, monospace;
      color: #00d4ff;
      animation: arg-fadein .4s ease;
    }
    @keyframes arg-fadein { from { opacity:0; } to { opacity:1; } }
    #arg-complete-overlay .arg-box {
      border: 1px solid #00d4ff;
      padding: 2.5rem 3.5rem;
      max-width: 520px;
      width: 90%;
      text-align: center;
      box-shadow: 0 0 40px rgba(0,212,255,.2);
      background: rgba(0,212,255,.04);
    }
    #arg-complete-overlay .arg-label {
      font-size: .7rem; letter-spacing: .25em;
      color: #6b6b6b; margin-bottom: 1rem;
      text-transform: uppercase;
    }
    #arg-complete-overlay .arg-title {
      font-size: 1.9rem; font-weight: bold;
      letter-spacing: .1em; margin-bottom: .5rem;
      text-transform: uppercase;
    }
    #arg-complete-overlay .arg-score {
      font-size: 1rem; color: #00ff88;
      margin: .8rem 0 1.5rem;
      letter-spacing: .1em;
    }
    #arg-complete-overlay .arg-word {
      font-size: 2rem; font-weight: bold;
      letter-spacing: .3em; color: #fff;
      background: rgba(0,212,255,.12);
      border: 1px solid rgba(0,212,255,.4);
      padding: .4rem 1.2rem; display: inline-block;
      margin-bottom: 1.5rem;
    }
    #arg-complete-overlay .arg-redirect {
      font-size: .75rem; color: #6b6b6b;
      letter-spacing: .1em;
    }
    #arg-complete-overlay .arg-bar-wrap {
      width: 100%; height: 3px;
      background: rgba(0,212,255,.15);
      margin-top: 1.2rem; border-radius: 2px; overflow: hidden;
    }
    #arg-complete-overlay .arg-bar {
      height: 100%; width: 0%;
      background: #00d4ff;
      transition: width linear;
    }
  `;
  document.head.appendChild(style);

  /* HTML de l'overlay */
  const overlay = document.createElement('div');
  overlay.id = 'arg-complete-overlay';
  overlay.innerHTML = `
    <div class="arg-box">
      <p class="arg-label">// Mission terminée — ${gameId.toUpperCase()} //</p>
      <h1 class="arg-title">✓ Objectif atteint</h1>
      <p class="arg-score">SCORE : ${score}</p>
      <div class="arg-word">${word}</div>
      <p class="arg-redirect">Retour au hub dans <span id="arg-countdown">${Math.round(delay / 1000)}</span> s…</p>
      <div class="arg-bar-wrap"><div class="arg-bar" id="arg-bar"></div></div>
    </div>
  `;
  document.body.appendChild(overlay);

  /* Barre de progression */
  requestAnimationFrame(() => {
    const bar = document.getElementById('arg-bar');
    if (bar) {
      bar.style.transition = `width ${delay}ms linear`;
      requestAnimationFrame(() => { bar.style.width = '100%'; });
    }
  });

  /* Compte à rebours */
  let remaining = Math.round(delay / 1000);
  const countEl = document.getElementById('arg-countdown');
  const timer = setInterval(() => {
    remaining--;
    if (countEl) countEl.textContent = remaining;
    if (remaining <= 0) clearInterval(timer);
  }, 1000);

  /* Redirection */
  setTimeout(() => {
    /* Remonte jusqu'à la racine (fonctionne depuis games/gameX/) */
    window.location.href = '../../index.html';
  }, delay);
}
