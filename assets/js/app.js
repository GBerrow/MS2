// app.js
import { initializeBoard } from './board/board-setup.js';
import { setupEventListeners } from './ui/event-handlers.js';

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the board
    initializeBoard();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log("Chess game initialized");
});

