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
        isLightSquare = (row % 2) === (col % 2); // True for light square, false for dark

        // Generate dynamic HSL colors
        const hue = 30; // Brown hue
        const saturation = isLightSquare ? 30 : 40; // Less saturated for light squares
        const lightness = isLightSquare ? 80 - (row + col) : 40 - (row + col) / 2; // Gradual change in lightness

        square.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
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

// Function to clear the board
function clearBoard() {
    document.querySelectorAll('.square').forEach(square => {
        const piece = square.querySelector('.piece');
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

// Helper function to find the king's position on the board
function findKing(player) {
    const kingPiece = document.querySelector(`.piece[data-piece='king-${player}']`);
    if (!kingPiece) {
        console.warn(`${player}'s king has been captured! Game over.`);
        handleGameOver(player === "white" ? "black" : "white");  // Call game over logic with the winning player
        return null;  // Return null as the king is no longer on the board
    }
    const position = kingPiece.parentElement.id;
    return position;
}

// Simulate a move and check if the king is safe after that move
function simulateMoveAndCheck(fromSquare, toSquare, playerColor) {
    const originalSquare = document.getElementById(fromSquare);
    const targetSquare = document.getElementById(toSquare);
    const movedPiece = originalSquare.querySelector('.piece');
    const targetPiece = targetSquare.querySelector('.piece');  // Save this to restore if needed

    // Simulate the move
    targetSquare.appendChild(movedPiece);

    // Check if the king is still in check
    const kingSafe = !isKingInCheck(playerColor);

    // Undo the move (restore the board state)
    originalSquare.appendChild(movedPiece);
    if (targetPiece) {
        targetSquare.appendChild(targetPiece);
    }

    return kingSafe;  // Return whether the king is safe after the simulated move
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

// Adding en passant logic
function isValidEnPassantMove(currentSquare, targetSquare, playerColor) {
    const file = currentSquare[0];
    const rank = parseInt(currentSquare[1]);
    const forwardMove = playerColor === 'white' ? rank + 1 : rank - 1;

    const enPassantSquare = file + forwardMove;

    // Check if the target square is the valid en passant square
    if (targetSquare !== enPassantSquare) {
        return false;
    }

    // Check if the pawn is on the correct rank for en passant
    if ((playerColor === 'white' && rank !== 5) || (playerColor === 'black' && rank !== 4)) {
        return false;
    }

    // Check if there's an opponent's pawn in the correct position
    const opponentPawnSquare = targetSquare[0] + (playerColor === 'white' ? '5' : '4');
    const opponentPawn = document.getElementById(opponentPawnSquare).querySelector('.piece');
    if (!opponentPawn || opponentPawn.getAttribute('data-piece') !== `pawn-${playerColor === 'white' ? 'black' : 'white'}`) {
        return false;
    }

    // Check if the opponent's pawn just moved two squares in the previous turn
    if (!lastMove || lastMove.piece !== 'pawn' || lastMove.to !== opponentPawnSquare || 
        Math.abs(parseInt(lastMove.from[1]) - parseInt(lastMove.to[1])) !== 2) {
        return false;
    }

    return true;
}

// Execute en passant move
function executeEnPassant(currentSquare, targetSquare, playerColor) {
    const capturedPawnRank = playerColor === 'white' ? '5' : '4';
    const capturedPawnSquare = targetSquare[0] + capturedPawnRank;

    // Remove the captured pawn
    const capturedPawn = document.getElementById(capturedPawnSquare).querySelector('.piece');
    if (capturedPawn) {
        capturedPawn.remove();
    }

    // Move the capturing pawn
    const movingPawn = document.getElementById(currentSquare).querySelector('.piece');
    document.getElementById(targetSquare).appendChild(movingPawn);
}

// Check if moving the king would put it in check
function isKingMoveSafe(fromSquare, toSquare, playerColor) {
    const originalSquare = document.getElementById(fromSquare);
    const targetSquare = document.getElementById(toSquare);
    const movedPiece = originalSquare.querySelector('.piece');
    const targetPiece = targetSquare.querySelector('.piece'); // To restore in case of undo

    // Temporarily move the king
    targetSquare.appendChild(movedPiece);

    // Check if the move puts the king in check
    const kingInCheck = isKingInCheck(playerColor);

    // Undo the temporary move
    originalSquare.appendChild(movedPiece);
    if (targetPiece) {
        targetSquare.appendChild(targetPiece); // Restore captured piece if any
    }

    // Additional check: Ensure pawns are not threatening the king diagonally
    if (playerColor === "white") {
        // Check if black pawns are attacking diagonally from one rank down
        if (canPawnAttack(toSquare, `${String.fromCharCode(toSquare[0].charCodeAt(0) - 1)}${parseInt(toSquare[1]) - 1}`, "black") ||
            canPawnAttack(toSquare, `${String.fromCharCode(toSquare[0].charCodeAt(0) + 1)}${parseInt(toSquare[1]) - 1}`, "black")) {
            return false;
        }
    } else if (playerColor === "black") {
        // Check if white pawns are attacking diagonally from one rank up
        if (canPawnAttack(toSquare, `${String.fromCharCode(toSquare[0].charCodeAt(0) - 1)}${parseInt(toSquare[1]) + 1}`, "white") ||
            canPawnAttack(toSquare, `${String.fromCharCode(toSquare[0].charCodeAt(0) + 1)}${parseInt(toSquare[1]) + 1}`, "white")) {
            return false;
        }
    }

    // If the king is still in check, return false
    return !kingInCheck;
}

// Check if the given piece can attack the king
function canPieceAttackKing(pieceType, piecePosition, kingPosition, opponentColor) {
    switch (pieceType) {
        case 'pawn':
            return canPawnAttack(kingPosition, piecePosition, opponentColor);
        case 'rook':
            return isStraightLineMove(piecePosition, kingPosition) && isPathClear(piecePosition, kingPosition);
        case 'bishop':
            return isDiagonalMove(piecePosition, kingPosition) && isPathClear(piecePosition, kingPosition);
        case 'queen':
            return (isStraightLineMove(piecePosition, kingPosition) || isDiagonalMove(piecePosition, kingPosition)) && isPathClear(piecePosition, kingPosition);
        case 'knight':
            return isKnightMove(piecePosition, kingPosition);
        case 'king':
            return isKingMove(piecePosition, kingPosition);
        default:
            return false;
    }
}

// Function to check if a pawn can attack the king (special rules for pawns)
function canPawnAttack(kingPosition, pawnPosition, opponentColor) {
    const [kingFile, kingRank] = [kingPosition[0], parseInt(kingPosition[1])];
    const [pawnFile, pawnRank] = [pawnPosition[0], parseInt(pawnPosition[1])];

    const fileDiff = Math.abs(kingFile.charCodeAt(0) - pawnFile.charCodeAt(0));
    const rankDiff = opponentColor === 'white' ? kingRank - pawnRank : pawnRank - kingRank;

    // Pawns attack diagonally, so fileDiff should be 1 and rankDiff should be 1 for a valid attack
    return fileDiff === 1 && rankDiff === 1;
}

// Function to validate if a move is valid for a pawn
function isValidPawnMove(fromSquare, toSquare, playerColor) {
    const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
    const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];

    const rankDiff = playerColor === 'white' ? toRank - fromRank : fromRank - toRank;

    // Moving forward
    if (fromFile === toFile) {
        // Pawns can only move one square forward or two squares from their starting position
        if ((playerColor === 'white' && fromRank === 2 && rankDiff === 2) ||
            (playerColor === 'black' && fromRank === 7 && rankDiff === 2)) {
            return true;
        }
        return rankDiff === 1;  // Single square forward
    }

    // Diagonal capture
    const fileDiff = Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0));
    if (fileDiff === 1 && rankDiff === 1) {
        return isOpponentPieceAtSquare(toSquare, playerColor);
    }

    return false;
}

// function to validate pawn promotion
function isValidPawnPromotion(fromSquare, toSquare, playerColor) {
    const [fromFile, fromRank] = [fromSquare[0], parseInt(fromSquare[1])];
    const [toFile, toRank] = [toSquare[0], parseInt(toSquare[1])];
    
    if ((toRank === 8 && playerColor === 'white') || (toRank === 1 && playerColor === 'black')) {
        const promotionPieces = ['queen', 'rook', 'bishop', 'knight'];
        const selectedPiece = prompt("Choose a piece to promote to: queen, rook, bishop, or knight");
        
        if (promotionPieces.includes(selectedPiece.toLowerCase())) {
            return selectedPiece.toLowerCase();
        } else {
            alert("Invalid selection. Defaulting to queen.");
            return 'queen';
        }
    }
    
    return false;
}

// Function to check if a square contains an opponent piece
function isOpponentPieceAtSquare(square, playerColor) {
    const pieceAtSquare = document.getElementById(square)?.querySelector('.piece');
    return pieceAtSquare && pieceAtSquare.getAttribute('data-color') !== playerColor;
}

// Function to validate if a move is valid for a rook
function isValidRookMove(fromSquare, toSquare) {
    return isStraightLineMove(fromSquare, toSquare) && isPathClear(fromSquare, toSquare);
}

// Function to validate if a move is valid for a bishop
function isValidBishopMove(fromSquare, toSquare) {
    return isDiagonalMove(fromSquare, toSquare) && isPathClear(fromSquare, toSquare);
}

// Function to validate if a move is valid for a queen
function isValidQueenMove(fromSquare, toSquare) {
    return (isStraightLineMove(fromSquare, toSquare) || isDiagonalMove(fromSquare, toSquare)) && isPathClear(fromSquare, toSquare);
}

// Function to validate if a move is valid for a knight
function isValidKnightMove(fromSquare, toSquare) {
    const fileDiff = Math.abs(fromSquare[0].charCodeAt(0) - toSquare[0].charCodeAt(0));
    const rankDiff = Math.abs(fromSquare[1] - toSquare[1]);
    return (fileDiff === 2 && rankDiff === 1) || (fileDiff === 1 && rankDiff === 2);
}

/// Check if the king's move is valid (escaping check)
function isValidKingMove(fromSquare, toSquare, playerColor) {
    const fileDiff = Math.abs(fromSquare[0].charCodeAt(0) - toSquare[0].charCodeAt(0));
    const rankDiff = Math.abs(fromSquare[1] - toSquare[1]);

    // King can move one square in any direction
    if (fileDiff <= 1 && rankDiff <= 1) {
        return isKingMoveSafe(fromSquare, toSquare, playerColor);  // Check if moving the king will resolve check
    }

    // Check for castling move
    if (fileDiff === 2 && rankDiff === 0) {
        return isValidCastling(fromSquare, toSquare, playerColor);
    }

    return false;
}

function isValidCastling(kingSquare, targetSquare, playerColor) {
    const rank = playerColor === 'white' ? '1' : '8';
    const isKingsideCastling = targetSquare[0] === 'g';
    const rookFile = isKingsideCastling ? 'h' : 'a';
    const rookSquare = rookFile + rank;
    const filesToCheck = isKingsideCastling ? ['f', 'g'] : ['d', 'c', 'b'];

    // Check if path is clear
    for (let f of filesToCheck) {
        if (document.getElementById(f + rank).querySelector('.piece')) {
            //Update Console log, DONT FORGET
            console.log(`Castling invalid: Piece found at ${f}${rank}`);
            return false;
        }
    }

    // Check if the player has already castled
    if ((playerColor === 'white' && whiteCastled) || (playerColor === 'black' && blackCastled)) {
        console.log('Castling invalid: Player has already castled');
        return false;
    }

    // Check if king and rook are in their initial positions
    if (kingSquare !== 'e' + rank || !document.getElementById(rookSquare).querySelector('.piece')) {
        console.log('Castling invalid: King or rook not in initial position');
        return false;
    }

    // Check if king is not in check and doesn't pass through check
    const kingPath = rookFile === 'a' ? ['e', 'd', 'c'] : ['e', 'f', 'g'];
    for (let f of kingPath) {
        if (isKingInCheck(playerColor, f + rank)) {
            console.log(`Castling invalid: King in check or passes through check at ${f}${rank}`);
            return false;
        }
    }

    console.log('Castling is valid');
    return true;
}

function executeCastling(kingSquare, targetSquare, playerColor) {
    console.log(`Executing castling: King at ${kingSquare}, target ${targetSquare}, player ${playerColor}`);
    
    const rank = playerColor === 'white' ? '1' : '8';
    const isKingsideCastling = targetSquare[0] === 'g'; // King-side or queen-side

    // Define the rook's current and target positions
    const rookFile = isKingsideCastling ? 'h' : 'a'; 
    const rookSquare = rookFile + rank;
    const newRookFile = isKingsideCastling ? 'f' : 'd';
    const newRookSquare = newRookFile + rank;

    const king = document.getElementById(kingSquare).querySelector('.piece');
    const rook = document.getElementById(rookSquare).querySelector('.piece');

    if (!king || !rook) {
        console.error('Castling failed: King or rook is missing.');
        return;
    }

    // Ensure the king is moving exactly 2 squares (which would indicate castling)
    const kingFileDiff = Math.abs(kingSquare.charCodeAt(0) - targetSquare.charCodeAt(0));
    if (kingFileDiff === 2) {
        // Move the king
        document.getElementById(targetSquare).appendChild(king);

        // Move the rook to its new position
        document.getElementById(newRookSquare).appendChild(rook);

        // Update castling rights
        if (playerColor === 'white') {
            whiteCastled = true;
        } else {
            blackCastled = true;
        }

        console.log(`Castling complete: King moved from ${kingSquare} to ${targetSquare}, Rook moved from ${rookSquare} to ${newRookSquare}`);
    } else {
        console.error('Invalid castling: King did not move 2 squares.');
    }
}

// Additional helper functions for movement logic (straight line, diagonal, etc.)
// ---------------------------------------------------------------------------
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
        pieceType: piece.getAttribute("data-piece").split("-")[0] // Capture piece type here
    };
    console.log(`Selected ${selectedPiece.pieceType} on ${selectedPiece.currentSquare}`);
}

// Function to handle move completion and check game state
function handleMoveCompletion() {
    console.log("Move completed, switching player and checking game state...");

    // Check for king capture (game over condition)
    const whiteKing = findKing('white');
    const blackKing = findKing('black');

    console.log("White king found:", whiteKing);
    console.log("Black king found:", blackKing);

    // End the game if a king is captured
    if (!whiteKing) {
        console.log("White king not found, game over");
        gameOver('black');
        return;
    }
    if (!blackKing) {
        console.log("Black king not found, game over");
        gameOver('white');
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
    console.log("Reassigning listeners...");
    reassignListeners();

    // Switch player after move
    console.log("Switching player...");
    switchPlayer();
}

document.getElementById('restart').addEventListener('click', function() {
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

    const targetSquare = event.target.closest('.square');
    const currentSquare = selectedPiece.pieceElement.parentElement;

    if (targetSquare === currentSquare) {
        return;
    }

    const pieceType = selectedPiece.pieceType;
    const playerColor = selectedPiece.color;

    // Check for castling (king and rook)
    if (pieceType === 'king' && currentSquare.id && targetSquare.id &&
        Math.abs(targetSquare.id.charCodeAt(0) - currentSquare.id.charCodeAt(0)) === 2) {
        if (isValidCastling(currentSquare.id, targetSquare.id, playerColor)) {
            executeCastling(currentSquare.id, targetSquare.id, playerColor);
            handleMoveCompletion();
            return;
        }
    }
    
    // check for en passant
    if (pieceType === 'pawn' && isValidEnPassantMove(currentSquare.id, targetSquare.id, playerColor)) {
        executeEnPassant(currentSquare.id, targetSquare.id, playerColor);
        handleMoveCompletion();
        return;
    }

    // check for promotion
    if (pieceType === 'pawn' && isValidPawnPromotion(currentSquare.id, targetSquare.id, playerColor)) {
        executePromotion(currentSquare.id, targetSquare.id, playerColor);
        handleMoveCompletion();
        return;
    }

    // check for regular moves
    const isValidMove = isValidPieceMove(
        pieceType,
        currentSquare.id,
        targetSquare.id,
        playerColor
    );

    if (!isValidMove) {
        console.log(`Invalid move for ${pieceType}: ${currentSquare.id} to ${targetSquare.id}`);
        return;
    }

    // Execute the move if valid
    if (targetSquare.querySelector('.piece')) {
        targetSquare.removeChild(targetSquare.querySelector('.piece'));
    }

    // Append the selected piece to the target square
    targetSquare.appendChild(selectedPiece.pieceElement);
    selectedPiece = null;

    // Re-assign listeners to ensure new pieces get event listeners
    handleMoveCompletion();
}

// Validate move function for all pieces
function isValidPieceMove(pieceType, fromSquare, toSquare, playerColor) {
    let validMove = false;

    // Validate move based on piece type
    switch (pieceType) {
        case 'pawn':
            validMove = isValidPawnMove(fromSquare, toSquare, playerColor);
            break;
        case 'rook':
            validMove = isValidRookMove(fromSquare, toSquare);
            break;
        case 'bishop':
            validMove = isValidBishopMove(fromSquare, toSquare);
            break;
        case 'queen':
            validMove = isValidQueenMove(fromSquare, toSquare);
            break;
        case 'knight':
            validMove = isValidKnightMove(fromSquare, toSquare);
            break;
        case 'king':
            validMove = isValidKingMove(fromSquare, toSquare, playerColor);
            break;
        default:
            return false;
    }

    // If the move doesn't follow basic rules, return false
    if (!validMove) return false;

    // If the king is in check, only allow moves that resolve the check
    if (isKingInCheck(playerColor)) {
        const moveResolvesCheck = simulateMoveAndCheck(fromSquare, toSquare, playerColor);
        if (!moveResolvesCheck) {
            console.log("Cannot make a move while the king is in check, resolve the check first.");
            return false;
        }
    }

    return validMove;
}

// Simulate the move and check if the king is safe after that move, with logging
function simulateMoveAndCheck(fromSquare, toSquare, playerColor) {
    const originalFromSquare = document.getElementById(fromSquare);
    const originalToSquare = document.getElementById(toSquare);

    const movedPiece = originalFromSquare.querySelector('.piece');
    const capturedPiece = originalToSquare.querySelector('.piece');

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
    if (gameIsOver) return;  // Prevent switching if the game is over

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
        console.warn(`King for ${playerColor} not found on the board!`);
        return false;
    }

    const opponentColor = playerColor === 'white' ? 'black' : 'white';
    const opponentPieces = document.querySelectorAll(`.piece[data-color='${opponentColor}']`);

    // Check if any opponent piece can attack the player's king
    for (let piece of opponentPieces) {
        const pieceType = piece.getAttribute('data-piece')?.split('-')[0];
        const piecePosition = piece.parentElement?.id;

        if (!pieceType || !piecePosition) {
            console.warn(`Malformed piece found: ${piece.outerHTML}`);
            continue;
        }

        if (canPieceAttackKing(pieceType, piecePosition, kingPosition, opponentColor)) {
            console.log(`${playerColor}'s king at ${kingPosition} is in check from ${opponentColor}'s ${pieceType} at ${piecePosition}.`);
            return true;  // Break early once a threat is found
        }
    }

    console.log(`${playerColor}'s king at ${kingPosition} is safe.`);
    return false;  // King is safe if no threats are found
}

// Function to check the current state of the game
function checkGameState() {
    console.log("Checking game state...");

    const whiteKingInCheck = isKingInCheck('white');
    const blackKingInCheck = isKingInCheck('black');

    if (whiteKingInCheck) {
        console.log("White's king is in check.");
        if (isCheckmate('white')) {
            gameOver('black');  // Black wins
            gameIsOver = true;  // Set game over flag
            return true;
        }
    }

    if (blackKingInCheck) {
        console.log("Black's king is in check.");
        if (isCheckmate('black')) {
            gameOver('white');  // White wins
            gameIsOver = true;  // Set game over flag
            return true;
        }
    }

    return false;  // No checkmate detected
}

// Function to check if the player is in checkmate
function isCheckmate(playerColor) {
    const playerPieces = document.querySelectorAll(`.piece[data-color='${playerColor}']`);
    
    for (let piece of playerPieces) {
        const pieceType = piece.getAttribute('data-piece').split('-')[0];
        const currentSquare = piece.parentElement.id;
        
        for (let row = 1; row <= 8; row++) {
            for (let col = 'a'.charCodeAt(0); col <= 'h'.charCodeAt(0); col++) {
                const targetSquare = String.fromCharCode(col) + row;
                if (isValidPieceMove(pieceType, currentSquare, targetSquare, playerColor)) {
                    if (simulateMoveAndCheck(currentSquare, targetSquare, playerColor)) {
                        return false; // Found a valid move that resolves the check
                    }
                }
            }
        }
    }
    
    return true; // No valid moves found, it's checkmate
}

// Game over function
function handleGameOver(winner) {
    console.log(`Game over! ${winner} wins!`);
    alert(`Game over! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`);

    // Set gameIsOver to true to prevent further actions
    gameIsOver = true;

    // Disable further moves by removing the click event listeners
    document.querySelectorAll('.square').forEach(square => {
        square.removeEventListener('click', handleSquareClick);
    });
    document.querySelectorAll('.piece').forEach(piece => {
        piece.removeEventListener('click', handlePieceClick);
    });

    // Disable Stockfish communication
    stockfish.terminate();

    // Show the restart button
    const restartButton = document.getElementById('restart');
    if (restartButton) {
        restartButton.style.display = 'block';
        restartButton.addEventListener('click', resetGame);
    }

    // Update UI to reflect game over state
    updateGameOverUI(winner);
}

let gameIsOver = false;  // Global flag to track if the game has ended

// Function to update UI for game over state
function updateGameOverUI(winner) {
    const gameStatus = document.getElementById('game-status');
    if (gameStatus) {
        gameStatus.textContent = `Game Over - ${winner} wins!`;
        gameStatus.style.display = 'block';
    }
}

// Function to reset the game
function resetGame() {
    gameIsOver = false;
    clearBoard();
    initializeBoard();
    resetGameState();
    addListeners();
    
    const gameStatus = document.getElementById('game-status');
    if (gameStatus) {
        gameStatus.style.display = 'none';
    }

    document.getElementById('restart').style.display = 'none';
    
    // Reset game-specific variables
    selectedPiece = null;
    currentTurn = 'white';
    moveHistory = [];
    capturedPieces = { white: [], black: [] };
    
    // Clear any highlighted squares
    document.querySelectorAll('.square').forEach(square => {
        square.classList.remove('highlight');
    });
    
    // Reset the move counter
    moveCount = 1;
    
    // Update the UI to reflect the initial game state
    updateTurnIndicator();
    updateMoveHistory();
    updateCapturedPieces();
    
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
    document.querySelectorAll(".piece").forEach(piece => {
        piece.addEventListener("click", handlePieceClick);  // Allow multiple clicks
    });

    document.querySelectorAll(".square").forEach(square => {
        square.addEventListener("click", handleSquareClick);  // Allow multiple clicks
    });
}

// Reassign listeners to pieces and squares after a move
function reassignListeners() {
    if (gameIsOver) return;  // Don't reassign listeners if the game is over
    
    // Remove existing listeners to avoid duplicate bindings
    document.querySelectorAll(".piece").forEach(piece => {
        piece.removeEventListener("click", handlePieceClick);
    });
    document.querySelectorAll(".square").forEach(square => {
        square.removeEventListener("click", handleSquareClick);
    });
    
    // Add listeners again for all pieces and squares
    addListeners();  
}



