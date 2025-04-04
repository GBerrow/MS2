// app.js
import { initializeBoard } from './board/board-setup.js';
import { setupEventListeners } from './ui/event-handlers.js';
import { initializeTurnManager } from './game-logic/turn-manager.js';
import { boardState } from './board/board-state.js';
import { initSoundManager } from './ui/sound-manager.js';
import { initMoveHistory, updateDifficultyMessage } from './game-logic/move-history.js';

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set AI enabled by default
    boardState.aiEnabled = true;
    boardState.difficulty = 'normal'; // Default difficulty
    
    // Initialize the board
    initializeBoard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize turn manager (which sets up Stockfish)
    initializeTurnManager();
    
    // Initialize sound manager
    initSoundManager();

    // Initialize move history
    initMoveHistory();
    
    // Initialize difficulty message
    updateDifficultyMessage('normal');
    
    // Set normal button as active by default
    const normalButton = document.getElementById('normal-mode');
    if (normalButton) {
        normalButton.classList.add('active-difficulty');
    }
    
    console.log("Chess game initialized");
});
