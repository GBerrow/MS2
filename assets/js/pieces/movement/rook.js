function isValidRookMove(boardState, from, to, playerColor) {
    // Check if move is in a straight line (same rank or file)
    const isStraightLine = from[0] === to[0] || from[1] === to[1];
    if (!isStraightLine) return false;
    
    // Check if destination square contains own piece
    const destPiece = boardState.pieces[to];
    if (destPiece && destPiece.split('-')[1] === playerColor) return false;
    
    // Check for pieces in the path (will be handled by the integration file using validation.js)
    return true; // Basic validation only, path clearing will be handled by integration
}

function getRookMoves(boardState, position, playerColor) {
    const validMoves = [];
    const [file, rank] = [position.charCodeAt(0), parseInt(position[1])];
    
    // Check in all four directions (up, right, down, left)
    const directions = [
        { fileStep: 0, rankStep: 1 },  // up
        { fileStep: 1, rankStep: 0 },  // right
        { fileStep: 0, rankStep: -1 }, // down
        { fileStep: -1, rankStep: 0 }  // left
    ];
    
    for (const direction of directions) {
        let currentFile = file;
        let currentRank = rank;
        
        // Keep moving in current direction until edge of board
        for (let i = 1; i <= 7; i++) {
            currentFile += direction.fileStep;
            currentRank += direction.rankStep;
            
            // Convert to chess notation (e.g., "e4")
            const newPosition = String.fromCharCode(currentFile) + currentRank;
            
            // Check if position is off the board
            if (currentFile < 97 || currentFile > 104 || currentRank < 1 || currentRank > 8) {
                break;
            }
            
            const pieceAtNew = boardState.pieces[newPosition];
            
            if (!pieceAtNew) {
                // Empty square, valid move
                validMoves.push(newPosition);
            } else if (pieceAtNew.split('-')[1] !== playerColor) {
                // Opponent's piece, can capture and then stop
                validMoves.push(newPosition);
                break;
            } else {
                // Own piece, stop in this direction
                break;
            }
        }
    }
    
    return validMoves;
}
