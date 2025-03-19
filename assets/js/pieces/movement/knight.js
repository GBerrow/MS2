export function isValidKnightMove(boardState, from, to, playerColor) {
    // Knight moves in an L-shape: 2 squares in one direction and 1 in perpendicular
    const fromFile = from.charCodeAt(0);
    const fromRank = parseInt(from[1]);
    const toFile = to.charCodeAt(0);
    const toRank = parseInt(to[1]);
    
    const fileDiff = Math.abs(fromFile - toFile);
    const rankDiff = Math.abs(fromRank - toRank);
    
    // Knight's L-shape move: (1,2) or (2,1)
    const isValidLShape = (fileDiff === 1 && rankDiff === 2) || (fileDiff === 2 && rankDiff === 1);
    
    if (!isValidLShape) return false;
    
    // Check if destination square contains own piece
    const destPiece = boardState.pieces[to];
    if (destPiece && destPiece.split('-')[1] === playerColor) return false;
    
    return true;
}

export function getKnightMoves(boardState, position, playerColor) {
    const validMoves = [];
    const [file, rank] = [position.charCodeAt(0), parseInt(position[1])];
    
    // All possible L-shape moves for a knight
    const knightMoves = [
        { fileStep: 1, rankStep: 2 },    // up 2, right 1
        { fileStep: 2, rankStep: 1 },    // right 2, up 1
        { fileStep: 2, rankStep: -1 },   // right 2, down 1
        { fileStep: 1, rankStep: -2 },   // down 2, right 1
        { fileStep: -1, rankStep: -2 },  // down 2, left 1
        { fileStep: -2, rankStep: -1 },  // left 2, down 1
        { fileStep: -2, rankStep: 1 },   // left 2, up 1
        { fileStep: -1, rankStep: 2 }    // up 2, left 1
    ];
    
    for (const move of knightMoves) {
        const newFile = file + move.fileStep;
        const newRank = rank + move.rankStep;
        
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
