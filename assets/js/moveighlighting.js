function highlightMoves(selectedPiece, board) {
    const possibleMoves = [];
    const position = selectedPiece.currentSquare;
    const pieceColor = selectedPiece.color;
    
    clearHighlights();
    
    switch(selectedPiece.pieceType) {
        case 'pawn':
            getPawnMoves(position, pieceColor, board, possibleMoves);
            break;
        case 'rook':
            getRookMoves(position, pieceColor, board, possibleMoves);
            break;
        case 'knight':
            getKnightMoves(position, pieceColor, board, possibleMoves);
            break;
        case 'bishop':
            getBishopMoves(position, pieceColor, board, possibleMoves);
            break;
        case 'queen':
            getQueenMoves(position, pieceColor, board, possibleMoves);
            break;
        case 'king':
            getKingMoves(position, pieceColor, board, possibleMoves);
            break;
    }
    
    highlightValidMoves(possibleMoves, pieceColor);
}

function clearHighlights() {
    document.querySelectorAll('.highlight-move, .highlight-capture').forEach(square => {
        square.classList.remove('highlight-move', 'highlight-capture');
    });
}
function highlightValidMoves(moves, pieceColor) {
    moves.forEach(move => {
        const square = document.getElementById(move);
        if (square) {
            const targetPiece = square.querySelector('.piece');
            if (targetPiece) {
                if (targetPiece.getAttribute('data-color') !== pieceColor) {
                    square.classList.add('highlight-capture');
                }
            } else {
                square.classList.add('highlight-move');
            }
        }
    });
}


function getPawnMoves(position, color, board, possibleMoves) {
    const [file, rank] = [position[0], parseInt(position[1])];
    const direction = color === 'white' ? 1 : -1;
    
    // Forward move
    const forwardSquare = `${file}${rank + direction}`;
    if (!document.getElementById(forwardSquare).querySelector('.piece')) {
        possibleMoves.push(forwardSquare);
        
        // Initial two-square move
        if ((color === 'white' && rank === 2) || (color === 'black' && rank === 7)) {
            const doubleSquare = `${file}${rank + (2 * direction)}`;
            if (!document.getElementById(doubleSquare).querySelector('.piece')) {
                possibleMoves.push(doubleSquare);
            }
        }
    }
    
    // Captures
    const captureFiles = [String.fromCharCode(file.charCodeAt(0) - 1), 
                         String.fromCharCode(file.charCodeAt(0) + 1)];
    captureFiles.forEach(captureFile => {
        if (captureFile >= 'a' && captureFile <= 'h') {
            const captureSquare = `${captureFile}${rank + direction}`;
            const targetPiece = document.getElementById(captureSquare)?.querySelector('.piece');
            if (targetPiece && targetPiece.getAttribute('data-color') !== color) {
                possibleMoves.push(captureSquare);
            }
        }
    });
}

function getRookMoves(position, color, board, possibleMoves) {
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    getSlidingMoves(position, color, directions, possibleMoves);
}

function getBishopMoves(position, color, board, possibleMoves) {
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    getSlidingMoves(position, color, directions, possibleMoves);
}

function getQueenMoves(position, color, board, possibleMoves) {
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    getSlidingMoves(position, color, directions, possibleMoves);
}

function getKnightMoves(position, color, board, possibleMoves) {
    const moves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    const [file, rank] = [position[0], parseInt(position[1])];
    
    moves.forEach(([fileOffset, rankOffset]) => {
        const newFile = String.fromCharCode(file.charCodeAt(0) + fileOffset);
        const newRank = rank + rankOffset;
        
        if (newFile >= 'a' && newFile <= 'h' && newRank >= 1 && newRank <= 8) {
            const targetSquare = `${newFile}${newRank}`;
            const targetPiece = document.getElementById(targetSquare)?.querySelector('.piece');
            if (!targetPiece || targetPiece.getAttribute('data-color') !== color) {
                possibleMoves.push(targetSquare);
            }
        }
    });
}

function getKingMoves(position, color, board, possibleMoves) {
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    const [file, rank] = [position[0], parseInt(position[1])];
    
    directions.forEach(([fileOffset, rankOffset]) => {
        const newFile = String.fromCharCode(file.charCodeAt(0) + fileOffset);
        const newRank = rank + rankOffset;
        
        if (newFile >= 'a' && newFile <= 'h' && newRank >= 1 && newRank <= 8) {
            const targetSquare = `${newFile}${newRank}`;
            const targetPiece = document.getElementById(targetSquare)?.querySelector('.piece');
            if (!targetPiece || targetPiece.getAttribute('data-color') !== color) {
                if (isKingMoveSafe(position, targetSquare, color)) {
                    possibleMoves.push(targetSquare);
                }
            }
        }
    });
}

function getSlidingMoves(position, color, directions, possibleMoves) {
    const [file, rank] = [position[0], parseInt(position[1])];
    
    directions.forEach(([fileOffset, rankOffset]) => {
        let currentFile = file;
        let currentRank = rank;
        
        while (true) {
            currentFile = String.fromCharCode(currentFile.charCodeAt(0) + fileOffset);
            currentRank += rankOffset;
            
            if (currentFile < 'a' || currentFile > 'h' || currentRank < 1 || currentRank > 8) break;
            
            const targetSquare = `${currentFile}${currentRank}`;
            const targetPiece = document.getElementById(targetSquare)?.querySelector('.piece');
            
            if (!targetPiece) {
                possibleMoves.push(targetSquare);
            } else {
                if (targetPiece.getAttribute('data-color') !== color) {
                    possibleMoves.push(targetSquare);
                }
                break;
            }
        }
    });
}

window.highlightMoves = highlightMoves;
window.clearHighlights = clearHighlights;