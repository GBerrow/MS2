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

// Handle moving a piece
function handleSquareClick(event) {
    if (!selectedPiece) return;

    const targetSquare = event.target.closest('.square'); // Ensure we target the square itself
    const currentSquare = selectedPiece.pieceElement.parentElement;

    // Prevent moving the piece to its current square
    if (targetSquare === currentSquare) {
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

// Call this function after every move
function handleMoveCompletion() {
    console.log("Move completed, switching player and checking game state...");
    switchPlayer();
    checkGameState();
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

function isKingInCheck() {
    const kingPosition = findKing(currentPlayer);
    console.log(`${currentPlayer}'s king is at ${kingPosition}`);
    
    const opponent = currentPlayer === "white" ? "black" : "white";
    const opponentPieces = document.querySelectorAll(`.piece[data-color='${opponent}']`);
    
    for (let piece of opponentPieces) {
        const pieceType = piece.getAttribute("data-piece").split("-")[0];
        const currentSquare = piece.parentElement.id;
        console.log(`${opponent} ${pieceType} at ${currentSquare} checking attack on ${kingPosition}`);
        
        if (canPieceAttack(pieceType, currentSquare, kingPosition)) {
            console.log(`${opponent} can attack the ${currentPlayer} king!`);
            return true;
        }
    }
    console.log(`${currentPlayer}'s king is safe.`);
    return false;
}

// Helper function to find the king's position on the board
function findKing(player) {
    const kingPiece = document.querySelector(`.piece[data-piece='king-${player}']`);
    return kingPiece ? kingPiece.parentElement.id : null;
}

// Check if a piece can attack the given position
function canPieceAttack(pieceType, fromSquare, toSquare) {
    // Rook or Queen moves in straight lines (horizontal or vertical)
    if (pieceType === "rook" || pieceType === "queen") {
        // Rook and Queen can attack in a straight line (either row or column)
        return isStraightLineMove(fromSquare, toSquare);
    } 
    // Bishop or Queen moves diagonally
    else if (pieceType === "bishop" || pieceType === "queen") {
        // Bishop and Queen can attack diagonally
        return isDiagonalMove(fromSquare, toSquare);
    } 
    // Knight has an "L" shaped move
    else if (pieceType === "knight") {
        // Knight can attack based on its unique "L" move pattern
        return isKnightMove(fromSquare, toSquare);
    } 
    // Pawn attacks diagonally (different from its forward movement)
    else if (pieceType === "pawn") {
        // Pawn can only attack diagonally, not forward
        return isPawnAttack(fromSquare, toSquare);
    } 
    // King moves one square in any direction
    else if (pieceType === "king") {
        // King can attack any adjacent square
        return isKingMove(fromSquare, toSquare);
    }
    
    // If none of the piece types match, return false (no attack)
    return false;
}

// Helper function to check if a move is in a straight line (horizontal or vertical)
function isStraightLineMove(from, to) {
    const [fromFile, fromRank] = [from[0], parseInt(from[1])];
    const [toFile, toRank] = [to[0], parseInt(to[1])];
    
    return (fromFile === toFile || fromRank === toRank); 
}

// Helper for checking pawn attack logic (diagonal moves for captures)
function isPawnAttack(from, to) {
    const [fromFile, fromRank] = [from[0], parseInt(from[1])];
    const [toFile, toRank] = [to[0], parseInt(to[1])];
    const fileDiff = Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0));
    
    if (fileDiff === 1 && Math.abs(fromRank - toRank) === 1) {
        return true;  // Pawns can attack diagonally
    }
    return false;
}

/* ================================
   7. Initialize Board & Add Listeners
================================ */
// Initialize the board with pieces and colors and add event listeners for interaction.

// Event Listeners
function addListeners() {
    document.querySelectorAll(".piece").forEach(piece => {
        piece.addEventListener("click", handlePieceClick);
    });
    document.querySelectorAll(".square").forEach(square => {
        square.addEventListener("click", handleSquareClick);
    });
}

// Initialize board and listeners on page load
window.onload = () => {
    initializeBoard();
    addListeners();
};
