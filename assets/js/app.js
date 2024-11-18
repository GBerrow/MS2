/* ==============================================
   1. Game Initialization and Board Structure
================================================= */
// In this section, we initialize the Stockfish engine and handle AI vs player interactions While also setting up the board structure.

// Initialize Stockfish Worker using the JavaScript file
const stockfish = new Worker("assets/js/stockfish-16.1-lite-single.js");

// Handle Stockfish response
stockfish.onmessage = function (event) {
  const bestMoveMatch = event.data.match(/bestmove\s([a-h][1-8][a-h][1-8])/);
  if (bestMoveMatch) {
    const bestMove = bestMoveMatch[1];
    // console.log(`Stockfish's best move: ${bestMove}`);
    makeAIMove(bestMove); // Apply Stockfish's move to the board
  } else {
    // Log only important Stockfish messages, like game over or mate
    if (event.data.includes("mate") || event.data.includes("game over")) {
      //    console.log("Stockfish analysis:", event.data);
    } else {
      // Commented out detailed Stockfish analysis logs (depth, nodes, etc.)
      // console.log("Stockfish analysis:", event.data);
    }
  }
};

// Utility to send commands to Stockfish
function sendToStockfish(command) {
  stockfish.postMessage(command);
}

const moveSound = new Audio("./assets/sound/move.mp3");
const captureSound = new Audio("./assets/sound/capture.mp3");
const checkSound = new Audio("./assets/sound/check.mp3");
const castleSound = new Audio("./assets/sound/castle.mp3");
const promotionSound = new Audio("./assets/sound/promotion.mp3");

let isMuted = false;

function toggleSound() {
  isMuted = !isMuted;
  const muteButton = document.getElementById("muteButton");
  muteButton.textContent = isMuted ? "🔇" : "🔊";
  [moveSound, captureSound, checkSound, castleSound, promotionSound].forEach(
    (sound) => {
      sound.muted = isMuted;
    }
  );
}

// Chess Board Setup
const initialBoardSetup = {
  a8: "rook-black",
  b8: "knight-black",
  c8: "bishop-black",
  d8: "queen-black",
  e8: "king-black",
  f8: "bishop-black",
  g8: "knight-black",
  h8: "rook-black",
  a7: "pawn-black",
  b7: "pawn-black",
  c7: "pawn-black",
  d7: "pawn-black",
  e7: "pawn-black",
  f7: "pawn-black",
  g7: "pawn-black",
  h7: "pawn-black",
  a1: "rook-white",
  b1: "knight-white",
  c1: "bishop-white",
  d1: "queen-white",
  e1: "king-white",
  f1: "bishop-white",
  g1: "knight-white",
  h1: "rook-white",
  a2: "pawn-white",
  b2: "pawn-white",
  c2: "pawn-white",
  d2: "pawn-white",
  e2: "pawn-white",
  f2: "pawn-white",
  g2: "pawn-white",
  h2: "pawn-white",
};

// Initialize the board with pieces and colors
function initializeBoard() {
  console.log("Initializing board..."); // Check if this line appears in the console
  let isLightSquare;

  // Clear the board first
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

  // Assign diagonal colors dynamically using HSL color model
  const squares = document.querySelectorAll(".square");
  squares.forEach((square, index) => {
    // Extract row and column from the index
    const row = Math.floor(index / 8);
    const col = index % 8;

    // Apply XOR logic for diagonal coloring
    isLightSquare = row % 2 === col % 2; // True for light square, false for dark

    // Generate dynamic HSL colors
    const hue = 30; // Brown hue
    const saturation = isLightSquare ? 30 : 40; // Less saturated for light squares
    const lightness = isLightSquare ? 80 - (row + col) : 40 - (row + col) / 2; // Gradual change in lightness

    square.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  });

  // Initialize empty captured pieces display
  document.getElementById("whiteCaptured").innerHTML = "";
  document.getElementById("blackCaptured").innerHTML = "";
}

// Convert the board state to FEN format for Stockfish
function boardToFEN() {
  let fen = "";
  for (let rank = 8; rank >= 1; rank--) {
    let emptyCount = 0;
    for (let file of "abcdefgh") {
      const square = document.getElementById(`${file}${rank}`);
      const piece = square?.querySelector(".piece");
      if (!piece) {
        emptyCount++;
        continue;
      }
      // Add piece notation
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
  return `${fen} ${currentPlayer === "white" ? "w" : "b"} - - 0 1`;
}

// Function to clear the board
function clearBoard() {
  document.querySelectorAll(".square").forEach((square) => {
    const piece = square.querySelector(".piece");
    if (piece) {
      square.removeChild(piece);
    }
  });
}

// Function to reset the board to its initial state
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

let whiteCastled = false;
let blackCastled = false;

/* ================================
   2. Piece Classes & Movement Logic
================================ */
// In this section, we define piece interaction, including movement and validation.

// Define the Piece class
function createPieceElement(pieceType, playerColor) {
  const pieceElement = document.createElement("div");
  pieceElement.className = `piece ${pieceType}-${playerColor}`;
  pieceElement.setAttribute("data-piece", `${pieceType}-${playerColor}`);
  pieceElement.style.backgroundImage = `url('assets/images/chess-pieces/${pieceType}-${playerColor}.png')`;
  return pieceElement;
}

// Helper function to find the king's position on the board
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

// Helper function to get the possible moves for the king
function getKingPossibleMoves(kingPosition, playerColor) {
  const possibleMoves = [];
  const adjacentSquares = getAdjacentSquares(kingPosition); // Get all squares surrounding the king

  for (let square of adjacentSquares) {
    if (isKingMoveSafe(kingPosition, square, playerColor)) {
      possibleMoves.push(square);
    }
  }

  return possibleMoves; // Return all valid moves for the king
}

// Check if moving the king would put it in check
function isKingMoveSafe(fromSquare, toSquare, playerColor) {
  // console.log(`Checking if king move from ${fromSquare} to ${toSquare} is safe for ${playerColor}`);

  const originalSquare = document.getElementById(fromSquare);
  const targetSquare = document.getElementById(toSquare);
  const movedPiece = originalSquare.querySelector(".piece");
  const targetPiece = targetSquare.querySelector(".piece"); // To restore in case of undo

  // Temporarily move the king
  targetSquare.appendChild(movedPiece);
  // console.log(`Temporarily moved king to ${toSquare}`);

  // Check if the move puts the king in check
  const kingInCheck = isKingInCheck(playerColor);
  // console.log(`King in check after move: ${kingInCheck}`);

  // Undo the temporary move
  originalSquare.appendChild(movedPiece);
  if (targetPiece) {
    targetSquare.appendChild(targetPiece); // Restore captured piece if any
  }
  // console.log(`Move undone, king back at ${fromSquare}`);

  // If the king is in check after the move, return false
  if (kingInCheck) {
    // console.log("Move would put the king in check, not safe.");
    return false;
  }

  // Additional check: Ensure pawns are not threatening the king diagonally
  if (playerColor === "white") {
    // Check if black pawns are attacking diagonally from one rank down
    const leftDiagonal = `${String.fromCharCode(
      toSquare[0].charCodeAt(0) - 1
    )}${parseInt(toSquare[1]) - 1}`;
    const rightDiagonal = `${String.fromCharCode(
      toSquare[0].charCodeAt(0) + 1
    )}${parseInt(toSquare[1]) - 1}`;

    // console.log(`Checking pawn threats at diagonals: ${leftDiagonal}, ${rightDiagonal}`);
    if (
      canPawnAttack(toSquare, leftDiagonal, "black") ||
      canPawnAttack(toSquare, rightDiagonal, "black")
    ) {
      // console.log("King threatened by black pawn, move not safe.");
      return false;
    }
  } else if (playerColor === "black") {
    // Check if white pawns are attacking diagonally from one rank up
    const leftDiagonal = `${String.fromCharCode(
      toSquare[0].charCodeAt(0) - 1
    )}${parseInt(toSquare[1]) + 1}`;
    const rightDiagonal = `${String.fromCharCode(
      toSquare[0].charCodeAt(0) + 1
    )}${parseInt(toSquare[1]) + 1}`;

    // console.log(`Checking pawn threats at diagonals: ${leftDiagonal}, ${rightDiagonal}`);
    if (
      canPawnAttack(toSquare, leftDiagonal, "white") ||
      canPawnAttack(toSquare, rightDiagonal, "white")
    ) {
      // console.log("King threatened by white pawn, move not safe.");
      return false;
    }
  }

  // console.log("Move is safe for the king.");
  return true;
}

// Function to get the available move for a pawn, including capture and promotion
function getPawnMove(currentSquare, player) {
  const file = currentSquare[0];
  const rank = parseInt(currentSquare[1]);
  const forwardMove = player === "white" ? rank + 1 : rank - 1;
  const newSquare = file + forwardMove;

  // Determine if the pawn is reaching the promotion rank
  const isPromotionRank =
    (forwardMove === 8 && player === "white") ||
    (forwardMove === 1 && player === "black");

  // Get the target square element
  const targetSquare = document.querySelector(`[data-position="${newSquare}"]`);

  // Check if the square is available for movement
  if (targetSquare) {
    // Handle capture on the promotion square
    if (targetSquare.childElementCount > 0) {
      const capturedPiece = targetSquare.querySelector(".piece");
      const capturedPieceType = capturedPiece.getAttribute("data-piece-type");
      targetSquare.removeChild(capturedPiece);

      // Update the captured pieces display
      CapturedPiecesDisplay(
        capturedPieceType,
        player === "white" ? "black" : "white"
      );
    }

    // Handle promotion if the pawn reaches the promotion rank
    if (isPromotionRank) {
      isValidPawnPromotion(currentSquare, newSquare, player);
      return null; // Exit as the promotion will be handled elsewhere
    }

    // If not a promotion, return the new square as a valid move
    if (!targetSquare.querySelector(".piece")) {
      return newSquare;
    }
  }

  return null;
}

// Get available moves for a specific piece
function getAvailableMoves(pieceType, currentSquare, player) {
  const moves = [];

  // Pawn movement
  if (pieceType === "pawn") {
    const forwardMove = getPawnMove(currentSquare, player);
    if (forwardMove) {
      moves.push([currentSquare, forwardMove]);
    }

    // Implement logic for pawn captures (diagonal attacks)
    const captures = getPawnCaptures(currentSquare, player);
    captures.forEach((captureMove) => {
      moves.push([currentSquare, captureMove]);
    });
  }

  return moves;
}

// Implement diagonal capture logic for pawn
function getPawnCaptures(currentSquare, player) {
  const file = currentSquare[0];
  const rank = parseInt(currentSquare[1]);
  const captureRank = player === "white" ? rank + 1 : rank - 1;
  const possibleCaptures = [];

  // Left diagonal capture
  const leftCapture = String.fromCharCode(file.charCodeAt(0) - 1) + captureRank;
  const leftTarget = document.getElementById(leftCapture);
  if (
    leftTarget &&
    leftTarget.querySelector(".piece") &&
    leftTarget.querySelector(".piece").getAttribute("data-color") !== player
  ) {
    possibleCaptures.push(leftCapture);
  }

  // Right diagonal capture
  const rightCapture =
    String.fromCharCode(file.charCodeAt(0) + 1) + captureRank;
  const rightTarget = document.getElementById(rightCapture);
  if (
    rightTarget &&
    rightTarget.querySelector(".piece") &&
    rightTarget.querySelector(".piece").getAttribute("data-color") !== player
  ) {
    possibleCaptures.push(rightCapture);
  }

  return possibleCaptures;
}

// Adding en passant logic
function isValidEnPassantMove(currentSquare, targetSquare, playerColor) {
  const file = currentSquare[0];
  const rank = parseInt(currentSquare[1]);
  const forwardMove = playerColor === "white" ? rank + 1 : rank - 1;

  const enPassantSquare = file + forwardMove;

  // Check if the target square is the valid en passant square
  if (targetSquare !== enPassantSquare) {
    return false;
  }

  // Check if the pawn is on the correct rank for en passant
  if (
    (playerColor === "white" && rank !== 5) ||
    (playerColor === "black" && rank !== 4)
  ) {
    return false;
  }

  // Check if there's an opponent's pawn in the correct position
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

  // Check if the opponent's pawn just moved two squares in the previous turn
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

// Execute en passant move
function executeEnPassant(currentSquare, targetSquare, playerColor) {
  const capturedPawnRank = playerColor === "white" ? "5" : "4";
  const capturedPawnSquare = targetSquare[0] + capturedPawnRank;

  // Remove the captured pawn
  const capturedPawn = document
    .getElementById(capturedPawnSquare)
    .querySelector(".piece");
  if (capturedPawn) {
    const capturedPieceType = capturedPawn.getAttribute("data-piece");
    capturedPawn.remove();

    // Call CapturedPiecesDisplay for the en passant capture
    CapturedPiecesDisplay(capturedPieceType, playerColor);
  }

  // Move the capturing pawn
  const movingPawn = document
    .getElementById(currentSquare)
    .querySelector(".piece");
  document.getElementById(targetSquare).appendChild(movingPawn);
}

// Check if the given piece can attack the king
function canPieceAttackKing(
  pieceType,
  piecePosition,
  kingPosition,
  opponentColor
) {
  switch (pieceType) {
    case "pawn":
      // Pawns attack diagonally, so no need for path check
      return canPawnAttack(kingPosition, piecePosition, opponentColor);
    case "rook":
      // Check if rook can attack the king and if there's no obstruction in the path
      return (
        isStraightLineMove(piecePosition, kingPosition) &&
        isPathClear(piecePosition, kingPosition)
      );
    case "bishop":
      // Check if bishop can attack the king and if there's no obstruction in the path
      return (
        isDiagonalMove(piecePosition, kingPosition) &&
        isPathClear(piecePosition, kingPosition)
      );
    case "queen":
      // Queen can attack both in straight line and diagonal, so check both and ensure path is clear
      return (
        (isStraightLineMove(piecePosition, kingPosition) ||
          isDiagonalMove(piecePosition, kingPosition)) &&
        isPathClear(piecePosition, kingPosition)
      );
    case "knight":
      // Knights jump over pieces, so no path obstruction check is needed
      return isValidKnightMove(piecePosition, kingPosition);
    case "king":
      // King moves only one square, so no need for path obstruction check
      return isValidKingMove(piecePosition, kingPosition);
    default:
      return false;
  }
}

// Function to check if a pawn can attack the king (special rules for pawns)
function canPawnAttack(fromSquare, toSquare, pawnColor) {
  // Pawns can only attack diagonally, so we check the appropriate diagonals
  const fromX = fromSquare[0].charCodeAt(0);
  const fromY = parseInt(fromSquare[1]);
  const toX = toSquare[0].charCodeAt(0);
  const toY = parseInt(toSquare[1]);

  if (pawnColor === "white") {
    // White pawns attack diagonally upward
    return fromY === toY + 1 && (fromX === toX + 1 || fromX === toX - 1);
  } else if (pawnColor === "black") {
    // Black pawns attack diagonally downward
    return fromY === toY - 1 && (fromX === toX + 1 || fromX === toX - 1);
  }

  return false;
}

// Function to validate if a move is valid for a pawn
function isValidPawnMove(fromSquare, toSquare, playerColor) {
  const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
  const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];
  const direction = playerColor === "white" ? 1 : -1;

  // Moving forward
  if (fromFile === toFile) {
    // First move can be two squares
    if (
      (playerColor === "white" && fromRank === 2) ||
      (playerColor === "black" && fromRank === 7)
    ) {
      return (
        toRank === fromRank + 2 * direction || toRank === fromRank + direction
      );
    }
    return toRank === fromRank + direction;
  }

  // Diagonal capture
  if (
    Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0)) === 1 &&
    toRank === fromRank + direction
  ) {
    return document.getElementById(toSquare).querySelector(".piece") !== null;
  }

  return false;
}

// Function to validate pawn promotion
function isValidPawnPromotion(fromSquare, toSquare, playerColor) {
  const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
  const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

  // Check if the pawn reached the promotion rank
  if (
    (toRank === 8 && playerColor === "white") ||
    (toRank === 1 && playerColor === "black")
  ) {
    return new Promise((resolve, _reject) => {
      // Show the promotion modal
      const modal = document.getElementById("promotionModal");
      modal.style.display = "block";

      // Define the event handler function
      const handlePromotionSelection = (piece) => {
        // Call the promotion handler
        handlePieceSelection(
          piece,
          resolve,
          toSquare,
          playerColor,
          initialBoardSetup
        );

        // Hide the modal after selection
        modal.style.display = "none";

        // Clean up event listeners to avoid accumulation
        document.getElementById("queen").onclick = null;
        document.getElementById("rook").onclick = null;
        document.getElementById("bishop").onclick = null;
        document.getElementById("knight").onclick = null;
      };

      // Add event listeners for each piece option
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

  return null; // Return null if it's not a promotion move
}

// Function to handle piece selection during promotion
function handlePieceSelection(piece, resolve, pawnPosition, currentPlayer) {
  const modal = document.getElementById("promotionModal");
  modal.style.display = "none";

  // Replace the pawn with the new piece in the board state
  initialBoardSetup[pawnPosition] = `${piece}-${currentPlayer}`;

  // Update the visual board to reflect the new piece
  const square = document.getElementById(pawnPosition);
  if (!square) {
    console.error(`Square with ID ${pawnPosition} not found.`);
    return;
  }

  // Clear the square and add the new piece visually
  square.innerHTML = "";
  const newPieceElement = createPieceElement(piece, currentPlayer);
  square.appendChild(newPieceElement);

  // Resolve the promise to continue game flow
  resolve(piece);
}

// Function to execute a promotion

function executePromotion(fromSquare, toSquare, playerColor, selectedPiece) {
  const targetSquare = document.getElementById(toSquare);
  const sourceSquare = document.getElementById(fromSquare);

  if (!targetSquare) return;

  const promotedPiece = document.createElement("img");
  promotedPiece.src = `assets/images/chess-pieces/${selectedPiece}-${playerColor}.png`;
  promotedPiece.classList.add("piece");
  promotedPiece.setAttribute("data-piece", `${selectedPiece}-${playerColor}`);
  promotedPiece.setAttribute("data-color", playerColor);

  targetSquare.innerHTML = "";
  targetSquare.appendChild(promotedPiece);

  if (sourceSquare) {
    sourceSquare.innerHTML = "";
  }

  initialBoardSetup[toSquare] = `${selectedPiece}-${playerColor}`;
  delete initialBoardSetup[fromSquare];

  currentPlayer = playerColor === "white" ? "black" : "white";
  promotionSound.play();
}

// Function to check if a square contains an opponent piece
function isOpponentPieceAtSquare(square, playerColor) {
  const pieceAtSquare = document
    .getElementById(square)
    ?.querySelector(".piece");
  return (
    pieceAtSquare && pieceAtSquare.getAttribute("data-color") !== playerColor
  );
}

// Function to validate if a move is valid for a rook
function isValidRookMove(fromSquare, toSquare) {
  return (
    isStraightLineMove(fromSquare, toSquare) &&
    isPathClear(fromSquare, toSquare)
  );
}

// Function to validate if a move is valid for a bishop
function isValidBishopMove(fromSquare, toSquare) {
  return (
    isDiagonalMove(fromSquare, toSquare) && isPathClear(fromSquare, toSquare)
  );
}

// Function to validate if a move is valid for a queen
function isValidQueenMove(fromSquare, toSquare) {
  return (
    (isStraightLineMove(fromSquare, toSquare) ||
      isDiagonalMove(fromSquare, toSquare)) &&
    isPathClear(fromSquare, toSquare)
  );
}

// Function to validate if a move is valid for a knight
function isValidKnightMove(fromSquare, toSquare) {
  const fileDiff = Math.abs(
    fromSquare[0].charCodeAt(0) - toSquare[0].charCodeAt(0)
  );
  const rankDiff = Math.abs(fromSquare[1] - toSquare[1]);
  return (
    (fileDiff === 2 && rankDiff === 1) || (fileDiff === 1 && rankDiff === 2)
  );
}

/// Check if the king's move is valid (escaping check)
function isValidKingMove(fromSquare, toSquare, playerColor) {
  const fileDiff = Math.abs(
    fromSquare[0].charCodeAt(0) - toSquare[0].charCodeAt(0)
  );
  const rankDiff = Math.abs(fromSquare[1] - toSquare[1]);

  // King can move one square in any direction
  if (fileDiff <= 1 && rankDiff <= 1) {
    return isKingMoveSafe(fromSquare, toSquare, playerColor); // Check if moving the king will resolve check
  }

  // Check for castling move
  if (fileDiff === 2 && rankDiff === 0) {
    return isValidCastling(fromSquare, toSquare, playerColor);
  }

  return false;
}

function isValidCastling(kingSquare, targetSquare, playerColor) {
  const rank = playerColor === "white" ? "1" : "8";
  const isKingsideCastling = targetSquare[0] === "g";
  const rookFile = isKingsideCastling ? "h" : "a";
  const rookSquare = rookFile + rank;
  const filesToCheck = isKingsideCastling ? ["f", "g"] : ["d", "c", "b"];

  // Check if path is clear
  for (let f of filesToCheck) {
    if (document.getElementById(f + rank).querySelector(".piece")) {
      //Update Console log, DONT FORGET
      // console.log(`Castling invalid: Piece found at ${f}${rank}`);
      return false;
    }
  }

  // Check if the player has already castled
  if (
    (playerColor === "white" && whiteCastled) ||
    (playerColor === "black" && blackCastled)
  ) {
    // console.log('Castling invalid: Player has already castled');
    return false;
  }

  // Check if king and rook are in their initial positions
  if (
    kingSquare !== "e" + rank ||
    !document.getElementById(rookSquare).querySelector(".piece")
  ) {
    // console.log('Castling invalid: King or rook not in initial position');
    return false;
  }

  // Check if king is not in check and doesn't pass through check
  const kingPath = rookFile === "a" ? ["e", "d", "c"] : ["e", "f", "g"];
  for (let f of kingPath) {
    if (isKingInCheck(playerColor, f + rank)) {
      // console.log(`Castling invalid: King in check or passes through check at ${f}${rank}`);
      return false;
    }
  }

  // console.log('Castling is valid');
  return true;
}

function executeCastling(kingSquare, targetSquare, playerColor) {
  const rank = playerColor === "white" ? "1" : "8";
  const isKingsideCastling = targetSquare[0] === "g";
  const rookFile = isKingsideCastling ? "h" : "a";
  const rookSquare = rookFile + rank;
  const newRookFile = isKingsideCastling ? "f" : "d";
  const newRookSquare = newRookFile + rank;

  const king = document.getElementById(kingSquare).querySelector(".piece");
  const rook = document.getElementById(rookSquare).querySelector(".piece");

  if (!king || !rook) {
    console.error("Castling failed: King or rook is missing.");
    return;
  }

  const kingFileDiff = Math.abs(
    kingSquare.charCodeAt(0) - targetSquare.charCodeAt(0)
  );
  if (kingFileDiff === 2) {
    document.getElementById(targetSquare).appendChild(king);
    document.getElementById(newRookSquare).appendChild(rook);

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
  const playerPieces = document.querySelectorAll(
    `.piece[data-color='${playerColor}']`
  );

  for (let piece of playerPieces) {
    const pieceType = piece.getAttribute("data-piece").split("-")[0];
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

    // Check if this piece can move to a square that blocks the check
    const blockingSquares = getBlockingSquares(
      attackingPiecePosition,
      kingPosition
    );
    for (let square of blockingSquares) {
      if (isValidPieceMove(pieceType, piecePosition, square, playerColor)) {
        return true; // Piece can block the check
      }
    }
  }

  return false; // No piece can block or capture
}

function getBlockingSquares(_attackerPosition, _kingPosition) {
  // Calculate the squares between the attacker and the king (if it's a sliding piece)
  // This would apply for rooks, bishops, and queens.
  let blockingSquares = [];
  // Logic to calculate the squares between the attacker and king
  return blockingSquares;
}

// Helper function to get all adjacent squares
function getAdjacentSquares(position) {
  const [file, rank] = position.split("");
  const fileCode = file.charCodeAt(0);
  const rankNum = parseInt(rank);
  const adjacentSquares = [];

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const newFile = String.fromCharCode(fileCode + i);
      const newRank = rankNum + j;
      if (newFile >= "a" && newFile <= "h" && newRank >= 1 && newRank <= 8) {
        adjacentSquares.push(`${newFile}${newRank}`);
      }
    }
  }

  return adjacentSquares;
}

// Validate rook movement (straight lines)
function isStraightLineMove(fromSquare, toSquare) {
  const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
  const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

  return fromFile === toFile || fromRank === toRank;
}

// Validate bishop movement (diagonals)
function isDiagonalMove(fromSquare, toSquare) {
  const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
  const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

  return (
    Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0)) ===
    Math.abs(fromRank - toRank)
  );
}

// Check for clear path in both straight-line and diagonal moves
function isPathClear(fromSquare, toSquare) {
  const [fromFile, fromRank] = [
    fromSquare.charCodeAt(0),
    parseInt(fromSquare[1]),
  ];
  const [toFile, toRank] = [toSquare.charCodeAt(0), parseInt(toSquare[1])];

  const fileStep = Math.sign(toFile - fromFile);
  const rankStep = Math.sign(toRank - fromRank);

  let currentFile = fromFile + fileStep;
  let currentRank = fromRank + rankStep;

  while (currentFile !== toFile || currentRank !== toRank) {
    const intermediateSquare = String.fromCharCode(currentFile) + currentRank;
    const squareElement = document.getElementById(intermediateSquare);

    if (squareElement && squareElement.querySelector(".piece")) {
      return false; // Path is blocked by another piece
    }

    currentFile += fileStep;
    currentRank += rankStep;
  }

  return true; // Path is clear
}

function handlePieceClick(event) {
  if (gameIsOver) return; // Game over, no further moves allowed
  if (currentPlayer !== "white") return;
  const piece = event.target;
  const pieceColor = piece.getAttribute("data-color");
  if (pieceColor !== currentPlayer) return;

  selectedPiece = {
    pieceElement: piece,
    currentSquare: piece.parentElement.id,
    color: pieceColor,
    pieceType: piece.getAttribute("data-piece").split("-")[0], // Capture piece type here
  };
  console.log(
    `Selected ${selectedPiece.pieceType} on ${selectedPiece.currentSquare}`
  );
  highlightMoves(selectedPiece, initialBoardSetup);
}

// Function to handle move completion and check game state
function handleMoveCompletion() {
  // console.log("Move completed, switching player and checking game state...");

  // Check for king capture (game over condition)
  const whiteKing = findKing("white");
  const blackKing = findKing("black");

  // console.log("White king found:", whiteKing);
  // console.log("Black king found:", blackKing);

  // End the game if a king is captured
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

  // After each move, check the game state (check, checkmate)
  const isCheckmate = checkGameState();
  console.log("Is checkmate:", isCheckmate);

  // If it's checkmate, game over
  if (isCheckmate) {
    console.log("Checkmate detected. Game over.");
    return;
  }

  // If it's not checkmate, continue
  if (!isCheckmate) {
    console.log("Not checkmate. Game continues.");
  }

  // Re-assign listeners to ensure new pieces get event listeners
  // console.log("Reassigning listeners...");
  reassignListeners();

  // Switch player after move
  console.log("Switching player...");
  switchPlayer();
}

document.getElementById("restart").addEventListener("click", function () {
  console.log("Restart button clicked");
  // Reset game state
  gameIsOver = false;
  console.log("Game state reset, gameIsOver:", gameIsOver);

  // Clear board and reinitialize
  console.log("Initializing board...");
  initializeBoard();

  // Reassign listeners
  console.log("Reassigning listeners...");
  reassignListeners();
});

// Handle moving a piece
function handleSquareClick(event) {
  if (gameIsOver) return;
  if (!selectedPiece) return;

  const targetSquare = event.target.closest(".square");
  const currentSquare = selectedPiece.pieceElement.parentElement;
  const pieceType = selectedPiece.pieceType;
  const playerColor = selectedPiece.color;

  // Let isValidPieceMove handle all validation
  if (
    isValidPieceMove(pieceType, currentSquare.id, targetSquare.id, playerColor)
  ) {
    executeMove(currentSquare, targetSquare, pieceType, playerColor);
    handleMoveCompletion();
  }
}

function executeMove(currentSquare, targetSquare, pieceType, playerColor) {
  clearHighlights();
  // Handle captures
  if (targetSquare.querySelector(".piece")) {
    const capturedPiece = targetSquare.querySelector(".piece");
    const capturedPieceType = capturedPiece.getAttribute("data-piece");
    targetSquare.removeChild(capturedPiece);
    CapturedPiecesDisplay(capturedPieceType, playerColor);
    captureSound.play(); // Add capture sound
  } else {
    moveSound.play(); // Add regular move sound
  }

  // Execute the move
  targetSquare.appendChild(selectedPiece.pieceElement);
  selectedPiece = null;
}

// Validate move function for all pieces
function isValidPieceMove(pieceType, fromSquare, toSquare, playerColor) {
  // Check for pawn promotion first
  if (
    pieceType === "pawn" &&
    isValidPawnPromotion(fromSquare, toSquare, playerColor)
  ) {
    return true;
  }

  // Check for castling
  if (
    pieceType === "king" &&
    Math.abs(toSquare.charCodeAt(0) - fromSquare.charCodeAt(0)) === 2
  ) {
    return isValidCastling(fromSquare, toSquare, playerColor);
  }

  // Check for en passant
  if (
    pieceType === "pawn" &&
    isValidEnPassantMove(fromSquare, toSquare, playerColor)
  ) {
    return true;
  }

  let validMove = false;

  // Validate regular moves based on piece type
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

  // Check if target square contains a piece of the same color
  const targetSquarePiece = document
    .getElementById(toSquare)
    .querySelector(".piece");
  if (
    targetSquarePiece &&
    targetSquarePiece.getAttribute("data-color") === playerColor
  ) {
    return false;
  }

  // If the move doesn't follow basic rules, return false
  if (!validMove) return false;

  // If the king is in check, only allow moves that resolve the check
  if (isKingInCheck(playerColor)) {
    return simulateMoveAndCheck(fromSquare, toSquare, playerColor);
  }

  return validMove;
}

// Simulate the move and check if the king is safe after that move, with logging
function simulateMoveAndCheck(fromSquare, toSquare, playerColor) {
  const originalFromSquare = document.getElementById(fromSquare);
  const originalToSquare = document.getElementById(toSquare);

  const movedPiece = originalFromSquare.querySelector(".piece");
  const capturedPiece = originalToSquare.querySelector(".piece");

  // Simulate the move
  originalToSquare.appendChild(movedPiece);
  if (capturedPiece) {
    capturedPiece.remove();
  }

  // Check if the king is still in check
  const kingInCheck = isKingInCheck(playerColor);

  // Undo the move
  originalFromSquare.appendChild(movedPiece);
  if (capturedPiece) {
    originalToSquare.appendChild(capturedPiece);
  }

  return !kingInCheck;
}

/* ================================
   3. Turn Management
================================ */
// Manage the turns between the human and AI players.

let selectedPiece = null;
let currentPlayer = "white"; // Human player plays white, AI plays black

// Switch between human and AI turns
function switchPlayer() {
  if (gameIsOver) return; // Prevent switching if the game is over

  currentPlayer = currentPlayer === "white" ? "black" : "white";
  if (currentPlayer === "black") {
    getBestMoveFromStockfish(); // Trigger AI move when it's the AI's turn
  }
}

// AI turn: Ask Stockfish for the best move
function getBestMoveFromStockfish() {
  const fen = boardToFEN();
  //console.log(`Sending FEN to Stockfish: ${fen}`);
  sendToStockfish(`position fen ${fen}`);
  sendToStockfish("go depth 10");
}

// Apply AI move
function makeAIMove(move) {
  //----------------------------------------------------------------------//
  // Disable AI moves for testing
  // currentPlayer = "white"; // Switch back to the human player
  // return;  // Skip the AI move but still switch the player back to "white"
  //----------------------------------------------------------------------//

  const fromSquare = move.slice(0, 2);
  const toSquare = move.slice(2, 4);
  const pieceToMove = document
    .getElementById(fromSquare)
    .querySelector(".piece");
  const targetSquare = document.getElementById(toSquare);

  if (!pieceToMove) {
    console.error(`No piece found on ${fromSquare}`);
    return;
  }

  // Check if there's a piece to capture
  if (targetSquare.childElementCount > 0) {
    const capturedPiece = targetSquare.querySelector(".piece");
    const capturedPieceType = capturedPiece.getAttribute("data-piece");
    targetSquare.removeChild(capturedPiece);

    // Call CapturedPiecesDisplay for AI's capture
    CapturedPiecesDisplay(capturedPieceType, "black");
  }

  // Move the AI's piece
  targetSquare.appendChild(pieceToMove);
  currentPlayer = "white"; // Switch back to the human player

  // Log the AI's move
  console.log(`AI moved from ${fromSquare} to ${toSquare}`);

  // Check if the king is in check after the AI's move
  if (isKingInCheck("white")) {
    console.log("Your king is in check!");
  }
}

/* ================================
   4. Game State
================================ */
// Game state management, FEN conversion, and handling different player states.

// General function to check if the player's king is in check
function isKingInCheck(playerColor) {
  const kingPosition = findKing(playerColor);
  if (!kingPosition) {
    console.error(
      `Cannot check if king is in check. King not found for ${playerColor}`
    );
    return false;
  }

  const opponentColor = playerColor === "white" ? "black" : "white";
  const opponentPieces = document.querySelectorAll(
    `.piece[data-color='${opponentColor}']`
  );

  // Check if any opponent piece can attack the player's king
  for (let piece of opponentPieces) {
    const pieceType = piece.getAttribute("data-piece")?.split("-")[0];
    const piecePosition = piece.parentElement?.id;

    if (!pieceType || !piecePosition) {
      console.warn(`Malformed piece found: ${piece.outerHTML}`);
      continue;
    }

    if (
      canPieceAttackKing(pieceType, piecePosition, kingPosition, opponentColor)
    ) {
      console.log(
        `${playerColor}'s king at ${kingPosition} is in check from ${opponentColor}'s ${pieceType} at ${piecePosition}.`
      );
      return true; // Break early once a threat is found
    }
  }

  // console.log(`${playerColor}'s king at ${kingPosition} is safe.`);
  return false; // King is safe if no threats are found
}

// Function to check the current state of the game
function checkGameState() {
  const whiteKingInCheck = isKingInCheck("white");
  const blackKingInCheck = isKingInCheck("black");

  if (whiteKingInCheck) {
    checkSound.play();
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

  if (blackKingInCheck) {
    checkSound.play();
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

// Function to check if the player is in checkmate
function isCheckmate(color) {
  // console.log(`${color}'s king is in check, checking for possible escape...`);

  if (!isKingInCheck(color)) {
    console.log(`${color}'s king is not in check, so not checkmate.`);
    return false; // If not in check, it cannot be checkmate
  }

  const kingPosition = findKing(color);
  const possibleKingMoves = getKingPossibleMoves(kingPosition, color);

  // Check if the king can move out of check
  for (let move of possibleKingMoves) {
    if (isKingMoveSafe(kingPosition, move, color)) {
      console.log(`King can escape to ${move}, not checkmate.`);
      return false;
    }
  }

  // Check if any other piece can block the check or capture the attacker
  const opponentColor = color === "white" ? "black" : "white";
  const opponentPieces = document.querySelectorAll(
    `.piece[data-color='${opponentColor}']`
  );

  for (let piece of opponentPieces) {
    const pieceType = piece.getAttribute("data-piece").split("-")[0];
    const piecePosition = piece.parentElement.id;

    // Check if any opponent piece can capture the checking piece or block the check
    if (isValidPieceMove(pieceType, piecePosition, move, color)) {
      console.log(
        `${pieceType} at ${piecePosition} can block the check by moving to ${move}. Not checkmate.`
      );
      return false; // A piece can block or capture, so no checkmate
    }
  }

  console.log(
    `${color}'s king has no valid moves and no pieces can block or capture. Checkmate.`
  );
  return true; // No valid moves, no block, it's checkmate
}

// Store captured pieces
let capturedWhitePieces = [];
let capturedBlackPieces = [];

// Function to display captured pieces
function CapturedPiecesDisplay(capturedPiece, playerColor) {
  if (!capturedPiece) return;

  const capturedArea = document.getElementById(
    playerColor === "white" ? "blackCaptured" : "whiteCaptured"
  );
  const pieceImage = document.createElement("img");
  // Use only the captured piece's original name
  pieceImage.src = `assets/images/chess-pieces/${capturedPiece}.png`;
  pieceImage.classList.add("captured-piece");
  capturedArea.appendChild(pieceImage);
}

function updateCapturedPiecesDisplay(capturedPiece) {
  const container = document.getElementById(
    `captured-${capturedPiece.color}-pieces`
  );
  const pieceElement = document.createElement("div");
  pieceElement.className = `captured-piece ${capturedPiece.type}-${capturedPiece.color}`;
  container.appendChild(pieceElement);
}

// Game over function
function gameOver(winner) {
  console.log(`Game over! ${winner} wins!`);
  alert(`Game over! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`);

  // Set gameIsOver to true to prevent further actions
  gameIsOver = true;

  // Disable further moves by removing the click event listeners
  document.querySelectorAll(".square").forEach((square) => {
    square.removeEventListener("click", handleSquareClick);
  });
  document.querySelectorAll(".piece").forEach((piece) => {
    piece.removeEventListener("click", handlePieceClick);
  });

  // Disable Stockfish communication
  stockfish.terminate();

  // Show the restart button
  const restartButton = document.getElementById("restart");
  if (restartButton) {
    restartButton.style.display = "block";
    restartButton.addEventListener("click", resetGame);
  }

  // Update UI to reflect game over state
  updateGameOverUI(winner);
}

let gameIsOver = false; // Global flag to track if the game has ended

// Function to update UI for game over state
function updateGameOverUI(winner) {
  const gameStatus = document.getElementById("game-status");
  if (gameStatus) {
    gameStatus.textContent = `Game Over - ${winner} wins!`;
    gameStatus.style.display = "block";
  }
}

// Function to reset the game
function resetGame() {
  gameIsOver = false;
  clearBoard();
  initializeBoard();
  resetGameState();
  addListeners();

  const gameStatus = document.getElementById("game-status");
  if (gameStatus) {
    gameStatus.style.display = "none";
  }

  document.getElementById("restart").style.display = "none";

  // Reset game-specific variables
  selectedPiece = null;
  currentTurn = "white";
  moveHistory = [];

  // Clear captured pieces arrays and display
  capturedWhitePieces = [];
  capturedBlackPieces = [];
  document.getElementById("whiteCaptured").innerHTML = "";
  document.getElementById("blackCaptured").innerHTML = "";

  // Clear any highlighted squares
  document.querySelectorAll(".square").forEach((square) => {
    square.classList.remove("highlight");
  });

  // Reset the move counter
  moveCount = 1;

  // Update the UI to reflect the initial game state
  updateTurnIndicator();
  updateMoveHistory();

  // Reinitialize Stockfish
  if (stockfish) {
    stockfish.terminate();
  }
  stockfish = new Worker("assets/js/stockfish-16.1-lite-single.js");
  setupStockfishListeners();
}

/* ================================
   5. Initialize Board & Add Listeners
================================ */
// Initialize the board with pieces and colors and add event listeners for interaction.

// Initialize board and listeners on page load
window.onload = () => {
  initializeBoard();
  addListeners();
};

// Add event listeners for pieces and squares
function addListeners() {
  document.querySelectorAll(".piece").forEach((piece) => {
    piece.addEventListener("click", handlePieceClick); // Allow multiple clicks
  });

  document.querySelectorAll(".square").forEach((square) => {
    square.addEventListener("click", handleSquareClick); // Allow multiple clicks
  });
}

// Reassign listeners to pieces and squares after a move
function reassignListeners() {
  if (gameIsOver) return; // Don't reassign listeners if the game is over

  // Remove existing listeners to avoid duplicate bindings
  document.querySelectorAll(".piece").forEach((piece) => {
    piece.removeEventListener("click", handlePieceClick);
  });
  document.querySelectorAll(".square").forEach((square) => {
    square.removeEventListener("click", handleSquareClick);
  });

  // Add listeners again for all pieces and squares
  addListeners();
}
