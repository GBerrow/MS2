// move-history.js - Handles move history tracking, display, and undo functionality
import { boardState } from "../board/board-state.js";

// Define MESSAGE_PRIORITY constants locally to avoid import issues
const MESSAGE_PRIORITY = {
  DEFAULT: 0,
  DIFFICULTY: 1,
  POST_CHECK: 2,
  AI_THINKING: 3,
  CHECK: 4,
};

// Array to store move history
const moveHistory = [];
let moveCounter = 1;

const undoMarkers = []; // Track which moves were undone

/**
 * Initializes the move history and sets up event listeners
 */
export function initMoveHistory() {
  // Set up the undo button listener
  const undoButton = document.getElementById("undoButton");
  if (undoButton) {
    undoButton.removeEventListener("click", handleUndoButtonClick); // Remove any existing
    undoButton.addEventListener("click", handleUndoButtonClick);
    updateUndoButtonState(); // Initialize button state
  }

  // Clear the move history table
  clearMoveHistoryDisplay();
}

/**
 * Clears the move history display
 */
function clearMoveHistoryDisplay() {
  const moveHistoryBody = document.getElementById("moveHistoryBody");
  if (moveHistoryBody) {
    moveHistoryBody.innerHTML = "";
  }
  moveCounter = 1;
}

/**
 * Converts a move to algebraic notation
 * @param {Object} move - Move details (from, to, piece, capturedPiece)
 * @returns {string} - Move in algebraic notation
 */
function convertToAlgebraicNotation(move) {
  const { from, to, piece, capturedPiece } = move;
  const [pieceType, color] = piece.split("-");

  // Special case for castling
  if (pieceType === "king") {
    const fromFile = from.charCodeAt(0);
    const toFile = to.charCodeAt(0);
    const fileDistance = Math.abs(fromFile - toFile);

    if (fileDistance === 2) {
      // Kingside castling
      if (toFile > fromFile) {
        return "O-O";
      }
      // Queenside castling
      else {
        return "O-O-O";
      }
    }
  }

  // Start with piece letter (except for pawns)
  let notation = "";
  if (pieceType !== "pawn") {
    // Correct piece notation abbreviations
    switch (pieceType) {
      case "king":
        notation += "K";
        break;
      case "queen":
        notation += "Q";
        break;
      case "rook":
        notation += "R";
        break;
      case "bishop":
        notation += "B";
        break;
      case "knight":
        notation += "N";
        break; // Fixed! Knights use N, not K
      default:
        break;
    }
  }

  // Add capture symbol if applicable
  if (capturedPiece) {
    // For pawns, add the file when capturing
    if (pieceType === "pawn") {
      notation += from[0];
    }
    notation += "x";
  }

  // Add the destination square
  notation += to;

  // Check if the move results in check or checkmate
  if (
    boardState.inCheck &&
    boardState.inCheck[color === "white" ? "black" : "white"]
  ) {
    // We'd need to check if it's checkmate, but for now just add + for check
    notation += "+";
  }

  return notation;
}

/**
 * Records a move in the move history and updates the UI
 * @param {Object} move - Move details (from, to, piece, capturedPiece)
 */
export function recordMove(move) {
  // Get color of the moving piece
  const [pieceType, color] = move.piece.split("-");

  // Determine the correct move number to use
  let currentMoveNumber = moveCounter;

  // Check if we're recording a move after an undo
  const isAfterUndo = undoMarkers.length > 0;

  // Add move to history
  moveHistory.push({
    from: move.from,
    to: move.to,
    piece: move.piece,
    capturedPiece: move.capturedPiece,
    specialMove: move.specialMove,
    capturePosition: move.capturePosition,
    timestamp: Date.now(),
    moveNumber: currentMoveNumber,
    rookFrom: move.rookFrom,
    rookTo: move.rookTo,
    rookPiece: move.rookPiece,
    afterUndo: isAfterUndo,
  });

  // Generate appropriate algebraic notation
  let algebraicNotation;
  if (move.specialMove === "castling-kingside") {
    algebraicNotation = "O-O";
  } else if (move.specialMove === "castling-queenside") {
    algebraicNotation = "O-O-O";
  } else if (move.specialMove === "en-passant") {
    // For en passant, use format like "exd6 e.p."
    algebraicNotation = `${move.from[0]}x${move.to} e.p.`;
  } else {
    algebraicNotation = convertToAlgebraicNotation(move);
  }

  // Update the move history display
  updateMoveHistoryDisplay(algebraicNotation, color, currentMoveNumber, move);

  // Increment the move counter after a full move (both white and black)
  if (color === "black") {
    moveCounter++;
  }

  // Clear the undo markers array after recording a new move
  if (undoMarkers.length > 0) {
    undoMarkers.length = 0;
  }
}

/**
 * Updates the move history display in the UI with enhanced clarity
 * @param {string} notation - Move in algebraic notation
 * @param {string} color - Player color ('white' or 'black')
 * @param {number} moveNumber - The current move number
 * @param {Object} move - The complete move object
 */
function updateMoveHistoryDisplay(notation, color, moveNumber, move) {
  const moveHistoryBody = document.getElementById("moveHistoryBody");
  if (!moveHistoryBody) return;

  // Check if we need to create a new row after an undo
  const isAfterUndo = move.afterUndo;

  // Get or create a row for this move number
  let row = document.getElementById(`move-${moveNumber}`);

  // If the row exists and this is a move after undo, we need to create a new row
  if (row && isAfterUndo) {
    // Create a new row with the next move number
    const newMoveNumber = getNextAvailableMoveNumber(moveHistoryBody);
    row = document.createElement("tr");
    row.id = `move-${newMoveNumber}`;

    const moveNumberCell = document.createElement("td");
    moveNumberCell.textContent = newMoveNumber;
    row.appendChild(moveNumberCell);

    // Add cells for white and black moves
    const whiteCell = document.createElement("td");
    whiteCell.className = "white-move";
    row.appendChild(whiteCell);

    const blackCell = document.createElement("td");
    blackCell.className = "black-move";
    row.appendChild(blackCell);

    moveHistoryBody.appendChild(row);
  } else if (!row) {
    // Create a new row if it doesn't exist
    row = document.createElement("tr");
    row.id = `move-${moveNumber}`;

    const moveNumberCell = document.createElement("td");
    moveNumberCell.textContent = moveNumber;
    row.appendChild(moveNumberCell);

    // Add cells for white and black moves
    const whiteCell = document.createElement("td");
    whiteCell.className = "white-move";
    row.appendChild(whiteCell);

    const blackCell = document.createElement("td");
    blackCell.className = "black-move";
    row.appendChild(blackCell);

    moveHistoryBody.appendChild(row);
  }

  // Add the move notation to the appropriate cell
  const cell = row.querySelector(
    color === "white" ? ".white-move" : ".black-move"
  );
  if (cell) {
    const notationSpan = document.createElement("span");
    notationSpan.className = "move-notation";

    // Format notation for better clarity
    let formattedNotation = notation;

    // Add descriptive title/tooltip with explanation
    let explanation = getMoveExplanation(notation, move);
    notationSpan.title = explanation;

    // Style captures differently (bold red 'x')
    if (notation.includes("x")) {
      const parts = notation.split("x");
      formattedNotation = `${parts[0]}<span class="capture-x">×</span>${parts[1]}`;
      notationSpan.innerHTML = formattedNotation;
    } else {
      notationSpan.textContent = notation;
    }

    // Clear existing content and add the new notation
    cell.innerHTML = "";
    cell.appendChild(notationSpan);

    // Highlight all cells in the current row
    row.querySelectorAll("td").forEach((td) => {
      td.classList.add("highlight-recent");
    });

    // Remove highlights from previous moves
    setTimeout(() => {
      document
        .querySelectorAll("#moveHistoryTable .highlight-recent")
        .forEach((el) => {
          el.classList.remove("highlight-recent");
        });
    }, 1500);
  }
}

/**
 * Helper function to find the next available move number
 * @param {HTMLElement} moveHistoryBody - The move history table body
 * @returns {number} - The next available move number
 */
function getNextAvailableMoveNumber(moveHistoryBody) {
  // Get all existing move rows
  const rows = moveHistoryBody.querySelectorAll("tr");
  if (rows.length === 0) return 1;

  // Find the highest move number
  let highestMoveNumber = 0;
  rows.forEach((row) => {
    const idMatch = row.id.match(/move-(\d+)/);
    if (idMatch && idMatch[1]) {
      const moveNumber = parseInt(idMatch[1], 10);
      if (moveNumber > highestMoveNumber) {
        highestMoveNumber = moveNumber;
      }
    }
  });

  // Return the next available move number
  return highestMoveNumber + 1;
}

/**
 * Generates a human-readable explanation of a chess move in algebraic notation
 * @param {string} notation - Move in algebraic notation
 * @param {Object} move - The complete move object with from/to information
 * @returns {string} - Human-readable explanation of the move
 */
function getMoveExplanation(notation, move) {
  // If we don't have the complete move object, use basic explanation
  if (!move) {
    // Handle castling
    if (notation === "O-O") {
      return "King castled kingside";
    }
    if (notation === "O-O-O") {
      return "King castled queenside";
    }

    // Default format for other notations without move data
    return notation;
  }

  const { from, to, piece, specialMove } = move;
  const [pieceType, color] = piece.split("-");

  // Handle special moves
  if (specialMove === "castling-kingside") {
    return `${color.charAt(0).toUpperCase() + color.slice(1)} castled kingside`;
  }
  if (specialMove === "castling-queenside") {
    return `${
      color.charAt(0).toUpperCase() + color.slice(1)
    } castled queenside`;
  }
  if (specialMove === "en-passant") {
    return `${
      color.charAt(0).toUpperCase() + color.slice(1)
    } captured pawn en passant from ${from} to ${to}`;
  }

  // Determine if it's a capture
  const isCapture = move.capturedPiece ? true : false;

  // Create piece name with first letter capitalized
  const pieceName = pieceType.charAt(0).toUpperCase() + pieceType.slice(1);

  // Basic move explanation
  if (isCapture) {
    return `${pieceName} moved from ${from} to ${to} capturing ${
      move.capturedPiece.split("-")[0]
    }`;
  } else {
    return `${pieceName} moved from ${from} to ${to}`;
  }
}

/**
 * Gets the full move history
 * @returns {Array} Array of move objects
 */
export function getMoveHistory() {
  return [...moveHistory]; // Return a copy to prevent direct modification
}

/**
 * Undoes the last move
 * @returns {Boolean} True if a move was undone, false if no moves to undo
 */
export function undoLastMove() {
  if (moveHistory.length === 0) {
    return false;
  }

  // Get the last move
  const lastMove = moveHistory.pop(); // Remove the last move from history

  // Add to undo markers for UI tracking
  undoMarkers.push(lastMove);

  // Restore the piece to its original position
  boardState.pieces[lastMove.from] = lastMove.piece;

  // Handle special moves
  if (lastMove.specialMove) {
    // Handle castling
    if (lastMove.specialMove.includes("castling")) {
      // Delete king from destination
      delete boardState.pieces[lastMove.to];

      // Properly restore rook
      if (lastMove.rookFrom && lastMove.rookTo && lastMove.rookPiece) {
        // Return rook to original position
        boardState.pieces[lastMove.rookFrom] = lastMove.rookPiece;
        // Remove rook from castled position
        delete boardState.pieces[lastMove.rookTo];
      } else {
        // Fallback for legacy moves without rook data
        const [_, color] = lastMove.piece.split("-");
        const rank = color === "white" ? "1" : "8";
        const isKingside = lastMove.specialMove === "castling-kingside";

        // Original and new rook positions
        const oldRookFile = isKingside ? "h" : "a";
        const newRookFile = isKingside ? "f" : "d";

        // Restore rook
        boardState.pieces[oldRookFile + rank] = `rook-${color}`;
        delete boardState.pieces[newRookFile + rank];
      }
    }
    // Handle en passant separately
    else if (
      lastMove.specialMove === "en-passant" &&
      lastMove.capturePosition
    ) {
      // In en passant, the captured piece is not at the destination square
      // Restore captured pawn
      if (lastMove.capturedPiece) {
        boardState.pieces[lastMove.capturePosition] = lastMove.capturedPiece;

        // Remove from captured pieces list
        const capturedColor = lastMove.capturedPiece.split("-")[1];
        const capturedByColor = capturedColor === "white" ? "black" : "white";

        const index = boardState.capturedPieces[capturedByColor].indexOf(
          lastMove.capturedPiece
        );
        if (index !== -1) {
          boardState.capturedPieces[capturedByColor].splice(index, 1);
        }
      }

      // Delete the pawn from destination
      delete boardState.pieces[lastMove.to];
    }
  }
  // Handle regular captures
  else if (lastMove.capturedPiece) {
    boardState.pieces[lastMove.to] = lastMove.capturedPiece;

    // Remove from captured pieces list
    const capturedColor = lastMove.capturedPiece.split("-")[1];
    const capturedByColor = capturedColor === "white" ? "black" : "white";

    const index = boardState.capturedPieces[capturedByColor].indexOf(
      lastMove.capturedPiece
    );
    if (index !== -1) {
      boardState.capturedPieces[capturedByColor].splice(index, 1);
    }
  }
  // If no capture, just remove the piece from destination
  else {
    delete boardState.pieces[lastMove.to];
  }

  // Switch back the current player
  boardState.currentPlayer =
    boardState.currentPlayer === "white" ? "black" : "white";

  // Update the UI
  import("../board/board-ui.js").then((module) => {
    if (module.renderBoard) {
      module.renderBoard();
    }
  });

  // Update captured pieces display
  import("../ui/captured-pieces.js").then((module) => {
    if (module.updateCapturedPieces) {
      module.updateCapturedPieces();
    }
  });

  // Update the move history display to show undo markers
  const [_, color] = lastMove.piece.split("-");
  updateMoveHistoryDisplayAfterUndo(color, lastMove.moveNumber);

  // Play the undo sound
  import("../ui/sound-manager.js").then((module) => {
    if (module.playSound) {
      module.playSound("move");
    }
  });

  // Update check status
  import("./check-detection.js").then((module) => {
    if (module.checkForCheck) {
      module.checkForCheck();
    }
  });

  return true;
}

/**
 * Updates the move history display after an undo operation
 * @param {string} color - Player color of the move that was undone
 * @param {number} moveNumber - The move number that was undone
 */
function updateMoveHistoryDisplayAfterUndo(color, moveNumber) {
  const moveHistoryBody = document.getElementById("moveHistoryBody");
  if (!moveHistoryBody) return;

  // Find the row for this move number
  const row = document.getElementById(`move-${moveNumber}`);
  if (!row) return;

  // Get the cell corresponding to the color
  const cell = row.querySelector(
    color === "white" ? ".white-move" : ".black-move"
  );
  if (cell) {
    // Instead of clearing, mark as undone
    const undoSpan = document.createElement("span");
    undoSpan.className = "undo-marker";
    undoSpan.textContent = "UD";
    undoSpan.title = "Move was undone";

    // Clear existing content and add the undo marker
    cell.innerHTML = "";
    cell.appendChild(undoSpan);
  }

  // Highlight the row to indicate the undo action
  row.querySelectorAll("td").forEach((td) => {
    td.classList.add("highlight-recent");
  });

  // Remove highlights after a short delay
  setTimeout(() => {
    document
      .querySelectorAll("#moveHistoryTable .highlight-recent")
      .forEach((el) => {
        el.classList.remove("highlight-recent");
      });
  }, 1500);
}

/**
 * Unified message display function for all game notifications
 * @param {string} message - Message to display
 * @param {string} messageType - CSS class for styling the message (e.g., 'error-message', 'warning-message')
 * @param {number} duration - Duration in ms to show the message (0 for persistent messages)
 */
export function displayGameMessage(message, messageType, duration = 0) {
  // Map message types to priorities
  let priority = MESSAGE_PRIORITY.DEFAULT;

  if (messageType === "check-message") {
    priority = MESSAGE_PRIORITY.CHECK;
  } else if (messageType === "ai-thinking-message") {
    priority = MESSAGE_PRIORITY.AI_THINKING;
  } else if (messageType.includes("-message")) {
    priority = MESSAGE_PRIORITY.DIFFICULTY;
  }

  // Use the centralized message system
  import("../game-logic/message-manager.js")
    .then((module) => {
      if (module.displayMessage) {
        module.displayMessage(message, messageType, priority, duration);
      } else {
        console.log(
          "Message manager's displayMessage function not available, using fallback"
        );
        // Fallback to direct DOM manipulation if needed
        const messageElement = document.getElementById("game-status-message");
        if (messageElement) {
          messageElement.className = "game-status-message";
          if (messageType) {
            messageElement.classList.add(messageType);
          }
          messageElement.textContent = message;
        }
      }
    })
    .catch((error) => {
      console.log("Error using message manager:", error);
    });
}

/**
 * Displays a temporary undo-related message
 * @param {string} message - The message to display
 * @param {string} messageType - CSS class for styling the message
 */
function showUndoMessage(message, messageType) {
  // Remove any existing undo message container in move history
  const oldContainer = document.getElementById("undo-message-container");
  if (oldContainer && oldContainer.parentNode) {
    oldContainer.parentNode.removeChild(oldContainer);
  }

  // Display message in the unified game message area
  displayGameMessage(message, messageType, 3000); // Show for 3 seconds
}

// Update check message function
export function updateCheckMessage(isInCheck, attackingPiece = null) {
  import("./message-manager.js")
    .then((module) => {
      if (module.displayCheckMessage) {
        module.displayCheckMessage(isInCheck, attackingPiece);
      } else {
        // Fallback if message manager isn't available
        if (isInCheck) {
          const pieceType = attackingPiece
            ? attackingPiece.split("-")[0]
            : "piece";
          displayGameMessage(
            `Your king is in check by ${pieceType}!`,
            "check-message"
          );
          boardState.messageState = "check";
        }
      }
    })
    .catch((error) => {
      console.log("Error in updateCheckMessage:", error);
    });
}

// Shows post-check encouragement messages
let messagePriority = 0; // 0: none, 1: normal, 2: check, 3: post-check, 4: ai-thinking

// Simplify the showPostCheckMessage function
export function showPostCheckMessage() {
  import("../game-logic/message-manager.js")
    .then((module) => {
      if (module.displayPostCheckMessage) {
        module.displayPostCheckMessage();
      } else {
        // Fallback if message manager isn't available
        let messageText = "";
        let messageType = "";

        // Show different POST-CHECK messages based on difficulty
        switch (boardState.difficulty) {
          case "easy":
            messageText = "This should be a breeze...right? 😅";
            messageType = "easy-message";
            break;
          case "normal":
            messageText = "This could get interesting 👀";
            messageType = "normal-message";
            break;
          case "hard":
            messageText = "Had enough yet? 😈";
            messageType = "hard-message";
            break;
          default:
            messageText = "Nicely done escaping check!";
            messageType = "normal-message";
        }

        displayGameMessage(messageText, messageType, 5000);
        boardState.messageState = "post-check";
      }
    })
    .catch((error) => {
      console.log("Error in showPostCheckMessage:", error);
    });
}

// UpdateDifficultyMessage function to check message priority
export function updateDifficultyMessage(difficulty) {
  // Don't override check or AI thinking messages
  if (boardState.messageState !== "default") return;

  // If we're in post-check mode, show post-check message instead
  if (boardState.postCheckMode) {
    showPostCheckMessage();
    return;
  }

  let messageText = "";
  let messageType = "";

  // Set message based on difficulty
  switch (difficulty) {
    case "easy":
      messageText = "Nice and easy way to start off your day!";
      messageType = "easy-message";
      break;
    case "normal":
      messageText = "A balanced challenge awaits you!";
      messageType = "normal-message";
      break;
    case "hard":
      messageText = "Watch out, you're on hard difficulty now!";
      messageType = "hard-message";
      break;
    default:
      messageText = "Select a difficulty level to begin!";
  }

  // Use the existing displayGameMessage function
  displayGameMessage(messageText, messageType);

  // Also update the centralized message system if it's available
  import("./message-manager.js")
    .then((module) => {
      if (module.displayDifficultyMessage) {
        module.displayDifficultyMessage(difficulty);
      }
    })
    .catch((error) => {
      console.log("Message manager not yet available, using fallback");
    });
}

/**
 * Handle undo button click with difficulty-based restrictions and pair-wise undoing
 */
export function handleUndoButtonClick() {
  const { difficulty, aiEnabled, aiThinking } = boardState;

  // Block undo if AI is currently thinking
  if (aiThinking) {
    showUndoMessage("Cannot undo while AI is thinking", "error-message");
    return;
  }

  // Handle based on difficulty
  if (difficulty === "hard") {
    // Show message that undos are not allowed in hard mode
    showUndoMessage("No second chances on hard mode!", "error-message");
    return;
  }

  const remainingUndos = getRemainingUndos();

  if (difficulty === "normal" && remainingUndos <= 0) {
    // Show message that no more undos are available
    showUndoMessage("No more undos available in normal mode!", "error-message");
    return;
  }

  // Get move history to determine if we should do pair-wise undo
  const history = getMoveHistory();
  const needsPairWiseUndo =
    aiEnabled &&
    history.length >= 2 &&
    history[history.length - 1].piece.split("-")[1] === "black" &&
    history[history.length - 2].piece.split("-")[1] === "white";

  // First, increment the undo count if we're in normal mode
  if (difficulty === "normal") {
    boardState.undoCount++;
  }

  // Proceed with first undo
  if (undoLastMove()) {
    // If AI is enabled and last move was AI's, undo the player's previous move too
    if (needsPairWiseUndo) {
      undoLastMove();

      // Play additional sound for second undo
      import("../ui/sound-manager.js").then((module) => {
        if (module.playSound) {
          module.playSound("move");
        }
      });
    }

    // Always update the undo button state after undoing
    updateUndoButtonState();

    // Show appropriate message based on remaining undos
    if (difficulty === "normal") {
      const updatedRemainingUndos = getRemainingUndos();
      if (updatedRemainingUndos === 2) {
        showUndoMessage("Careful! Only 2 undos left.", "warning-message");
      } else if (updatedRemainingUndos === 1) {
        showUndoMessage("Last chance! Only 1 undo left.", "warning-message");
      } else if (updatedRemainingUndos === 0) {
        showUndoMessage("No more undos available!", "error-message");
      }
    } else if (difficulty === "easy") {
      showUndoMessage(
        "Move undone! Feel free to try different strategies.",
        "info-message"
      );
    }
  } else {
    // If undo failed for some reason, revert the undo count increment
    if (difficulty === "normal") {
      boardState.undoCount--;
    }
  }
}

/**
 * Updates the undo button text and state based on current difficulty and AI thinking status
 */
export function updateUndoButtonState() {
  const undoButton = document.getElementById("undoButton");
  if (!undoButton) return;

  const { difficulty, aiThinking } = boardState;

  // First check if AI is thinking - this takes precedence
  if (aiThinking) {
    undoButton.textContent = "Undo Move Disabled";
    undoButton.classList.add("disabled-button");
    undoButton.setAttribute("disabled", "disabled"); // Actually disable the button
    undoButton.title = "Undo is unavailable while AI is thinking";
    return; // Exit early - no need to check other conditions
  }

  // Remove the disabled attribute if it was previously set
  undoButton.removeAttribute("disabled");

  // Button text and state based on difficulty
  if (difficulty === "hard") {
    undoButton.textContent = "Undo Disabled";
    undoButton.classList.add("disabled-button");
    undoButton.title = "No second chances on hard mode!";
  } else if (difficulty === "normal") {
    const remaining = getRemainingUndos();
    undoButton.textContent = "Undo Last Move";
    undoButton.classList.remove("disabled-button");
    undoButton.title =
      remaining > 0
        ? `You have ${remaining} undos remaining`
        : "No more undos available";
  } else {
    // 'easy'
    undoButton.textContent = "Undo Last Move";
    undoButton.classList.remove("disabled-button");
    undoButton.title = "Unlimited undos available in easy mode";
  }

  // Update the separate undo count indicator in the move history panel
  updateUndoCountIndicator();
}

/**
 * Creates or updates the undo count indicator in the move history panel
 */
function updateUndoCountIndicator() {
  const moveHistoryContainer = document.querySelector(
    ".move-history-container"
  );
  if (!moveHistoryContainer) return;

  // Get the remaining undos
  const { difficulty } = boardState;
  const remaining = getRemainingUndos();

  // Look for existing undo count indicator
  let undoIndicator = document.getElementById("undo-count-indicator");

  if (!undoIndicator) {
    // Create the indicator if it doesn't exist
    undoIndicator = document.createElement("div");
    undoIndicator.id = "undo-count-indicator";
    undoIndicator.className = "undo-count-indicator";

    // Position it between the game status message and the move history table
    const statusMessage = document.getElementById("game-status-message");
    const table = moveHistoryContainer.querySelector("#moveHistoryTable");

    if (statusMessage && statusMessage.parentNode) {
      statusMessage.parentNode.insertBefore(
        undoIndicator,
        statusMessage.nextSibling
      );
    } else if (table) {
      moveHistoryContainer.insertBefore(undoIndicator, table);
    } else {
      moveHistoryContainer.appendChild(undoIndicator);
    }
  }

  // Update the indicator content based on difficulty
  if (difficulty === "hard") {
    undoIndicator.textContent = "Undos: Disabled in Hard Mode";
    undoIndicator.className = "undo-count-indicator hard-mode";
  } else if (difficulty === "normal") {
    undoIndicator.textContent = `Undos Remaining: ${remaining}`;
    undoIndicator.className = "undo-count-indicator normal-mode";
  } else {
    // 'easy'
    undoIndicator.textContent = "Undos: Unlimited";
    undoIndicator.className = "undo-count-indicator easy-mode";
  }
}

/**
 * Gets the number of remaining undos based on difficulty
 */
function getRemainingUndos() {
  if (boardState.difficulty === "easy") {
    return Infinity; // Unlimited undos
  } else if (boardState.difficulty === "hard") {
    return 0; // No undos allowed
  } else {
    return Math.max(0, 3 - boardState.undoCount); // Normal difficulty: 3 undos
  }
}

/**
 * Resets the move history
 */
export function resetMoveHistory() {
  // Clear the move history array
  moveHistory.length = 0;
  moveCounter = 1;

  // Reset undo count
  boardState.undoCount = 0;

  // Reset post-check mode
  boardState.postCheckMode = false;

  // Update the undo button
  updateUndoButtonState();

  // Clear the display
  clearMoveHistoryDisplay();

  // Remove any standalone message containers that might be in the move history
  const moveHistoryContainer = document.querySelector(
    ".move-history-container"
  );
  if (moveHistoryContainer) {
    const oldContainer = moveHistoryContainer.querySelector(
      "#undo-message-container"
    );
    if (oldContainer) {
      moveHistoryContainer.removeChild(oldContainer);
    }
  }

  // Reset message state
  resetMessageState();

  console.log("Move history reset");
}

/**
 * Adds this function to move-history.js
 */
export function setMessagePriority(priority) {
  messagePriority = priority;
}

// Variable to track if we're showing a post-check message
let showingPostCheckMessage = false;

// Reset the post-check state on game restart
export function resetMessageState() {
  showingPostCheckMessage = false;
}
