/**
 * global-timer.js — Compte à rebours global de 12 minutes
 * ─────────────────────────────────────────────────────────────────────────
 * À inclure sur TOUTES les pages (hub, mini-jeux, login, win).
 *
 * - Démarre le compte à rebours dès le premier chargement.
 * - Persiste dans localStorage (survit aux changements de page).
 * - Affiche un badge flottant en haut à droite.
 * - Quand le temps est écoulé : overlay plein écran "TEMPS ÉCOULÉ".
 *
 * Personnalisation :
 *   Définir window.ARG_TIMER_HUB = 'index.html' avant d'inclure ce script
 *   sur les pages à la racine (hub, login, win). Par défaut : '../../index.html'.
 *   Définir window.ARG_TIMER_SKIP_EXPIRY = true pour ne pas afficher l'écran
 *   d'expiration (ex: win.html).
 * ─────────────────────────────────────────────────────────────────────────
 */
(function () {
  const DURATION    = 12 * 60; // 720 secondes
  const STORAGE_KEY = 'arg_challenge_start';

  /* ── Lire ou initialiser l'horodatage de départ ──────────────────────── */
  let startTime = parseInt(localStorage.getItem(STORAGE_KEY), 10);
  if (!startTime || isNaN(startTime)) {
    startTime = Date.now();
    localStorage.setItem(STORAGE_KEY, startTime);
  }

  /* ── Styles injectés ────────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    #arg-global-timer {
      position: fixed;
      top: 8px; right: 8px;
      z-index: 99997;
      background: rgba(0,0,0,0.88);
      border: 1px solid #e63946;
      color: #e63946;
      font-family: 'Courier New', Courier, monospace;
      font-size: .78rem;
      font-weight: bold;
      letter-spacing: .12em;
      padding: 4px 12px 4px 10px;
      border-radius: 2px;
      box-shadow: 0 0 12px rgba(230,57,70,.35);
      pointer-events: none;
      user-select: none;
      transition: border-color .3s, color .3s;
    }
    #arg-global-timer.warn {
      border-color: #ffcc00;
      color: #ffcc00;
      box-shadow: 0 0 12px rgba(255,204,0,.35);
    }
    #arg-global-timer.danger {
      border-color: #e63946;
      color: #e63946;
      box-shadow: 0 0 18px rgba(230,57,70,.6);
      animation: arg-timer-pulse .5s infinite alternate;
    }
    @keyframes arg-timer-pulse {
      from { opacity: 1; }
      to   { opacity: .4; }
    }

    #arg-timer-expired-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.97);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: 'Courier New', Courier, monospace;
      color: #e63946;
      text-align: center;
      animation: arg-exp-fadein .4s ease;
    }
    @keyframes arg-exp-fadein { from { opacity:0; } to { opacity:1; } }
    #arg-timer-expired-overlay .exp-box {
      border: 1px solid #e63946;
      padding: 2.5rem 3.5rem;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 0 40px rgba(230,57,70,.2);
      background: rgba(230,57,70,.04);
    }
    #arg-timer-expired-overlay .exp-label {
      font-size: .7rem; letter-spacing: .25em; color: #6b6b6b;
      margin-bottom: 1rem;
    }
    #arg-timer-expired-overlay .exp-title {
      font-size: 2.2rem; font-weight: bold;
      letter-spacing: .1em; margin-bottom: .6rem;
    }
    #arg-timer-expired-overlay .exp-desc {
      font-size: .85rem; color: #aaa; margin-bottom: 2rem;
      line-height: 1.6;
    }
    #arg-timer-expired-overlay .exp-btn {
      display: inline-block;
      padding: .55rem 1.6rem;
      border: 1px solid #e63946;
      color: #e63946;
      background: transparent;
      font-family: 'Courier New', Courier, monospace;
      font-size: .8rem;
      letter-spacing: .15em;
      text-decoration: none;
      cursor: pointer;
    }
    #arg-timer-expired-overlay .exp-btn:hover {
      background: rgba(230,57,70,.1);
    }
  `;
  document.head.appendChild(style);

  /* ── Badge de count-down ────────────────────────────────────────────── */
  const badge = document.createElement('div');
  badge.id = 'arg-global-timer';
  badge.textContent = '⏱ 12:00';

  function insertBadge() {
    if (!document.getElementById('arg-global-timer')) {
      document.body.appendChild(badge);
    }
  }

  /* ── Overlay expiration ──────────────────────────────────────────────── */
  function showExpired() {
    if (document.getElementById('arg-timer-expired-overlay')) return;

    // Chemin vers le hub
    const hubPath = window.ARG_TIMER_HUB || '../../index.html';

    const overlay = document.createElement('div');
    overlay.id = 'arg-timer-expired-overlay';
    overlay.innerHTML = `
      <div class="exp-box">
        <div class="exp-label">CHALLENGE-48H // ERREUR CRITIQUE</div>
        <div class="exp-title">⏱ TEMPS ÉCOULÉ</div>
        <div class="exp-desc">
          Le temps imparti de 12 minutes est dépassé.<br>
          La mission a échoué. Réinitialisez et recommencez.
        </div>
        <a id="arg-exp-restart" class="exp-btn" href="${hubPath}">↺ RECOMMENCER</a>
      </div>
    `;

    // Le bouton remet à zéro le timer
    overlay.querySelector('#arg-exp-restart').addEventListener('click', function () {
      localStorage.removeItem(STORAGE_KEY);
      // Réinitialiser aussi la progression de jeu
      try { localStorage.removeItem('arg_game_state'); } catch(e) {}
    });

    document.body.appendChild(overlay);
  }

  /* ── Boucle principale ───────────────────────────────────────────────── */
  function tick() {
    const elapsed    = Math.floor((Date.now() - startTime) / 1000);
    const remaining  = DURATION - elapsed;

    if (remaining <= 0) {
      badge.textContent = '⏱ 00:00';
      badge.classList.add('danger');
      // Ne pas afficher l'expiration si la page est explicitement exemptée
      if (!window.ARG_TIMER_SKIP_EXPIRY) {
        showExpired();
      }
      return; // Arrêter le tick
    }

    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    badge.textContent = `⏱ ${m}:${s}`;

    badge.classList.remove('warn', 'danger');
    if (remaining <= 60) {
      badge.classList.add('danger');
    } else if (remaining <= 120) {
      badge.classList.add('warn');
    }

    setTimeout(tick, 1000);
  }

  /* ── Démarrage ─────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      insertBadge();
      tick();
    });
  } else {
    insertBadge();
    tick();
  }
})();
