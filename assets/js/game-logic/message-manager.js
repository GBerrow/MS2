// message-manager.js - Centralized message management system
import { boardState } from '../board/board-state.js';

export const messageManagerLoaded = true;

// Message priority levels (higher number = higher priority)
const MESSAGE_PRIORITY = {
    DEFAULT: 0,
    DIFFICULTY: 1,
    POST_CHECK: 2,
    AI_THINKING: 3,
    CHECK: 4
};

// Track current message and its priority
let currentMessagePriority = 0;
let messageTimeoutId = null;

const handleError = (error) => {
    console.error("Message manager error:", error);
};

/**
 * Display a game message with priority handling
 * @param {string} message - The message to display
 * @param {string} messageType - CSS class for styling
 * @param {number} priority - Message priority level
 * @param {number} duration - Optional duration in ms (0 for persistent)
 */
export function displayMessage(message, messageType, priority, duration = 0) {
    try {
        // Only update if new message has equal or higher priority
        if (priority < currentMessagePriority) {
            console.log(`Message "${message}" ignored due to lower priority: ${priority} < ${currentMessagePriority}`);
            return;
        }
        
        // Update current priority
        currentMessagePriority = priority;
        
        // Clear any existing timeout
        if (messageTimeoutId) {
            clearTimeout(messageTimeoutId);
            messageTimeoutId = null;
        }
        
        // Get or create message element
        const messageElement = getOrCreateMessageElement();
        
        // Update message
        messageElement.className = 'game-status-message';
        if (messageType) {
            messageElement.classList.add(messageType);
        }
        messageElement.textContent = message;
        
        // Set timeout if duration is specified
        if (duration > 0) {
            messageTimeoutId = setTimeout(() => {
                currentMessagePriority = 0;
                restoreDefaultMessage();
            }, duration);
        }
        
        // Store message state in boardState
        boardState.activeMessage = {
            text: message,
            type: messageType,
            priority: priority
        };
    } catch (error) {
        handleError(error);
    }
}

/**
 * Get or create the message element
 * @returns {HTMLElement} The message element
 */
function getOrCreateMessageElement() {
    let messageElement = document.getElementById('game-status-message');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'game-status-message';
        messageElement.className = 'game-status-message';
        
        const moveHistoryContainer = document.querySelector('.move-history-container');
        if (moveHistoryContainer) {
            const table = moveHistoryContainer.querySelector('#moveHistoryTable');
            if (table) {
                moveHistoryContainer.insertBefore(messageElement, table);
            } else {
                moveHistoryContainer.appendChild(messageElement);
            }
        } else {
            document.body.appendChild(messageElement);
        }
    }
    return messageElement;
}

/**
 * Display difficulty message
 * @param {string} difficulty - The difficulty level
 */
export function displayDifficultyMessage(difficulty) {
    try {
        // If we're in post-check mode, show post-check message instead
        if (boardState.postCheckMode) {
            displayPostCheckMessage();
            return;
        }
        
        let messageText = "";
        let messageType = "";
        
        switch(difficulty) {
            case 'easy':
                messageText = "Nice and easy way to start off your day!";
                messageType = "easy-message";
                break;
            case 'normal':
                messageText = "A balanced challenge awaits you!";
                messageType = "normal-message";
                break;
            case 'hard':
                messageText = "Watch out, you're on hard difficulty now!";
                messageType = "hard-message";
                break;
            default:
                messageText = "Select a difficulty level to begin!";
        }
        
        displayMessage(messageText, messageType, MESSAGE_PRIORITY.DIFFICULTY);
    } catch (error) {
        handleError(error);
    }
}

/**
 * Display check message
 * @param {boolean} isInCheck - Whether the player is in check
 * @param {string} attackingPiece - The piece putting the king in check
 */
export function displayCheckMessage(isInCheck, attackingPiece = null) {
    try {
        if (isInCheck) {
            const pieceType = attackingPiece ? attackingPiece.split('-')[0] : 'piece';
            displayMessage(`Your king is in check by ${pieceType}!`, 'check-message', MESSAGE_PRIORITY.CHECK);
            boardState.messageState = 'check';
        } else {
            // If leaving check state, RESET the priority 
            currentMessagePriority = 0;
            
            // BUT don't show post-check message yet - it will be shown after AI's move
            if (boardState.messageState === 'check') {
                boardState.messageState = 'default'; // Just reset the state for now
            }
        }
    } catch (error) {
        handleError(error);
    }
}

/**
 * Display AI thinking message
 * @param {boolean} isThinking - Whether AI is thinking
 */
export function displayAiThinkingMessage(isThinking) {
    try {
        if (isThinking) {
            // In check state, don't show AI thinking message
            if (boardState.inCheck.white) {
                console.log("Not showing AI thinking message due to king in check");
                return;
            }
            
            // In post-check, we can show thinking message but should return to post-check after
            const inPostCheck = boardState.messageState === 'post-check';
            
            // Show the thinking message
            displayMessage("AI is thinking...", "ai-thinking-message", MESSAGE_PRIORITY.AI_THINKING);
            boardState.messageState = 'ai-thinking';
            
            // Remember we were in post-check if applicable
            if (inPostCheck) {
                boardState.wasInPostCheck = true;
            }
        } else {
            // Only clear if we're currently showing AI thinking message
            if (boardState.messageState === 'ai-thinking') {
                currentMessagePriority = 0; // Reset priority
                
                // If we were in post-check before AI started thinking, go back to that
                if (boardState.wasInPostCheck) {
                    boardState.messageState = 'post-check';
                    boardState.wasInPostCheck = false;
                    displayPostCheckMessage();
                } else {
                    // Otherwise go to default
                    boardState.messageState = 'default';
                    displayDifficultyMessage(boardState.difficulty);
                }
            }
        }
    } catch (error) {
        handleError(error);
    }
}

/**
 * Display post-check message
 */
export function displayPostCheckMessage() {
    try {
        let messageText = "";
        let messageType = "";
        
        // Show different POST-CHECK messages based on difficulty
        switch(boardState.difficulty) {
            case 'easy':
                messageText = "This should be a breeze...right? 😅";
                messageType = "easy-message";
                break;
            case 'normal':
                messageText = "This could get interesting 👀";
                messageType = "normal-message";
                break;
            case 'hard':
                messageText = "Had enough yet? 😈";
                messageType = "hard-message";
                break;
            default:
                messageText = "Nicely done escaping check!";
                messageType = "normal-message";
        }
        
        // No timeout for post-check message - it should stay until end game
        displayMessage(messageText, messageType, MESSAGE_PRIORITY.POST_CHECK);
        boardState.messageState = 'post-check';
    } catch (error) {
        handleError(error);
    }
}

/**
 * Restore the default message based on game state
 */
export function restoreDefaultMessage() {
    try {
        if (boardState.inCheck && boardState.inCheck.white) {
            // If king is in check, show check message
            const attackingPiece = findAttackingPiece();
            displayCheckMessage(true, attackingPiece);
        } else if (boardState.aiThinking) {
            // If AI is thinking, show thinking message
            displayAiThinkingMessage(true);
        } else if (boardState.postCheckMode) {
            // If in post-check mode, show post-check message
            displayPostCheckMessage();
        } else {
            // Otherwise show difficulty message
            boardState.messageState = 'default';
            displayDifficultyMessage(boardState.difficulty);
        }
    } catch (error) {
        handleError(error);
    }
}

/**
 * Find the piece attacking the king (helper function)
 * @returns {string|null} The attacking piece or null
 */
function findAttackingPiece() {
    // This is a simplified placeholder - you would need to implement
    // the actual logic to find which piece is attacking the king
    return null;
}

/**
 * Reset message system
 */
export function resetMessageSystem() {
    currentMessagePriority = 0;
    if (messageTimeoutId) {
        clearTimeout(messageTimeoutId);
        messageTimeoutId = null;
    }
    boardState.messageState = 'default';
    boardState.postCheckMode = false; // Explicitly reset post-check mode
    boardState.escapedCheck = false;  // Reset escaped check flag
    displayDifficultyMessage(boardState.difficulty);
}

// Export priority constants
export { MESSAGE_PRIORITY };

export function isMessageManagerLoaded() {
    return true;
}

/**
 * Reset current message priority
 */
export function resetMessagePriority() {
    try {
        currentMessagePriority = 0;
        console.log("Message priority reset to 0");
    } catch (error) {
        handleError(error);
    }
}

/**
 * Forcefully update the current active message
 * @param {string} messageType - Type of message to show
 */
export function forceUpdateActiveMessage(messageType) {
    try {
        // Reset priority
        currentMessagePriority = 0;
        
        // Show appropriate message based on type
        switch(messageType) {
            case 'difficulty':
                displayDifficultyMessage(boardState.difficulty);
                break;
            case 'post-check':
                displayPostCheckMessage();
                break;
            case 'ai-thinking':
                displayAiThinkingMessage(true);
                break;
            default:
                displayDifficultyMessage(boardState.difficulty);
        }
    } catch (error) {
        handleError(error);
    }
}