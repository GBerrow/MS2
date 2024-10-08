/* ================================
   1. Plan the Game
================================ */
// In this section, we initialize the Stockfish engine and handle AI vs player interactions.

// Initialize Stockfish Worker using the JavaScript file
const stockfish = new Worker("assets/js/stockfish-16.1-lite-single.js");

// Handle Stockfish response
stockfish.onmessage = function (event) {
    const bestMoveMatch = event.data.match(/bestmove\s([a-h][1-8][a-h][1-8])/);
    if (bestMoveMatch) {
        const bestMove = bestMoveMatch[1];
        console.log(`Stockfish's best move: ${bestMove}`);
        makeAIMove(bestMove); // Apply Stockfish's move to the board
    } else {
        // Optional: Log only important Stockfish messages, like game over or mate
        if (event.data.includes("mate") || event.data.includes("game over")) {
            console.log("Stockfish analysis:", event.data);
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

/* ================================
   2. Board Structure
================================ */
// Set up the initial board structure with the pieces and squares.

// Chess Board Setup
const initialBoardSetup = {
    a8: "rook-black", b8: "knight-black", c8: "bishop-black", d8: "queen-black",
    e8: "king-black", f8: "bishop-black", g8: "knight-black", h8: "rook-black",
    a7: "pawn-black", b7: "pawn-black", c7: "pawn-black", d7: "pawn-black",
    e7: "pawn-black", f7: "pawn-black", g7: "pawn-black", h7: "pawn-black",
    a1: "rook-white", b1: "knight-white", c1: "bishop-white", d1: "queen-white",
    e1: "king-white", f1: "bishop-white", g1: "knight-white", h1: "rook-white",
    a2: "pawn-white", b2: "pawn-white", c2: "pawn-white", d2: "pawn-white",
    e2: "pawn-white", f2: "pawn-white", g2: "pawn-white", h2: "pawn-white"
};

/* ================================
   3. Piece Classes & Movement Logic
================================ */
// In this section, we define piece interaction, including movement and validation.

let selectedPiece = null;
let currentPlayer = "white"; // Human player plays white, AI plays black

// Initialize the board with pieces and colors
function initializeBoard() {
    console.log("Initializing board..."); // Check if this line appears in the console
    let isLightSquare;
    
    for (const [squareId, piece] of Object.entries(initialBoardSetup)) {
        const square = document.getElementById(squareId);
        const img = document.createElement("img");
        img.src = `assets/images/chess-pieces/${piece}.png`;
        img.classList.add("piece");
        img.setAttribute("data-piece", piece);
        img.setAttribute("data-color", piece.split("-")[1]);
        square.appendChild(img);
    }

    // Assign diagonal colors dynamically using XOR logic
    const squares = document.querySelectorAll(".square");
    squares.forEach((square, index) => {
        // Extract row and column from the index
        const row = Math.floor(index / 8);
        const col = index % 8;

        // Apply XOR logic for diagonal coloring
        isLightSquare = (row % 2) === (col % 2); // True for light square, false for dark
        if (isLightSquare) {
            square.style.backgroundColor = "#f0d9b5"; // Light square
        } else {
            square.style.backgroundColor = "#b58863"; // Dark square
        }
    });
}

// Convert the board state to FEN format for Stockfish
function boardToFEN() {
    let fen = "";
    const rows = [];
    for (let rank = 8; rank >= 1; rank--) {
        let row = "";
        let emptyCount = 0;
        for (let file of "abcdefgh") {
            const squareId = `${file}${rank}`;
            const square = document.getElementById(squareId);
            const piece = square.querySelector(".piece");
            if (!piece) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    row += emptyCount;
                    emptyCount = 0;
                }
                const pieceType = piece.getAttribute("data-piece").split("-")[0];
                const color = piece.getAttribute("data-color");
                const notation = {
                    pawn: "p", rook: "r", knight: "n", bishop: "b",
                    queen: "q", king: "k"
                }[pieceType];
                row += color === "white" ? notation.toUpperCase() : notation;
            }
        }
        if (emptyCount > 0) row += emptyCount;
        rows.push(row);
    }
    return rows.join("/") + ` ${currentPlayer === "white" ? "w" : "b"} - - 0 1`;
}

/* ================================
   4. Implement Movement Logic
================================ */
// Movement logic for player and AI turns, along with handling piece clicks and square selections.

function handlePieceClick(event) {
    if (currentPlayer !== "white") return;
    const piece = event.target;
    const pieceColor = piece.getAttribute("data-color");
    if (pieceColor !== currentPlayer) return;

    selectedPiece = {
        pieceElement: piece,
        currentSquare: piece.parentElement.id,
        color: pieceColor,
        pieceType: piece.getAttribute("data-piece").split("-")[0] // Capture piece type here
    };
    console.log(`Selected ${selectedPiece.pieceType} on ${selectedPiece.currentSquare}`);
}

// Function to handle move completion and check game state
function handleMoveCompletion() {
    console.log("Move completed, switching player and checking game state...");
    
    // Switch player after move
    switchPlayer();

    // After each move, check the game state (check, checkmate, or king capture)
    checkGameState();

    // Check for king capture (game over condition)
    const whiteKing = findKing('white');
    const blackKing = findKing('black');

    if (!whiteKing) {
        gameOver('black');
        return;
    }
    if (!blackKing) {
        gameOver('white');
        return;
    }
}

// Game over function (integrated directly inside handleMoveCompletion)
function gameOver(winner) {
    console.log(`Game over! ${winner} wins!`);
    alert(`Game over! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`);

    // Disable further moves by removing the click event listeners or blocking actions
    document.querySelectorAll('.square').forEach(square => {
        square.removeEventListener('click', handleSquareClick);
    });

    // Show a restart button (assuming you have one)
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
        restartButton.style.display = 'block';
    }
}

// Handle moving a piece
function handleSquareClick(event) {
    if (!selectedPiece) return;

    const targetSquare = event.target.closest('.square'); // Ensure we target the square itself
    const currentSquare = selectedPiece.pieceElement.parentElement;

    // Prevent moving the piece to its current square
    if (targetSquare === currentSquare) {
        return;
    }

    // Validate the move based on the selected piece's type and the squares involved
    const isValidMove = isValidPieceMove(
        selectedPiece.pieceType,
        currentSquare.id,
        targetSquare.id,
        selectedPiece.color
    );

    if (!isValidMove) {
        console.log(`Invalid move for piece: ${selectedPiece.pieceType} from ${currentSquare.id} to ${targetSquare.id}`);
        return;
    }

    // Check if the target square contains an opponent's piece
    const targetPiece = targetSquare.querySelector('.piece');
    if (targetPiece) {
        const targetPieceColor = targetPiece.getAttribute('data-color');
        if (targetPieceColor === selectedPiece.color) {
            console.log("Cannot move to a square occupied by your own piece.");
            return;
        } else {
            // Capture the opponent's piece
            targetSquare.removeChild(targetPiece);
        }
    }

    // Move the selected piece to the target square
    targetSquare.appendChild(selectedPiece.pieceElement);
    selectedPiece = null;

    // Call handleMoveCompletion to switch players and check game state after every valid move
    handleMoveCompletion();
}

// Fix queen's movement logic in isValidPieceMove
function isValidPieceMove(pieceType, fromSquare, toSquare, color) {
    switch (pieceType) {
        case 'pawn':
            return isValidPawnMove(fromSquare, toSquare, color);
        case 'rook':
            return isStraightLineMove(fromSquare, toSquare) && isPathClear(fromSquare, toSquare);
        case 'bishop':
            return isDiagonalMove(fromSquare, toSquare) && isPathClear(fromSquare, toSquare);
        case 'queen':
            return (isStraightLineMove(fromSquare, toSquare) || isDiagonalMove(fromSquare, toSquare)) && isPathClear(fromSquare, toSquare);
        case 'knight':
            return isKnightMove(fromSquare, toSquare); // Knights can jump over pieces
        case 'king':
            return isKingMove(fromSquare, toSquare) && isKingMoveSafe(fromSquare, toSquare, color);  
        default:
            return false;
    }
}

/* ================================
   5. Turn Management
================================ */
// Manage the turns between the human and AI players.

// Switch between human and AI turns
function switchPlayer() {
    currentPlayer = currentPlayer === "white" ? "black" : "white";
    if (currentPlayer === "black") {
        getBestMoveFromStockfish(); // Trigger AI move when it's the AI's turn
    }
}

// AI turn: Ask Stockfish for the best move
function getBestMoveFromStockfish() {
    const fen = boardToFEN();
    console.log(`Sending FEN to Stockfish: ${fen}`);
    sendToStockfish(`position fen ${fen}`);
    sendToStockfish("go depth 10");
}

// Apply AI move
function makeAIMove(move) {
    const fromSquare = move.slice(0, 2);
    const toSquare = move.slice(2, 4);
    const pieceToMove = document.getElementById(fromSquare).querySelector(".piece");
    const targetSquare = document.getElementById(toSquare);
    
    if (!pieceToMove) {
        console.error(`No piece found on ${fromSquare}`);
        return;
    }
    
    // Remove any piece on the target square (capture logic)
    if (targetSquare.childElementCount > 0) {
        targetSquare.removeChild(targetSquare.firstChild);
    }

    // Move the AI's piece
    targetSquare.appendChild(pieceToMove);
    currentPlayer = "white"; // Switch back to the human player
}

/* ================================
   6. Game State
================================ */
// Game state management, FEN conversion, and handling different player states.

// Helper function to find the king's position on the board
function findKing(player) {
    const kingPiece = document.querySelector(`.piece[data-piece='king-${player}']`);
    if (!kingPiece) {
        console.warn(`${player}'s king has been captured! Game over.`);
        handleGameOver(player === "white" ? "black" : "white");  // Call game over logic with the winning player
        return null;  // Return null as the king is no longer on the board
    }
    const position = kingPiece.parentElement.id;
    console.log(`${player}'s king is at ${position}`);
    return position;
}

// Ensure that the king is not in check after each move
function isKingInCheck(player) {
    const kingPosition = findKing(player);
    const opponent = player === 'white' ? 'black' : 'white';

    const opponentPieces = document.querySelectorAll(`.piece[data-color='${opponent}']`);
    for (let piece of opponentPieces) {
        const pieceType = piece.getAttribute('data-piece').split('-')[0];
        const currentSquare = piece.parentElement.id;

        // If any opponent piece can attack the king, return true
        if (canPieceAttack(pieceType, currentSquare, kingPosition, opponent)) {
            console.log(`${opponent}'s ${pieceType} can attack ${player}'s king!`);
            return true;
        }
    }
    return false;  // King is safe
}

// Function to check the current state of the game
function checkGameState() {
    console.log("Checking game state...");
    
    const whiteKingInCheck = isKingInCheck('white');
    const blackKingInCheck = isKingInCheck('black');

    // Check if white's king is in check
    if (whiteKingInCheck) {
        console.log("White's king is in check.");
        if (isCheckmate('white')) {
            gameOver('black');  // Black wins
            return;
        }
    }

    // Check if black's king is in check
    if (blackKingInCheck) {
        console.log("Black's king is in check.");
        if (isCheckmate('black')) {
            gameOver('white');  // White wins
            return;
        }
    }
}

// Function to check if the player is in checkmate
function isCheckmate(player) {
    const allPieces = document.querySelectorAll(`.piece[data-color='${player}']`);
    
    for (let piece of allPieces) {
        const pieceType = piece.getAttribute('data-piece').split('-')[0];
        const currentSquare = piece.parentElement.id;
        const availableMoves = getAvailableMoves(pieceType, currentSquare, player);

        // If any piece has at least one valid move, it's not checkmate
        for (let move of availableMoves) {
            const [fromSquare, toSquare] = move;

            // Simulate the move to see if it resolves the check
            if (isValidPieceMove(pieceType, fromSquare, toSquare, player)) {
                return false; // Player has a valid move, not checkmate
            }
        }
    }

    return true; // No valid moves, this is checkmate
}

// Function to get the available move for a pawn
function getPawnMove(currentSquare, player) {
    const file = currentSquare[0];
    const rank = parseInt(currentSquare[1]);
    const forwardMove = player === 'white' ? rank + 1 : rank - 1;
    const newSquare = file + forwardMove;

    // Check if the target square is empty and return the move
    const targetSquare = document.getElementById(newSquare);
    if (targetSquare && !targetSquare.querySelector('.piece')) {
        return newSquare;
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
        captures.forEach(captureMove => {
            moves.push([currentSquare, captureMove]);
        });
    }

    return moves;
}

// Implement diagonal capture logic for pawn 
function getPawnCaptures(currentSquare, player) {
    const file = currentSquare[0];
    const rank = parseInt(currentSquare[1]);
    const captureRank = player === 'white' ? rank + 1 : rank - 1;
    const possibleCaptures = [];

    // Left diagonal capture
    const leftCapture = String.fromCharCode(file.charCodeAt(0) - 1) + captureRank;
    const leftTarget = document.getElementById(leftCapture);
    if (leftTarget && leftTarget.querySelector('.piece') && leftTarget.querySelector('.piece').getAttribute('data-color') !== player) {
        possibleCaptures.push(leftCapture);
    }

    // Right diagonal capture
    const rightCapture = String.fromCharCode(file.charCodeAt(0) + 1) + captureRank;
    const rightTarget = document.getElementById(rightCapture);
    if (rightTarget && rightTarget.querySelector('.piece') && rightTarget.querySelector('.piece').getAttribute('data-color') !== player) {
        possibleCaptures.push(rightCapture);
    }

    return possibleCaptures;
}

// Check if moving the king would put it in check
function isKingMoveSafe(fromSquare, toSquare, color) {
    // Temporarily move the king to the destination square
    const originalSquare = document.getElementById(fromSquare);
    const targetSquare = document.getElementById(toSquare);
    const movedPiece = originalSquare.querySelector('.piece');
    const targetPiece = targetSquare.querySelector('.piece'); // To restore in case of undo

    // Move the king temporarily
    targetSquare.appendChild(movedPiece);

    // Check if the move puts the king in check
    const kingInCheck = isKingInCheck(color);

    // Undo the temporary move
    originalSquare.appendChild(movedPiece);
    if (targetPiece) {
        targetSquare.appendChild(targetPiece); // Restore captured piece if any
    }

    // If the king is still in check, return false
    return !kingInCheck;
}

// Check if a piece can attack the given position
function canPieceAttack(pieceType, fromSquare, toSquare, color) {
    // Rook or Queen moves in straight lines (horizontal or vertical)
    if (pieceType === "rook" || pieceType === "queen") {
        return isStraightLineMove(fromSquare, toSquare) && isPathClear(fromSquare, toSquare);
    }
    // Bishop or Queen moves diagonally
    else if (pieceType === "bishop" || pieceType === "queen") {
        return isDiagonalMove(fromSquare, toSquare) && isPathClear(fromSquare, toSquare);
    }
    // Knight moves in an "L" shape
    else if (pieceType === "knight") {
        return isKnightMove(fromSquare, toSquare);
    }
    // Pawn attacks diagonally forward based on color
    else if (pieceType === "pawn") {
        return isPawnAttack(fromSquare, toSquare, color);
    }
    // King moves one square in any direction
    else if (pieceType === "king") {
        return isKingMove(fromSquare, toSquare);
    }
    
    return false;
}

// Refine this logic for pawn attacks only
function isPawnAttack(fromSquare, toSquare, color) {
    const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
    const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

    // Pawns attack one square diagonally forward based on their color
    const rankDiff = color === 'white' ? toRank - fromRank : fromRank - toRank;
    const fileDiff = Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0));

    // Pawn attacks only if it's moving diagonally by one square in the forward direction
    return rankDiff === 1 && fileDiff === 1;
}

// Validate pawn movement (including captures)
function isValidPawnMove(fromSquare, toSquare, color) {
    const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
    const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

    // Pawns move one square forward (white moves upwards, black moves downwards)
    const rankDiff = color === 'white' ? toRank - fromRank : fromRank - toRank;

    // Normal move: moving forward without capturing
    if (fromFile === toFile) {
        // Single step move
        if (rankDiff === 1) {
            return true;
        }
        // Double step move (only from starting position)
        if (rankDiff === 2 && (fromRank === 2 || fromRank === 7)) {
            return true;
        }
    }

    // Capture: diagonally one square
    if (Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0)) === 1 && rankDiff === 1) {
        const targetSquare = document.getElementById(toSquare);
        const targetPiece = targetSquare.querySelector(".piece");
        if (targetPiece && targetPiece.getAttribute('data-color') !== color) {
            return true; // Valid diagonal capture
        }
    }

    return false;
}

// Validate rook movement (straight lines)
function isStraightLineMove(fromSquare, toSquare) {
    const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
    const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

    return (fromFile === toFile || fromRank === toRank);
}

// Validate bishop movement (diagonals)
function isDiagonalMove(fromSquare, toSquare) {
    const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
    const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

    return Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0)) === Math.abs(fromRank - toRank);
}

// Validate knight movement (L-shape)
function isKnightMove(fromSquare, toSquare) {
    const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
    const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

    const fileDiff = Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0));
    const rankDiff = Math.abs(fromRank - toRank);

    return (fileDiff === 2 && rankDiff === 1) || (fileDiff === 1 && rankDiff === 2);
}

// Validate king movement (one square in any direction)
function isKingMove(fromSquare, toSquare) {
    const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
    const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

    const fileDiff = Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0));
    const rankDiff = Math.abs(fromRank - toRank);

    return fileDiff <= 1 && rankDiff <= 1;
}

// Check for clear path in both straight-line and diagonal moves
function isPathClear(fromSquare, toSquare) {
    const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
    const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

    let fileStep = 0, rankStep = 0;

    if (fromFile !== toFile) {
        fileStep = fromFile < toFile ? 1 : -1;
    }
    if (fromRank !== toRank) {
        rankStep = fromRank < toRank ? 1 : -1;
    }

    let currentFile = fromFile.charCodeAt(0) + fileStep;
    let currentRank = fromRank + rankStep;

    // Loop through all squares between fromSquare and toSquare
    while (String.fromCharCode(currentFile) !== toFile || currentRank !== toRank) {
        const intermediateSquare = String.fromCharCode(currentFile) + currentRank;
        const squareElement = document.getElementById(intermediateSquare);

        if (squareElement && squareElement.querySelector('.piece')) {
            return false;  // Path is blocked by another piece
        }

        currentFile += fileStep;
        currentRank += rankStep;
    }

    return true;  // Path is clear
}

/* ================================
   7. Initialize Board & Add Listeners
================================ */
// Initialize the board with pieces and colors and add event listeners for interaction.

// Initialize board and listeners on page load
window.onload = () => {
    initializeBoard();
    addListeners();
};

// Event Listeners
function addListeners() {
    document.querySelectorAll(".piece").forEach(piece => {
        piece.addEventListener("click", handlePieceClick);
    });
    document.querySelectorAll(".square").forEach(square => {
        square.addEventListener("click", handleSquareClick);
    });
}

