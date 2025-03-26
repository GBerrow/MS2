// game-over.js

export function declareGameOver(message) {
    // Create a modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    
    // Create the modal content
    const modal = document.createElement('div');
    modal.className = 'game-over-modal';
    
    // Add the message
    const messageEl = document.createElement('h2');
    messageEl.textContent = message;
    
    // Add a restart button
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Play Again';
    restartButton.addEventListener('click', () => {
        window.location.reload();
    });
    
    // Assemble the modal
    modal.appendChild(messageEl);
    modal.appendChild(restartButton);
    overlay.appendChild(modal);
    
    // Add to the document
    document.body.appendChild(overlay);
    
    // Make sure it's visible
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
}
