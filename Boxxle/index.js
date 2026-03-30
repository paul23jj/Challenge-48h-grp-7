const GRID_WIDTH = 50;
const GRID_HEIGHT = 25;
const fps = 10
const keys = {
    37: 'left',
    39: 'right',
    38: 'up',
    40: 'down'
}

import { Levels } from './level.js'; // Import the level array data from level.js

const levelHints = [
    "Pousse d'abord la caisse du bas vers la cible du fond pour ne pas bloquer le couloir.",
    "Remplis les cibles du haut en premier en faisant le tour par le grand espace vide.",
    "Pousse les caisses une par une vers la droite. Ne les colle pas l'une contre l'autre.",
    "Pousse une caisse à gauche et l'autre à droite pour garder le passage central libre.",
    "Pousse une caisse vers l'extérieur pour sortir du milieu, puis fais le tour par les couloirs."
];

let levelIndex = 0; // The index of the level to load
const selectedId = localStorage.getItem('selectedChar') || 'chevalier';
document.getElementById('gameboard').classList.add(`player-is-${selectedId}`);
let selectedLevel = Levels[levelIndex].map(row => [...row]); // Create a deep copy of the selected level to avoid modifying the original data
let initialLevel = selectedLevel.map(row => [...row]); // Create a deep copy of the selected level to reset later
const gameboard = document.getElementById('gameboard'); // Select the gameboard element from the HTML
let resetCount = 0; 
const hintBtn = document.getElementById('hintBtn');
const REQUIRED_RESETS = 6;

function showModal(title, message) {
    const modal = document.getElementById('customAlert');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    modal.style.display = 'block';

    document.getElementById('modalClose').onclick = function() {
        modal.style.display = 'none';
    };
}


const hasPlayer = selectedLevel.some(row => row.includes(3) || row.includes(5)); // Check if the selected level contains a player (3) or a player on goal (5)
if (!hasPlayer) { // Check if there is a player in the selected level
    showModal("Erreur", "Aucun joueur trouvé dans ce niveau !");
    if (levelIndex < Levels.length - 1) {
        showModal("Chargement", "Chargement du niveau suivant...");
        selectedLevel = Levels[levelIndex+1]; // Load the next level if available
    } else {
        showModal("Aucun niveau disponible", "Réinitialisation vers le premier niveau.");
        selectedLevel = Levels[0]; // Reset to the first level if no player is found and all levels are exhausted
    }
}

const nbRows = selectedLevel.length;
const nbCollumns = selectedLevel[0].length;
gameboard.style.gridTemplateRows = `repeat(${nbRows}, 1fr)`;
gameboard.style.gridTemplateColumns = `repeat(${nbCollumns}, 1fr)`;

const draw = () => {
    gameboard.innerHTML = ''; // Clear the gameboard to make sure there is no duplicate content
    selectedLevel.forEach((row, rowIndex) => { // Iterate through each row of the selected level
        row.forEach((cell, cellIndex) => { // Iterate through each cell in the row
            const div = document.createElement('div'); // Create a new div for each cell
            div.classList.add('cell'); // Add a class to the div for styling

            div.style.gridRowStart = rowIndex + 1; // Set the row start position
            div.style.gridColumnStart = cellIndex + 1; // Set the column start position

            switch (cell) {
                case 0 : div.classList.add('cell-empty'); break; // Empty cell
                case 1 : div.classList.add('cell-wall'); break; // Wall cell
                case 2 : div.classList.add('cell-box'); break; // Box cell
                case 3 : div.classList.add('cell-player'); break; // Player cell
                case 4 : div.classList.add('cell-goal'); break; // Goal cell
                case 5 : div.classList.add('cell-goal', 'cell-player'); break; // Goal with player cell
                case 6 : div.classList.add('cell-goal', 'cell-box'); break; // Goal with box cell
            }

            gameboard.appendChild(div); // Append the div to the gameboard
        });
    });
    requestAnimationFrame(draw); // Call draw again for the next frame
}

document.addEventListener('keydown', handleKeyDown); // Add an event listener for keydown events

function handleKeyDown(event) { // Function to handle keydown events
    event.preventDefault(); // Prevent default action to avoid scrolling or other browser behaviors

    let playerPosition = null; // Variable to store the player's position when the key is pressed
    selectedLevel.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            if (cell === 3 || cell === 5) {  // Check if the cell is a player (3) or a player on goal (5)
                playerPosition = [rowIndex, cellIndex]; // Store the player's position
            }
        });
    });

    if (!playerPosition) return; // If no player position is found, the function exits

    let directions; // Variable to store the direction based on the key pressed
    switch (event.keyCode) { // Switch statement to determine the direction based on the key pressed
        case 37: directions = [0, -1]; break; // Left arrow key
        case 38: directions = [-1, 0]; break; // Up arrow key
        case 39: directions = [0, 1]; break; // Right arrow key
        case 40: directions = [1, 0]; break; // Down arrow key
        default: return;
    }

    const [posY, posX] = playerPosition; // Affectation of the player's position to posY and posX
    const [dirY, dirX] = directions; // Affectation of the direction to dirY and dirX
    const newY = posY + dirY; // Calculate the new Y position based on the direction
    const newX = posX + dirX; // Calculate the new X position based on the direction
    const nextCell = selectedLevel[newY]?.[newX]; // Get the next cell based on the new position, using optional chaining to avoid errors if out of bounds

    if (nextCell === undefined || nextCell === 1) return; // If the next cell is undefined (out of bounds) or a wall (1), exit the function

    if (nextCell === 0 || nextCell === 4) { // If the next cell is empty (0) or a goal (4)
        selectedLevel[posY][posX] = (selectedLevel[posY][posX] === 5) ? 4 : 0; // Reset the current player's position to empty (0) or goal (4) if it was on a goal
        selectedLevel[newY][newX] = (nextCell === 4) ? 5 : 3; // Move the player to the new position, setting it to player on goal (5) if it was on a goal, or just player (3) otherwise
        return;
    }

    if (nextCell === 2 || nextCell === 6) { // If the next cell is a box (2) or a box on goal (6)
        const boxNewY = newY + dirY; // Calculate the new Y position for the box based on the direction
        const boxNewX = newX + dirX; // Calculate the new X position for the box based on the direction
        const boxNextCell = selectedLevel[boxNewY]?.[boxNewX]; // Get the next cell for the box

        if (boxNextCell === 0 || boxNextCell === 4) {
            selectedLevel[boxNewY][boxNewX] = (boxNextCell === 4) ? 6 : 2; // Move the box to the new position, setting it to box on goal (6) if it was on a goal, or just box (2) otherwise
            selectedLevel[newY][newX] = (nextCell === 6) ? 5 : 3; // Move the player to the new position, setting it to player on goal (5) if it was on a goal, or just player (3) otherwise
            selectedLevel[posY][posX] = (selectedLevel[posY][posX] === 5) ? 4 : 0; // Reset the current player's position to empty (0) or goal (4) if it was on a goal
        }
    }

    if (checkVictory()) { // Check if the player has completed the level
        if (levelIndex < Levels.length - 1) {
            showModal("Bravo !", "Chargement du niveau suivant...");
            loadLevel(levelIndex + 1); // Load the next level if available
        }else {
            showModal("Félicitations !", "Le code est : 26"); // Reset to the first level if no more levels are available
        }
    }
}

document.getElementById('resetBtn').addEventListener('click', () => {
    resetCount++;
    
    if (resetCount >= REQUIRED_RESETS) {
        hintBtn.disabled = false;
    }

    loadLevel(levelIndex, true); 
});

hintBtn.addEventListener('click', () => {
    const currentHint = levelHints[levelIndex] || "Pas d'indice pour ce niveau !";
    showModal("Indice", currentHint);
    resetCount = 0;
    hintBtn.disabled = true;
});

function checkVictory() { // Function to check if the player has completed the level
    for (let rowIndex = 0; rowIndex < selectedLevel.length; rowIndex++) { // Iterate through each row of the selected level
        for (let cellIndex = 0; cellIndex < selectedLevel[rowIndex].length; cellIndex++) { // Iterate through each cell in the row
            if (initialLevel[rowIndex][cellIndex] === 4 && selectedLevel[rowIndex][cellIndex] !== 6) { // If the initial level had a goal (4) and the current level does not have a box on that goal (6)
                return false;
            }
        }
    }
    return true;
}

function loadLevel(index, isReset = false) { // Function to load a level based on the index
    levelIndex = index;
    if (!isReset) {
        resetCount = 0;
        hintBtn.disabled = true;
    }
    selectedLevel = Levels[levelIndex].map(row => [...row]);
    initialLevel = Levels[levelIndex].map(row => [...row]);
}

draw(); // Initial draw call to render the gameboard