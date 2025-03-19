export function isValidQueenMove(boardState, from, to, playerColor) {
    // Queen combines rook and bishop movement
    // Check if move is in a straight line OR diagonal
    const fromFile = from.charCodeAt(0);
    const fromRank = parseInt(from[1]);
    const toFile = to.charCodeAt(0);
    const toRank = parseInt(to[1]);
    
    const fileDiff = Math.abs(fromFile - toFile);
    const rankDiff = Math.abs(fromRank - toRank);
    
    // Straight line (rook-like): same rank or file
    const isStraight = fromFile === toFile || fromRank === toRank;
    
    // Diagonal (bishop-like): equal change in rank and file
    const isDiagonal = fileDiff === rankDiff;
    
    if (!isStraight && !isDiagonal) return false;
    
    // Check if destination square contains own piece
    const destPiece = boardState.pieces[to];
    if (destPiece && destPiece.split('-')[1] === playerColor) return false;
    
    return true; // Basic validation only, path clearing will be handled by integration
}

export function getQueenMoves(boardState, position, playerColor) {
    const validMoves = [];
    const [file, rank] = [position.charCodeAt(0), parseInt(position[1])];
    
    // Queen combines rook and bishop movements, so check in all 8 directions
    const directions = [
        // Rook-like movements
        { fileStep: 0, rankStep: 1 },   // up
        { fileStep: 1, rankStep: 0 },   // right
        { fileStep: 0, rankStep: -1 },  // down
        { fileStep: -1, rankStep: 0 },  // left
        
        // Bishop-like movements
        { fileStep: 1, rankStep: 1 },   // up-right
        { fileStep: 1, rankStep: -1 },  // down-right
        { fileStep: -1, rankStep: -1 }, // down-left
        { fileStep: -1, rankStep: 1 }   // up-left
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
