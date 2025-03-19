export function isValidKingMove(boardState, from, to, playerColor) {
    // King moves one square in any direction
    const fromFile = from.charCodeAt(0);
    const fromRank = parseInt(from[1]);
    const toFile = to.charCodeAt(0);
    const toRank = parseInt(to[1]);
    
    const fileDiff = Math.abs(fromFile - toFile);
    const rankDiff = Math.abs(fromRank - toRank);
    
    // King can move only one square in any direction
    if (fileDiff > 1 || rankDiff > 1) return false;
    
    // Check if destination square contains own piece
    const destPiece = boardState.pieces[to];
    if (destPiece && destPiece.split('-')[1] === playerColor) return false;
    
    return true;
}

export function getKingMoves(boardState, position, playerColor) {
    const validMoves = [];
    const [file, rank] = [position.charCodeAt(0), parseInt(position[1])];
    
    // King can move one square in any of the 8 directions
    const directions = [
        { fileStep: 0, rankStep: 1 },    // up
        { fileStep: 1, rankStep: 1 },    // up-right
        { fileStep: 1, rankStep: 0 },    // right
        { fileStep: 1, rankStep: -1 },   // down-right
        { fileStep: 0, rankStep: -1 },   // down
        { fileStep: -1, rankStep: -1 },  // down-left
        { fileStep: -1, rankStep: 0 },   // left
        { fileStep: -1, rankStep: 1 }    // up-left
    ];
    
    for (const direction of directions) {
        const newFile = file + direction.fileStep;
        const newRank = rank + direction.rankStep;
        
        // Convert to chess notation (e.g., "e4")
        const newPosition = String.fromCharCode(newFile) + newRank;
        
        // Check if position is off the board
        if (newFile < 97 || newFile > 104 || newRank < 1 || newRank > 8) {
            continue;
        }
        
        const pieceAtNew = boardState.pieces[newPosition];
        
        if (!pieceAtNew || pieceAtNew.split('-')[1] !== playerColor) {
            // Empty square or opponent's piece - valid move
            validMoves.push(newPosition);
        }
    }
    
    return validMoves;
}
