# Challenge 48h — Hub de mini-jeux

Quatre mini-jeux à compléter dans l'ordre. Chaque jeu débloque le suivant et révèle un fragment de la phrase secrète. Il faut lancer un go live server sur le index.html pour l'accès aux mini-jeux

---

## Mini-jeux

### 01 — SNAKE.EXE

Jeu de snake classique. Le joueur contrôle un serpent et doit manger 10 pommes avant la fin du compte à rebours.  
Trois vies disponibles. En cas de collision avec le mur ou lui-même, le joueur perd une vie.

---

### 02 — Boxxle

Jeu de type Sokoban en 5 niveaux. Le joueur pousse des caisses sur des cibles.  
Les 5 niveaux doivent être complétés dans l'ordre pour terminer le jeu.

---

### 03 — Séquence d'Urgence

Jeu de précision temporelle. Le joueur doit appuyer sur un bouton exactement à 10.00 secondes.  
Trois essais disponibles.

---

### 04 — Signal Fantôme

Jeu ARG composé de trois énigmes enchaînées.

1. **ROT13** — Déchiffrer un message encodé en ROT13.
2. **Morse / GPS** — Décoder des coordonnées transmises en morse.
3. **Vigenère** — Déchiffrer un texte chiffré dont la clé est dissimulée dans un document.

---

## Phrase secrète

Une fois les quatre jeux terminés, les quatre mots débloqués forment les identifiants à entrer sur la page de login.

---

## Contraintes

- Les jeux se déverrouillent dans l'ordre. Il est impossible d'accéder au jeu suivant sans avoir terminé le précédent.
- Un compte à rebours global de **12 minutes** s'applique à l'ensemble du challenge. Passé ce délai, la session est terminée et la progression est réinitialisée.
- La page de victoire est inaccessible tant que les quatre jeux ne sont pas terminés.

---

## Stack technique

Vanilla JS / HTML5 / CSS3 — aucune dépendance externe.
