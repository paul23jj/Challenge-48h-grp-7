import { personnages } from './personnages.js';

localStorage.removeItem('selectedChar');

const grid = document.getElementById('char-grid');
const startBtn = document.getElementById('start-btn');
startBtn.disabled = true;
let selectedId = null;

personnages.forEach(perso => {
    const card = document.createElement('div');
    card.classList.add('char-card');
    card.setAttribute('data-id', perso.id);

    card.innerHTML = `
        <img src="${perso.img}" alt="${perso.name}">
        <h3>${perso.name}</h3>
        <p>${perso.desc}</p>
    `;

    card.addEventListener('click', () => {
        document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
        
        card.classList.add('selected');
        selectedId = perso.id;
        
        startBtn.disabled = false;
    });

    grid.appendChild(card);
});

startBtn.addEventListener('click', () => {
    localStorage.setItem('selectedChar', selectedId);
    window.location.href = "boxxle.html"; 
});

window.onpageshow = function(event) {
    if (event.persisted) {
        window.location.reload();
    }
};