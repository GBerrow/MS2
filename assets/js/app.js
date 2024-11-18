/* ==============================================
   1. Game Initialization and Board Structure
================================================= */
// In this section, we initialize the Stockfish engine and handle AI vs player interactions While also setting up the board structure.

// Initialize Stockfish Worker using the JavaScript file for AI chess engine
const stockfish = new Worker("assets/js/stockfish-16.1-lite-single.js");

// Handle responses from Stockfish engine and process its moves
stockfish.onmessage = function (event) {
  // Check if the response contains a best move command
  const bestMoveMatch = event.data.match(/bestmove\s([a-h][1-8][a-h][1-8])/);
  if (bestMoveMatch) {
    const bestMove = bestMoveMatch[1];
    // console.log(`Stockfish's best move: ${bestMove}`);
    makeAIMove(bestMove); // Execute the AI's chosen move on the board
  } else {
    // Handle other types of Stockfish messages
    if (event.data.includes("mate") || event.data.includes("game over")) {
      //    console.log("Stockfish analysis:", event.data);
    } else {
      // Commented out detailed Stockfish analysis logs (depth, nodes, etc.)
      // console.log("Stockfish analysis:", event.data);
    }
  }
};

// Utility function to send commands directly to the Stockfish engine
function sendToStockfish(command) {
  stockfish.postMessage(command);
}

// Audio elements for different chess move sound effects
const moveSound = new Audio("./assets/sound/move.mp3");
const captureSound = new Audio("./assets/sound/capture.mp3");
const checkSound = new Audio("./assets/sound/check.mp3");
const castleSound = new Audio("./assets/sound/castle.mp3");
const promotionSound = new Audio("./assets/sound/promotion.mp3");

// Track the mute state of game sounds
let isMuted = false;

// Toggle sound effects on/off and update the mute button display
function toggleSound() {
  isMuted = !isMuted;
  const muteButton = document.getElementById("muteButton");
  muteButton.textContent = isMuted ? "🔇" : "🔊";
  // Apply mute setting to all game sound effects
  [moveSound, captureSound, checkSound, castleSound, promotionSound].forEach(
    (sound) => {
      sound.muted = isMuted;
    }
  );
}

// Initial configuration of chess pieces on the board
const initialBoardSetup = {
  // Black pieces back rank
  a8: "rook-black",
  b8: "knight-black",
  c8: "bishop-black",
  d8: "queen-black",
  e8: "king-black",
  f8: "bishop-black",
  g8: "knight-black",
  h8: "rook-black",
  // Black pawns
  a7: "pawn-black",
  b7: "pawn-black",
  c7: "pawn-black",
  d7: "pawn-black",
  e7: "pawn-black",
  f7: "pawn-black",
  g7: "pawn-black",
  h7: "pawn-black",
  // White pieces back rank
  a1: "rook-white",
  b1: "knight-white",
  c1: "bishop-white",
  d1: "queen-white",
  e1: "king-white",
  f1: "bishop-white",
  g1: "knight-white",
  h1: "rook-white",
  // White pawns
  a2: "pawn-white",
  b2: "pawn-white",
  c2: "pawn-white",
  d2: "pawn-white",
  e2: "pawn-white",
  f2: "pawn-white",
  g2: "pawn-white",
  h2: "pawn-white",
};

// Set up the initial chess board state with pieces and square colors
function initializeBoard() {
  console.log("Initializing board..."); // Debug log
  let isLightSquare;

  // Remove all pieces from the board
  clearBoard();

  // Place all pieces according to the initial setup
  for (const [squareId, piece] of Object.entries(initialBoardSetup)) {
    const square = document.getElementById(squareId);
    const img = document.createElement("img");
    img.src = `assets/images/chess-pieces/${piece}.png`;
    img.classList.add("piece");
    img.setAttribute("data-piece", piece);
    img.setAttribute("data-color", piece.split("-")[1]);
    square.appendChild(img);
  }

  // Apply dynamic color scheme to board squares
  const squares = document.querySelectorAll(".square");
  squares.forEach((square, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;

    // Determine square color using alternating pattern
    isLightSquare = row % 2 === col % 2;

    // Calculate dynamic HSL color values for visual depth
    const hue = 30; // Brown base color
    const saturation = isLightSquare ? 30 : 40;
    const lightness = isLightSquare ? 80 - (row + col) : 40 - (row + col) / 2;

    square.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  });

  // Reset captured pieces displays
  document.getElementById("whiteCaptured").innerHTML = "";
  document.getElementById("blackCaptured").innerHTML = "";
}

// Convert current board position to FEN notation for Stockfish analysis
function boardToFEN() {
  let fen = "";
  // Iterate through ranks from top to bottom
  for (let rank = 8; rank >= 1; rank--) {
    let emptyCount = 0;
    // Iterate through files from left to right
    for (let file of "abcdefgh") {
      const square = document.getElementById(`${file}${rank}`);
      const piece = square?.querySelector(".piece");
      if (!piece) {
        emptyCount++;
        continue;
      }
      // Convert piece positions to FEN notation
      if (emptyCount > 0) {
        fen += emptyCount;
        emptyCount = 0;
      }
      const pieceData = piece.getAttribute("data-piece");
      if (pieceData) {
        const [type, color] = pieceData.split("-");
        fen +=
          color === "white" ? type[0].toUpperCase() : type[0].toLowerCase();
      }
    }
    if (emptyCount > 0) fen += emptyCount;
    if (rank > 1) fen += "/";
  }
  // Add additional FEN information (active color, castling, en passant, halfmove, fullmove)
  return `${fen} ${currentPlayer === "white" ? "w" : "b"} - - 0 1`;
}

// Remove all pieces from the chess board
function clearBoard() {
  document.querySelectorAll(".square").forEach((square) => {
    const piece = square.querySelector(".piece");
    if (piece) {
      square.removeChild(piece);
    }
  });
}

// Reset the chess board to starting position
function resetBoardToInitialState() {
  clearBoard();
  for (const [squareId, piece] of Object.entries(initialBoardSetup)) {
    const square = document.getElementById(squareId);
    const img = document.createElement("img");
    img.src = `assets/images/chess-pieces/${piece}.png`;
    img.classList.add("piece");
    img.setAttribute("data-piece", piece);
    img.setAttribute("data-color", piece.split("-")[1]);
    square.appendChild(img);
  }
}

// Track castling status for both players
let whiteCastled = false;
let blackCastled = false;

/* ================================
   2. Piece Classes & Movement Logic
================================ */

// Create a new chess piece element with specified type and color
function createPieceElement(pieceType, playerColor) {
  const pieceElement = document.createElement("div");
  pieceElement.className = `piece ${pieceType}-${playerColor}`;
  pieceElement.setAttribute("data-piece", `${pieceType}-${playerColor}`);
  pieceElement.style.backgroundImage = `url('assets/images/chess-pieces/${pieceType}-${playerColor}.png')`;
  return pieceElement;
}

// Locate the position of a specific colored king on the board
function findKing(color) {
  if (!color) {
    console.error("King color is undefined when calling findKing.");
    return null;
  }

  const king = document.querySelector(`.piece[data-piece="king-${color}"]`);
  if (king) {
    return king.parentElement.id;
  }

  console.error(`King not found for ${color}`);
  return null;
}

// Calculate all legal moves available to a king
function getKingPossibleMoves(kingPosition, playerColor) {
  const possibleMoves = [];
  const adjacentSquares = getAdjacentSquares(kingPosition); // Get surrounding squares

  // Check each adjacent square for valid moves
  for (let square of adjacentSquares) {
    if (isKingMoveSafe(kingPosition, square, playerColor)) {
      possibleMoves.push(square);
    }
  }

  return possibleMoves;
}// Check if moving the king would put it in check
function isKingMoveSafe(fromSquare, toSquare, playerColor) {
  // Get the DOM elements for the original and target squares
  const originalSquare = document.getElementById(fromSquare);
  const targetSquare = document.getElementById(toSquare);
  // Get the king piece and any piece that might be on the target square
  const movedPiece = originalSquare.querySelector(".piece");
  const targetPiece = targetSquare.querySelector(".piece"); // To restore in case of undo

  // Temporarily move the king to test if the move is safe
  targetSquare.appendChild(movedPiece);

  // Check if this temporary position puts the king in check
  const kingInCheck = isKingInCheck(playerColor);

  // Restore the board to its original state
  originalSquare.appendChild(movedPiece);
  if (targetPiece) {
    targetSquare.appendChild(targetPiece); // Restore captured piece if any
  }

  // If the king would be in check after the move, it's not safe
  if (kingInCheck) {
    return false;
  }

  // Check for pawn threats based on player color
  if (playerColor === "white") {
    // For white king, check if black pawns can attack diagonally from below
    const leftDiagonal = `${String.fromCharCode(
      toSquare[0].charCodeAt(0) - 1
    )}${parseInt(toSquare[1]) - 1}`;
    const rightDiagonal = `${String.fromCharCode(
      toSquare[0].charCodeAt(0) + 1
    )}${parseInt(toSquare[1]) - 1}`;

    // Check both diagonal squares for threatening black pawns
    if (
      canPawnAttack(toSquare, leftDiagonal, "black") ||
      canPawnAttack(toSquare, rightDiagonal, "black")
    ) {
      return false;
    }
  } else if (playerColor === "black") {
    // For black king, check if white pawns can attack diagonally from above
    const leftDiagonal = `${String.fromCharCode(
      toSquare[0].charCodeAt(0) - 1
    )}${parseInt(toSquare[1]) + 1}`;
    const rightDiagonal = `${String.fromCharCode(
      toSquare[0].charCodeAt(0) + 1
    )}${parseInt(toSquare[1]) + 1}`;

    // Check both diagonal squares for threatening white pawns
    if (
      canPawnAttack(toSquare, leftDiagonal, "white") ||
      canPawnAttack(toSquare, rightDiagonal, "white")
    ) {
      return false;
    }
  }

  // If we've passed all checks, the move is safe
  return true;
}

// Function to calculate valid moves for a pawn, including capture and promotion possibilities
function getPawnMove(currentSquare, player) {
  // Extract the file (column) and rank (row) from the current square
  const file = currentSquare[0];
  const rank = parseInt(currentSquare[1]);
  // Calculate the forward direction based on player color
  const forwardMove = player === "white" ? rank + 1 : rank - 1;
  const newSquare = file + forwardMove;

  // Check if the pawn will reach the promotion rank after this move
  const isPromotionRank =
    (forwardMove === 8 && player === "white") ||
    (forwardMove === 1 && player === "black");

  // Get the DOM element of the target square
  const targetSquare = document.querySelector(`[data-position="${newSquare}"]`);

  // Validate the move and handle special cases
  if (targetSquare) {
    // Handle capturing a piece on the promotion square
    if (targetSquare.childElementCount > 0) {
      const capturedPiece = targetSquare.querySelector(".piece");
      const capturedPieceType = capturedPiece.getAttribute("data-piece-type");
      targetSquare.removeChild(capturedPiece);

      // Update the UI to show the captured piece
      CapturedPiecesDisplay(
        capturedPieceType,
        player === "white" ? "black" : "white"
      );
    }

    // Handle pawn promotion
    if (isPromotionRank) {
      isValidPawnPromotion(currentSquare, newSquare, player);
      return null; // Exit since promotion is handled separately
    }

    // Return the new square if it's empty and the move is valid
    if (!targetSquare.querySelector(".piece")) {
      return newSquare;
    }
  }

  return null;
}

// Calculate all possible moves for a given piece
function getAvailableMoves(pieceType, currentSquare, player) {
  const moves = [];

  // Handle pawn movement specifically
  if (pieceType === "pawn") {
    // Check for standard forward movement
    const forwardMove = getPawnMove(currentSquare, player);
    if (forwardMove) {
      moves.push([currentSquare, forwardMove]);
    }

    // Calculate and add possible capture moves
    const captures = getPawnCaptures(currentSquare, player);
    captures.forEach((captureMove) => {
      moves.push([currentSquare, captureMove]);
    });
  }

  return moves;
}

// Calculate all possible capture moves for a pawn
function getPawnCaptures(currentSquare, player) {
  // Extract current position information
  const file = currentSquare[0];
  const rank = parseInt(currentSquare[1]);
  // Calculate the capture rank based on player color
  const captureRank = player === "white" ? rank + 1 : rank - 1;
  const possibleCaptures = [];

  // Check left diagonal capture possibility
  const leftCapture = String.fromCharCode(file.charCodeAt(0) - 1) + captureRank;
  const leftTarget = document.getElementById(leftCapture);
  // Validate if there's an enemy piece to capture
  if (
    leftTarget &&
    leftTarget.querySelector(".piece") &&
    leftTarget.querySelector(".piece").getAttribute("data-color") !== player
  ) {
    possibleCaptures.push(leftCapture);
  }

  // Check right diagonal capture possibility
  const rightCapture =
    String.fromCharCode(file.charCodeAt(0) + 1) + captureRank;
  const rightTarget = document.getElementById(rightCapture);
  // Validate if there's an enemy piece to capture
  if (
    rightTarget &&
    rightTarget.querySelector(".piece") &&
    rightTarget.querySelector(".piece").getAttribute("data-color") !== player
  ) {
    possibleCaptures.push(rightCapture);
  }

  return possibleCaptures;
}

// Function to check if a pawn move qualifies for en passant capture
function isValidEnPassantMove(currentSquare, targetSquare, playerColor) {
  const file = currentSquare[0];
  const rank = parseInt(currentSquare[1]);
  // Calculate the forward direction based on player color
  const forwardMove = playerColor === "white" ? rank + 1 : rank - 1;

  const enPassantSquare = file + forwardMove;

  // Check if the target square is the valid en passant square
  if (targetSquare !== enPassantSquare) {
    return false;
  }

  // Check if the pawn is on the correct rank for en passant
  // White pawns must be on rank 5, black pawns on rank 4
  if (
    (playerColor === "white" && rank !== 5) ||
    (playerColor === "black" && rank !== 4)
  ) {
    return false;
  }

  // Check if there's an opponent's pawn in the correct position
  // For white, opponent's pawn should be on rank 5; for black, on rank 4
  const opponentPawnSquare =
    targetSquare[0] + (playerColor === "white" ? "5" : "4");
  const opponentPawn = document
    .getElementById(opponentPawnSquare)
    .querySelector(".piece");
  if (
    !opponentPawn ||
    opponentPawn.getAttribute("data-piece") !==
      `pawn-${playerColor === "white" ? "black" : "white"}`
  ) {
    return false;
  }

  // Verify that the opponent's pawn just moved two squares in the previous turn
  // This is a requirement for en passant to be legal
  if (
    !lastMove ||
    lastMove.piece !== "pawn" ||
    lastMove.to !== opponentPawnSquare ||
    Math.abs(parseInt(lastMove.from[1]) - parseInt(lastMove.to[1])) !== 2
  ) {
    return false;
  }

  return true;
}

// Function to execute the en passant capture move
function executeEnPassant(currentSquare, targetSquare, playerColor) {
  // Determine the rank where the captured pawn is located
  const capturedPawnRank = playerColor === "white" ? "5" : "4";
  const capturedPawnSquare = targetSquare[0] + capturedPawnRank;

  // Remove the captured pawn from the board
  const capturedPawn = document
    .getElementById(capturedPawnSquare)
    .querySelector(".piece");
  if (capturedPawn) {
    const capturedPieceType = capturedPawn.getAttribute("data-piece");
    capturedPawn.remove();

    // Update the captured pieces display
    CapturedPiecesDisplay(capturedPieceType, playerColor);
  }

  // Move the capturing pawn to its new position
  const movingPawn = document
    .getElementById(currentSquare)
    .querySelector(".piece");
  document.getElementById(targetSquare).appendChild(movingPawn);
}

// Function to determine if a specific piece can attack the opponent's king
function canPieceAttackKing(
  pieceType,
  piecePosition,
  kingPosition,
  opponentColor
) {
  switch (pieceType) {
    case "pawn":
      // Pawns have special attack rules - they capture diagonally
      return canPawnAttack(kingPosition, piecePosition, opponentColor);
    case "rook":
      // Rooks move and attack in straight lines (horizontally or vertically)
      return (
        isStraightLineMove(piecePosition, kingPosition) &&
        isPathClear(piecePosition, kingPosition)
      );
    case "bishop":
      // Bishops move and attack diagonally
      return (
        isDiagonalMove(piecePosition, kingPosition) &&
        isPathClear(piecePosition, kingPosition)
      );
    case "queen":
      // Queens combine rook and bishop movement patterns
      return (
        (isStraightLineMove(piecePosition, kingPosition) ||
          isDiagonalMove(piecePosition, kingPosition)) &&
        isPathClear(piecePosition, kingPosition)
      );
    case "knight":
      // Knights have unique L-shaped movement and can jump over pieces
      return isValidKnightMove(piecePosition, kingPosition);
    case "king":
      // Kings can attack adjacent squares in any direction
      return isValidKingMove(piecePosition, kingPosition);
    default:
      return false;
  }
}

// Function to check if a pawn can attack a specific square (used for king attacks)
function canPawnAttack(fromSquare, toSquare, pawnColor) {
  // Convert square coordinates to numeric values for calculation
  const fromX = fromSquare[0].charCodeAt(0);
  const fromY = parseInt(fromSquare[1]);
  const toX = toSquare[0].charCodeAt(0);
  const toY = parseInt(toSquare[1]);

  if (pawnColor === "white") {
    // White pawns attack one square diagonally upward
    return fromY === toY + 1 && (fromX === toX + 1 || fromX === toX - 1);
  } else if (pawnColor === "black") {
    // Black pawns attack one square diagonally downward
    return fromY === toY - 1 && (fromX === toX + 1 || fromX === toX - 1);
  }

  return false;
}

// Function to validate if a pawn's move is legal according to chess rules
function isValidPawnMove(fromSquare, toSquare, playerColor) {
  // Extract file (column) and rank (row) from the squares
  const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
  const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];
  // Determine direction of movement based on player color
  const direction = playerColor === "white" ? 1 : -1;

  // Check forward movement (non-capturing moves)
  if (fromFile === toFile) {
    // Special case: First move can be two squares forward
    if (
      (playerColor === "white" && fromRank === 2) ||
      (playerColor === "black" && fromRank === 7)
    ) {
      return (
        toRank === fromRank + 2 * direction || toRank === fromRank + direction
      );
    }
    // Normal case: One square forward
    return toRank === fromRank + direction;
  }

  // Check diagonal capture moves
  if (
    Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0)) === 1 &&
    toRank === fromRank + direction
  ) {
    // Verify there is a piece to capture
    return document.getElementById(toSquare).querySelector(".piece") !== null;
  }

  return false;
}

// Function to handle pawn promotion when a pawn reaches the opposite end of the board
function isValidPawnPromotion(fromSquare, toSquare, playerColor) {
  const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
  const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

  // Check if pawn has reached the promotion rank (8 for white, 1 for black)
  if (
    (toRank === 8 && playerColor === "white") ||
    (toRank === 1 && playerColor === "black")
  ) {
    return new Promise((resolve, _reject) => {
      // Display the promotion selection modal
      const modal = document.getElementById("promotionModal");
      modal.style.display = "block";

      // Handler function for promotion piece selection
      const handlePromotionSelection = (piece) => {
        // Process the promotion with the selected piece
        handlePieceSelection(
          piece,
          resolve,
          toSquare,
          playerColor,
          initialBoardSetup
        );

        // Clean up the modal after selection
        modal.style.display = "none";

        // Remove event listeners to prevent memory leaks
        document.getElementById("queen").onclick = null;
        document.getElementById("rook").onclick = null;
        document.getElementById("bishop").onclick = null;
        document.getElementById("knight").onclick = null;
      };

      // Set up click handlers for each promotion piece option
      document.getElementById("queen").onclick = () =>
        handlePromotionSelection("queen");
      document.getElementById("rook").onclick = () =>
        handlePromotionSelection("rook");
      document.getElementById("bishop").onclick = () =>
        handlePromotionSelection("bishop");
      document.getElementById("knight").onclick = () =>
        handlePromotionSelection("knight");
    });
  }

  // Return null if the move doesn't result in a promotion
  return null;
}

// Function to handle piece selection during promotion - Updates both visual and logical board state
function handlePieceSelection(piece, resolve, pawnPosition, currentPlayer) {
  const modal = document.getElementById("promotionModal");
  modal.style.display = "none";

  // Replace the pawn with the new piece in the board state data structure
  initialBoardSetup[pawnPosition] = `${piece}-${currentPlayer}`;

  // Update the visual board to reflect the new piece
  const square = document.getElementById(pawnPosition);
  if (!square) {
    console.error(`Square with ID ${pawnPosition} not found.`);
    return;
  }

  // Clear the square's current content and add the new promoted piece visually
  square.innerHTML = "";
  const newPieceElement = createPieceElement(piece, currentPlayer);
  square.appendChild(newPieceElement);

  // Resolve the promise to continue game flow after promotion is complete
  resolve(piece);
}

// Function to execute a promotion - Handles the visual and logical updates when a pawn is promoted
function executePromotion(fromSquare, toSquare, playerColor, selectedPiece) {
  const targetSquare = document.getElementById(toSquare);
  const sourceSquare = document.getElementById(fromSquare);

  if (!targetSquare) return;

  // Create new promoted piece element with appropriate attributes and styling
  const promotedPiece = document.createElement("img");
  promotedPiece.src = `assets/images/chess-pieces/${selectedPiece}-${playerColor}.png`;
  promotedPiece.classList.add("piece");
  promotedPiece.setAttribute("data-piece", `${selectedPiece}-${playerColor}`);
  promotedPiece.setAttribute("data-color", playerColor);

  // Update the board visually by placing the new piece
  targetSquare.innerHTML = "";
  targetSquare.appendChild(promotedPiece);

  // Remove the original pawn from its square
  if (sourceSquare) {
    sourceSquare.innerHTML = "";
  }

  // Update the logical board state
  initialBoardSetup[toSquare] = `${selectedPiece}-${playerColor}`;
  delete initialBoardSetup[fromSquare];

  // Switch turns and play promotion sound effect
  currentPlayer = playerColor === "white" ? "black" : "white";
  promotionSound.play();
}

// Function to check if a square contains an opponent piece - Returns true if opponent piece is present
function isOpponentPieceAtSquare(square, playerColor) {
  const pieceAtSquare = document
    .getElementById(square)
    ?.querySelector(".piece");
  return (
    pieceAtSquare && pieceAtSquare.getAttribute("data-color") !== playerColor
  );
}

// Function to validate if a move is valid for a rook - Must be straight line and path must be clear
function isValidRookMove(fromSquare, toSquare) {
  return (
    isStraightLineMove(fromSquare, toSquare) &&
    isPathClear(fromSquare, toSquare)
  );
}

// Function to validate if a move is valid for a bishop - Must be diagonal and path must be clear
function isValidBishopMove(fromSquare, toSquare) {
  return (
    isDiagonalMove(fromSquare, toSquare) && isPathClear(fromSquare, toSquare)
  );
}

// Function to validate if a move is valid for a queen - Can move straight or diagonal if path is clear
function isValidQueenMove(fromSquare, toSquare) {
  return (
    (isStraightLineMove(fromSquare, toSquare) ||
      isDiagonalMove(fromSquare, toSquare)) &&
    isPathClear(fromSquare, toSquare)
  );
}

// Function to validate if a move is valid for a knight - Must move in L-shape (2 squares one way, 1 square perpendicular)
function isValidKnightMove(fromSquare, toSquare) {
  const fileDiff = Math.abs(
    fromSquare[0].charCodeAt(0) - toSquare[0].charCodeAt(0)
  );
  const rankDiff = Math.abs(fromSquare[1] - toSquare[1]);
  return (
    (fileDiff === 2 && rankDiff === 1) || (fileDiff === 1 && rankDiff === 2)
  );
}

// Function to validate if a king's move is valid - Checks both normal moves and castling
function isValidKingMove(fromSquare, toSquare, playerColor) {
  const fileDiff = Math.abs(
    fromSquare[0].charCodeAt(0) - toSquare[0].charCodeAt(0)
  );
  const rankDiff = Math.abs(fromSquare[1] - toSquare[1]);

  // Validate normal king movement (one square in any direction)
  if (fileDiff <= 1 && rankDiff <= 1) {
    return isKingMoveSafe(fromSquare, toSquare, playerColor); // Ensure move doesn't put king in check
  }

  // Validate castling movement (two squares horizontally)
  if (fileDiff === 2 && rankDiff === 0) {
    return isValidCastling(fromSquare, toSquare, playerColor);
  }

  return false;
}

// Function to validate if castling is legal - Checks multiple conditions including piece positions and check status
function isValidCastling(kingSquare, targetSquare, playerColor) {
  const rank = playerColor === "white" ? "1" : "8";
  const isKingsideCastling = targetSquare[0] === "g";
  const rookFile = isKingsideCastling ? "h" : "a";
  const rookSquare = rookFile + rank;
  const filesToCheck = isKingsideCastling ? ["f", "g"] : ["d", "c", "b"];

  // Verify no pieces are between king and rook
  for (let f of filesToCheck) {
    if (document.getElementById(f + rank).querySelector(".piece")) {
      return false;
    }
  }

  // Check if player has already castled this game
  if (
    (playerColor === "white" && whiteCastled) ||
    (playerColor === "black" && blackCastled)
  ) {
    return false;
  }

  // Verify king and rook are in their original positions
  if (
    kingSquare !== "e" + rank ||
    !document.getElementById(rookSquare).querySelector(".piece")
  ) {
    return false;
  }

  // Check if king is safe throughout the castling movement
  const kingPath = rookFile === "a" ? ["e", "d", "c"] : ["e", "f", "g"];
  for (let f of kingPath) {
    if (isKingInCheck(playerColor, f + rank)) {
      return false;
    }
  }

  return true;
}

// Function to execute castling move - Handles moving both king and rook
function executeCastling(kingSquare, targetSquare, playerColor) {
  const rank = playerColor === "white" ? "1" : "8";
  const isKingsideCastling = targetSquare[0] === "g";
  const rookFile = isKingsideCastling ? "h" : "a";
  const rookSquare = rookFile + rank;
  const newRookFile = isKingsideCastling ? "f" : "d";
  const newRookSquare = newRookFile + rank;

  // Get king and rook elements
  const king = document.getElementById(kingSquare).querySelector(".piece");
  const rook = document.getElementById(rookSquare).querySelector(".piece");

  // Verify pieces exist before proceeding
  if (!king || !rook) {
    console.error("Castling failed: King or rook is missing.");
    return;
  }

  // Execute castling movement if valid
  const kingFileDiff = Math.abs(
    kingSquare.charCodeAt(0) - targetSquare.charCodeAt(0)
  );
  if (kingFileDiff === 2) {
    document.getElementById(targetSquare).appendChild(king);
    document.getElementById(newRookSquare).appendChild(rook);

    // Update castling flags and play sound
    if (playerColor === "white") {
      whiteCastled = true;
    } else {
      blackCastled = true;
    }
    castleSound.play();
  }
}

// Additional helper functions for movement logic (straight line, diagonal, etc.)
// ---------------------------------------------------------------------------

// Check if a piece can block or capture the attacker
function canPieceBlockCheckOrCapture(
  attackingPiecePosition,
  playerColor,
  kingPosition
) {
  // Get all pieces belonging to the current player
  const playerPieces = document.querySelectorAll(
    `.piece[data-color='${playerColor}']`
  );

  // Iterate through each piece to check if it can help defend the king
  for (let piece of playerPieces) {
    // Extract the piece type (e.g., pawn, rook, bishop)
    const pieceType = piece.getAttribute("data-piece").split("-")[0];
    // Get the current position of the piece
    const piecePosition = piece.parentElement.id;

    // Check if this piece can move to the attacking piece's position (capture)
    if (
      isValidPieceMove(
        pieceType,
        piecePosition,
        attackingPiecePosition,
        playerColor
      )
    ) {
      return true; // Piece can capture the attacker
    }

    // Get all squares between attacker and king that could block the check
    const blockingSquares = getBlockingSquares(
      attackingPiecePosition,
      kingPosition
    );
    // Check if the piece can move to any of the blocking squares
    for (let square of blockingSquares) {
      if (isValidPieceMove(pieceType, piecePosition, square, playerColor)) {
        return true; // Piece can block the check
      }
    }
  }

  return false; // No piece can block or capture
}

// Helper function to calculate squares between attacker and king
function getBlockingSquares(_attackerPosition, _kingPosition) {
  // Calculate the squares between the attacker and the king (if it's a sliding piece)
  // This would apply for rooks, bishops, and queens.
  let blockingSquares = [];
  // Logic to calculate the squares between the attacker and king
  return blockingSquares;
}

// Helper function to get all valid adjacent squares for a given position
function getAdjacentSquares(position) {
  // Split the position into file (letter) and rank (number)
  const [file, rank] = position.split("");
  const fileCode = file.charCodeAt(0);
  const rankNum = parseInt(rank);
  const adjacentSquares = [];

  // Check all 8 possible adjacent squares
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      // Skip the current position
      if (i === 0 && j === 0) continue;
      // Calculate new file and rank
      const newFile = String.fromCharCode(fileCode + i);
      const newRank = rankNum + j;
      // Only add valid squares within the board boundaries
      if (newFile >= "a" && newFile <= "h" && newRank >= 1 && newRank <= 8) {
        adjacentSquares.push(`${newFile}${newRank}`);
      }
    }
  }

  return adjacentSquares;
}

// Validate rook movement (straight lines only - horizontal or vertical)
function isStraightLineMove(fromSquare, toSquare) {
  const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
  const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

  // Return true if either the file or rank remains the same
  return fromFile === toFile || fromRank === toRank;
}

// Validate bishop movement (diagonal moves only)
function isDiagonalMove(fromSquare, toSquare) {
  const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
  const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

  // Check if the change in files equals the change in ranks (diagonal movement)
  return (
    Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0)) ===
    Math.abs(fromRank - toRank)
  );
}

// Check if there are any pieces blocking the path between two squares
function isPathClear(fromSquare, toSquare) {
  // Convert squares to numeric values for calculation
  const [fromFile, fromRank] = [
    fromSquare.charCodeAt(0),
    parseInt(fromSquare[1]),
  ];
  const [toFile, toRank] = [toSquare.charCodeAt(0), parseInt(toSquare[1])];

  // Calculate the direction of movement
  const fileStep = Math.sign(toFile - fromFile);
  const rankStep = Math.sign(toRank - fromRank);

  // Check each square along the path
  let currentFile = fromFile + fileStep;
  let currentRank = fromRank + rankStep;

  while (currentFile !== toFile || currentRank !== toRank) {
    const intermediateSquare = String.fromCharCode(currentFile) + currentRank;
    const squareElement = document.getElementById(intermediateSquare);

    // If there's a piece on any intermediate square, the path is blocked
    if (squareElement && squareElement.querySelector(".piece")) {
      return false;
    }

    currentFile += fileStep;
    currentRank += rankStep;
  }

  return true;
}

// Handle the initial selection of a piece
function handlePieceClick(event) {
  // Don't allow moves if game is over
  if (gameIsOver) return;
  // Only allow white player to move during their turn
  if (currentPlayer !== "white") return;
  
  const piece = event.target;
  const pieceColor = piece.getAttribute("data-color");
  // Ensure player can only move their own pieces
  if (pieceColor !== currentPlayer) return;

  // Store selected piece information
  selectedPiece = {
    pieceElement: piece,
    currentSquare: piece.parentElement.id,
    color: pieceColor,
    pieceType: piece.getAttribute("data-piece").split("-")[0],
  };
  console.log(
    `Selected ${selectedPiece.pieceType} on ${selectedPiece.currentSquare}`
  );
  // Show possible moves for selected piece
  highlightMoves(selectedPiece, initialBoardSetup);
}

// Function to handle move completion and check game state
function handleMoveCompletion() {
  // Locate both kings on the board
  const whiteKing = findKing("white");
  const blackKing = findKing("black");

  // Check for king capture scenarios
  if (!whiteKing) {
    console.log("White king not found, game over");
    gameOver("black");
    return;
  }
  if (!blackKing) {
    console.log("Black king not found, game over");
    gameOver("white");
    return;
  }

  // Check for checkmate condition
  const isCheckmate = checkGameState();
  console.log("Is checkmate:", isCheckmate);

  // Handle game over if checkmate
  if (isCheckmate) {
    console.log("Checkmate detected. Game over.");
    return;
  }

  // Continue game if not checkmate
  if (!isCheckmate) {
    console.log("Not checkmate. Game continues.");
  }

  // Update game state and prepare for next turn
  reassignListeners();
  console.log("Switching player...");
  switchPlayer();
}

// Handle restart game button click
document.getElementById("restart").addEventListener("click", function () {
  console.log("Restart button clicked");
  // Reset all game state variables
  gameIsOver = false;
  console.log("Game state reset, gameIsOver:", gameIsOver);

  // Reinitialize the game board
  console.log("Initializing board...");
  initializeBoard();

  // Set up new event listeners
  console.log("Reassigning listeners...");
  reassignListeners();
});

// Handle the movement of a piece to a new square
function handleSquareClick(event) {
  // Don't process moves if game is over or no piece is selected
  if (gameIsOver) return;
  if (!selectedPiece) return;

  // Get target square and current piece information
  const targetSquare = event.target.closest(".square");
  const currentSquare = selectedPiece.pieceElement.parentElement;
  const pieceType = selectedPiece.pieceType;
  const playerColor = selectedPiece.color;

  // Validate and execute the move if legal
  if (
    isValidPieceMove(pieceType, currentSquare.id, targetSquare.id, playerColor)
  ) {
    executeMove(currentSquare, targetSquare, pieceType, playerColor);
    handleMoveCompletion();
  }
}

function executeMove(currentSquare, targetSquare, pieceType, playerColor) {
  // Clear any highlighted squares from previous moves
  clearHighlights();
  
  // Check if there's a piece on the target square (capture scenario)
  if (targetSquare.querySelector(".piece")) {
    // Get the piece that will be captured
    const capturedPiece = targetSquare.querySelector(".piece");
    const capturedPieceType = capturedPiece.getAttribute("data-piece");
    // Remove the captured piece from the board
    targetSquare.removeChild(capturedPiece);
    // Display the captured piece in the captured pieces area
    CapturedPiecesDisplay(capturedPieceType, playerColor);
    // Play capture sound effect
    captureSound.play();
  } else {
    // Play regular move sound if it's not a capture
    moveSound.play();
  }

  // Move the selected piece to the target square
  targetSquare.appendChild(selectedPiece.pieceElement);
  // Reset the selected piece after the move
  selectedPiece = null;
}

// Main function to validate moves for all piece types
function isValidPieceMove(pieceType, fromSquare, toSquare, playerColor) {
  // First check for special pawn promotion case
  if (
    pieceType === "pawn" &&
    isValidPawnPromotion(fromSquare, toSquare, playerColor)
  ) {
    return true;
  }

  // Check for special castling move (king moves two squares)
  if (
    pieceType === "king" &&
    Math.abs(toSquare.charCodeAt(0) - fromSquare.charCodeAt(0)) === 2
  ) {
    return isValidCastling(fromSquare, toSquare, playerColor);
  }

  // Check for special en passant pawn capture
  if (
    pieceType === "pawn" &&
    isValidEnPassantMove(fromSquare, toSquare, playerColor)
  ) {
    return true;
  }

  let validMove = false;

  // Validate regular moves using piece-specific movement rules
  switch (pieceType) {
    case "pawn":
      validMove = isValidPawnMove(fromSquare, toSquare, playerColor);
      break;
    case "rook":
      validMove = isValidRookMove(fromSquare, toSquare);
      break;
    case "bishop":
      validMove = isValidBishopMove(fromSquare, toSquare);
      break;
    case "queen":
      validMove = isValidQueenMove(fromSquare, toSquare);
      break;
    case "knight":
      validMove = isValidKnightMove(fromSquare, toSquare);
      break;
    case "king":
      validMove = isValidKingMove(fromSquare, toSquare, playerColor);
      break;
    default:
      return false;
  }

  // Prevent capturing own pieces by checking target square
  const targetSquarePiece = document
    .getElementById(toSquare)
    .querySelector(".piece");
  if (
    targetSquarePiece &&
    targetSquarePiece.getAttribute("data-color") === playerColor
  ) {
    return false;
  }

  // If the move doesn't follow piece-specific rules, it's invalid
  if (!validMove) return false;

  // If the king is currently in check, only allow moves that resolve the check
  if (isKingInCheck(playerColor)) {
    return simulateMoveAndCheck(fromSquare, toSquare, playerColor);
  }

  return validMove;
}

// Function to test if a move will resolve a check situation
function simulateMoveAndCheck(fromSquare, toSquare, playerColor) {
  // Store references to the original squares and pieces
  const originalFromSquare = document.getElementById(fromSquare);
  const originalToSquare = document.getElementById(toSquare);

  // Get the piece being moved and any piece being captured
  const movedPiece = originalFromSquare.querySelector(".piece");
  const capturedPiece = originalToSquare.querySelector(".piece");

  // Temporarily make the move on the board
  originalToSquare.appendChild(movedPiece);
  if (capturedPiece) {
    capturedPiece.remove();
  }

  // Check if the king would still be in check after this move
  const kingInCheck = isKingInCheck(playerColor);

  // Restore the board to its original state
  originalFromSquare.appendChild(movedPiece);
  if (capturedPiece) {
    originalToSquare.appendChild(capturedPiece);
  }

  // Return true if the move resolves the check
  return !kingInCheck;
}
/* ================================
   3. Turn Management
================================ */
// Manage the turns between the human and AI players.

// Track the currently selected piece on the board
let selectedPiece = null;
// Track whose turn it is - white (human) starts first, black (AI) goes second
let currentPlayer = "white"; // Human player plays white, AI plays black

// Switch between human and AI turns
function switchPlayer() {
  if (gameIsOver) return; // Prevent switching if the game is over

  // Toggle between white and black players
  currentPlayer = currentPlayer === "white" ? "black" : "white";
  // If it's black's turn (AI's turn), trigger the AI move calculation
  if (currentPlayer === "black") {
    getBestMoveFromStockfish(); // Trigger AI move when it's the AI's turn
  }
}

// AI turn: Ask Stockfish for the best move
function getBestMoveFromStockfish() {
  // Convert current board position to FEN notation for Stockfish
  const fen = boardToFEN();
  //console.log(`Sending FEN to Stockfish: ${fen}`);
  // Send the current position to Stockfish engine
  sendToStockfish(`position fen ${fen}`);
  // Request Stockfish to calculate best move at depth 10
  sendToStockfish("go depth 10");
}

// Execute the move suggested by the AI
function makeAIMove(move) {
  //----------------------------------------------------------------------//
  // Debug section: Disable AI moves for testing
  // currentPlayer = "white"; // Switch back to the human player
  // return;  // Skip the AI move but still switch the player back to "white"
  //----------------------------------------------------------------------//

  // Extract the source and destination squares from the move string
  const fromSquare = move.slice(0, 2);
  const toSquare = move.slice(2, 4);
  // Get the piece element that needs to be moved
  const pieceToMove = document
    .getElementById(fromSquare)
    .querySelector(".piece");
  // Get the destination square element
  const targetSquare = document.getElementById(toSquare);

  // Safety check: ensure the piece exists before attempting to move it
  if (!pieceToMove) {
    console.error(`No piece found on ${fromSquare}`);
    return;
  }

  // Handle piece capture if there's a piece on the target square
  if (targetSquare.childElementCount > 0) {
    const capturedPiece = targetSquare.querySelector(".piece");
    const capturedPieceType = capturedPiece.getAttribute("data-piece");
    targetSquare.removeChild(capturedPiece);

    // Update the display of captured pieces for the AI's capture
    CapturedPiecesDisplay(capturedPieceType, "black");
  }

  // Execute the actual piece movement
  targetSquare.appendChild(pieceToMove);
  currentPlayer = "white"; // Return control to the human player

  // Log the move for debugging purposes
  console.log(`AI moved from ${fromSquare} to ${toSquare}`);

  // Check if the human player's king is in check after AI's move
  if (isKingInCheck("white")) {
    console.log("Your king is in check!");
  }
}

/* ================================
   4. Game State
================================ */
// Game state management, FEN conversion, and handling different player states.

// Takes a player color ('white' or 'black') as input and returns true if that player's king is in check
function isKingInCheck(playerColor) {
  // Find the current position of the specified player's king
  const kingPosition = findKing(playerColor);
  if (!kingPosition) {
    console.error(
      `Cannot check if king is in check. King not found for ${playerColor}`
    );
    return false;
  }

  // Determine the opponent's color for checking their pieces
  const opponentColor = playerColor === "white" ? "black" : "white";
  // Get all opponent pieces currently on the board
  const opponentPieces = document.querySelectorAll(
    `.piece[data-color='${opponentColor}']`
  );

  // Iterate through each opponent piece to check if it can attack the king
  for (let piece of opponentPieces) {
    // Extract the piece type (e.g., 'pawn', 'queen') from the data attribute
    const pieceType = piece.getAttribute("data-piece")?.split("-")[0];
    // Get the current square position of the opponent's piece
    const piecePosition = piece.parentElement?.id;

    // Skip malformed pieces that don't have proper attributes
    if (!pieceType || !piecePosition) {
      console.warn(`Malformed piece found: ${piece.outerHTML}`);
      continue;
    }

    // Check if this specific piece can attack the king
    if (
      canPieceAttackKing(pieceType, piecePosition, kingPosition, opponentColor)
    ) {
      console.log(
        `${playerColor}'s king at ${kingPosition} is in check from ${opponentColor}'s ${pieceType} at ${piecePosition}.`
      );
      return true; // Break early once a threat is found
    }
  }

  // If no threats are found, the king is safe
  return false;
}

// Evaluates if either king is in check or checkmate and handles game over conditions
function checkGameState() {
  // Check if either king is currently in check
  const whiteKingInCheck = isKingInCheck("white");
  const blackKingInCheck = isKingInCheck("black");

  // Handle white king in check situation
  if (whiteKingInCheck) {
    checkSound.play(); // Play audio feedback for check
    console.log("White's king is in check.");
    if (isCheckmate("white")) {
      console.log("White is in checkmate. Black wins.");
      gameOver("black");
      gameIsOver = true;
      return true;
    } else {
      console.log("White's king is in check, but not in checkmate.");
    }
  }

  // Handle black king in check situation
  if (blackKingInCheck) {
    checkSound.play(); // Play audio feedback for check
    console.log("Black's king is in check.");
    if (isCheckmate("black")) {
      console.log("Black is in checkmate. White wins.");
      gameOver("white");
      gameIsOver = true;
      return true;
    } else {
      console.log("Black's king is in check, but not in checkmate.");
    }
  }

  console.log("Neither king is in checkmate, game continues.");
  return false;
}

// Evaluates all possible moves to determine if a checkmate condition exists
function isCheckmate(color) {
  // First verify the king is actually in check
  if (!isKingInCheck(color)) {
    console.log(`${color}'s king is not in check, so not checkmate.`);
    return false;
  }

  // Find the king's current position and calculate all possible moves
  const kingPosition = findKing(color);
  const possibleKingMoves = getKingPossibleMoves(kingPosition, color);

  // Check if the king can escape check by moving to any safe square
  for (let move of possibleKingMoves) {
    if (isKingMoveSafe(kingPosition, move, color)) {
      console.log(`King can escape to ${move}, not checkmate.`);
      return false;
    }
  }

  // Check if any friendly piece can block the check or capture the attacking piece
  const opponentColor = color === "white" ? "black" : "white";
  const opponentPieces = document.querySelectorAll(
    `.piece[data-color='${opponentColor}']`
  );

  // Examine each piece's potential to prevent checkmate
  for (let piece of opponentPieces) {
    const pieceType = piece.getAttribute("data-piece").split("-")[0];
    const piecePosition = piece.parentElement.id;

    if (isValidPieceMove(pieceType, piecePosition, move, color)) {
      console.log(
        `${pieceType} at ${piecePosition} can block the check by moving to ${move}. Not checkmate.`
      );
      return false;
    }
  }

  console.log(
    `${color}'s king has no valid moves and no pieces can block or capture. Checkmate.`
  );
  return true;
}

// Arrays to keep track of captured pieces throughout the game
let capturedWhitePieces = [];
let capturedBlackPieces = [];

// Adds captured piece images to the appropriate display area
function CapturedPiecesDisplay(capturedPiece, playerColor) {
  if (!capturedPiece) return;

  // Get the appropriate container for the captured piece based on the capturing player's color
  const capturedArea = document.getElementById(
    playerColor === "white" ? "blackCaptured" : "whiteCaptured"
  );
  // Create and configure the image element for the captured piece
  const pieceImage = document.createElement("img");
  pieceImage.src = `assets/images/chess-pieces/${capturedPiece}.png`;
  pieceImage.classList.add("captured-piece");
  capturedArea.appendChild(pieceImage);
}

// Alternative function to update captured pieces display
// Uses div elements instead of images for captured pieces
function updateCapturedPiecesDisplay(capturedPiece) {
  const container = document.getElementById(
    `captured-${capturedPiece.color}-pieces`
  );
  const pieceElement = document.createElement("div");
  pieceElement.className = `captured-piece ${capturedPiece.type}-${capturedPiece.color}`;
  container.appendChild(pieceElement);
}

// Function to handle game over state
// Manages end-game UI updates and cleanup
function gameOver(winner) {
  console.log(`Game over! ${winner} wins!`);
  alert(`Game over! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`);

  // Set game state to prevent further moves
  gameIsOver = true;

  // Remove all event listeners to prevent further interaction
  document.querySelectorAll(".square").forEach((square) => {
    square.removeEventListener("click", handleSquareClick);
  });
  document.querySelectorAll(".piece").forEach((piece) => {
    piece.removeEventListener("click", handlePieceClick);
  });

  // Clean up Stockfish worker
  stockfish.terminate();

  // Show restart button and add its event listener
  const restartButton = document.getElementById("restart");
  if (restartButton) {
    restartButton.style.display = "block";
    restartButton.addEventListener("click", resetGame);
  }

  // Update the UI to show game over state
  updateGameOverUI(winner);
}

// Global flag to track game state
let gameIsOver = false;

// Function to update UI elements when game is over
function updateGameOverUI(winner) {
  const gameStatus = document.getElementById("game-status");
  if (gameStatus) {
    gameStatus.textContent = `Game Over - ${winner} wins!`;
    gameStatus.style.display = "block";
  }
}

// Function to reset the game to its initial state
// Handles both UI and game state reset
function resetGame() {
  // Reset game state flags
  gameIsOver = false;
  
  // Reset board and game setup
  clearBoard();
  initializeBoard();
  resetGameState();
  addListeners();

  // Reset UI elements
  const gameStatus = document.getElementById("game-status");
  if (gameStatus) {
    gameStatus.style.display = "none";
  }
  document.getElementById("restart").style.display = "none";

  // Reset game variables
  selectedPiece = null;
  currentTurn = "white";
  moveHistory = [];

  // Clear captured pieces
  capturedWhitePieces = [];
  capturedBlackPieces = [];
  document.getElementById("whiteCaptured").innerHTML = "";
  document.getElementById("blackCaptured").innerHTML = "";

  // Remove highlighting
  document.querySelectorAll(".square").forEach((square) => {
    square.classList.remove("highlight");
  });

  // Reset move counter and update UI
  moveCount = 1;
  updateTurnIndicator();
  updateMoveHistory();

  // Reinitialize Stockfish engine
  if (stockfish) {
    stockfish.terminate();
  }
  stockfish = new Worker("assets/js/stockfish-16.1-lite-single.js");
  setupStockfishListeners();
}

/* ================================
   5. Initialize Board & Add Listeners
================================ */
// This section handles all the click events and user interactions with the chess board

// This ensures the game is ready to play as soon as the page is fully loaded
window.onload = () => {
  initializeBoard();  // Set up the initial chess piece positions
  addListeners();     // Attach click handlers to all pieces and squares
};


// This function attaches click handlers to every piece and square on the board
// allowing players to select pieces and make moves
function addListeners() {
  // Add click handlers to all chess pieces
  document.querySelectorAll(".piece").forEach((piece) => {
    piece.addEventListener("click", handlePieceClick); // Enables piece selection
  });

  // Add click handlers to all board squares
  document.querySelectorAll(".square").forEach((square) => {
    square.addEventListener("click", handleSquareClick); // Enables move destination selection
  });
}

// We need to ensure all pieces and squares have proper event handlers
function reassignListeners() {
  // Early return if the game has ended to prevent further moves
  if (gameIsOver) return; // Don't reassign listeners if the game is over

  // Remove all existing click handlers first to prevent duplicate events
  document.querySelectorAll(".piece").forEach((piece) => {
    piece.removeEventListener("click", handlePieceClick);
  });
  document.querySelectorAll(".square").forEach((square) => {
    square.removeEventListener("click", handleSquareClick);
  });

  // Reattach fresh event listeners to all pieces and squares
  addListeners();
}