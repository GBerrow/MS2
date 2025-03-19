export function isValidBishopMove(boardState, from, to, playerColor) {
    // Check if move is diagonal
    const fileDiff = Math.abs(from.charCodeAt(0) - to.charCodeAt(0));
    const rankDiff = Math.abs(parseInt(from[1]) - parseInt(to[1]));
    const isDiagonal = fileDiff === rankDiff;
    
    if (!isDiagonal) return false;
    
    // Check if destination square contains own piece
    const destPiece = boardState.pieces[to];
    if (destPiece && destPiece.split('-')[1] === playerColor) return false;
    
    return true; // Basic validation only, path clearing will be handled by integration
}

export function getBishopMoves(boardState, position, playerColor) {
    const validMoves = [];
    const [file, rank] = [position.charCodeAt(0), parseInt(position[1])];
    
    // Check in all four diagonal directions
    const directions = [
        { fileStep: 1, rankStep: 1 },   // up-right
        { fileStep: 1, rankStep: -1 },  // down-right
        { fileStep: -1, rankStep: -1 }, // down-left
        { fileStep: -1, rankStep: 1 }   // up-left
    ];
    
    for (const direction of directions) {
        let currentFile = file;
        let currentRank = rank;
        
        // Keep moving in current diagonal direction until edge of board
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
