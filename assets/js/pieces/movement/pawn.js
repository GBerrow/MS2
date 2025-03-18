// pawn.js - No imports
function isValidPawnMove(boardState, from, to, playerColor) {
    const fromFile = from.charCodeAt(0);
    const fromRank = parseInt(from[1]);
    const toFile = to.charCodeAt(0);
    const toRank = parseInt(to[1]);
    
    const fileDiff = toFile - fromFile;
    const rankDiff = playerColor === 'white' ? toRank - fromRank : fromRank - toRank;
    
    // Check direction - pawns can only move forward
    if (rankDiff <= 0) return false;
    
    const destPiece = boardState.pieces[to];
    
    // Regular forward movement (1 square)
    if (Math.abs(fileDiff) === 0 && rankDiff === 1) {
        // Pawns can't capture when moving straight
        return !destPiece;
    }
    
    // First move can be 2 squares forward
    if (Math.abs(fileDiff) === 0 && rankDiff === 2) {
        // Check if it's the pawn's first move
        const isFirstMove = (playerColor === 'white' && fromRank === 2) || 
                           (playerColor === 'black' && fromRank === 7);
        
        if (!isFirstMove) return false;
        
        // Check if the path is clear
        const middleRank = playerColor === 'white' ? fromRank + 1 : fromRank - 1;
        const middleSquare = from[0] + middleRank;
        
        // Path must be clear and destination must be empty
        return !boardState.pieces[middleSquare] && !destPiece;
    }
    
    // Diagonal capture
    if (Math.abs(fileDiff) === 1 && rankDiff === 1) {
        // Diagonal moves must be captures
        return destPiece && destPiece.split('-')[1] !== playerColor;
        
        // Note: En passant will be implemented separately as it requires
        // knowledge of the previous move
    }
    
    return false;
}

function getPawnMoves(boardState, position, playerColor) {
    const validMoves = [];
    const [file, rank] = [position.charCodeAt(0), parseInt(position[1])];
    
    // Determine forward direction based on color
    const forwardDirection = playerColor === 'white' ? 1 : -1;
    
    // Forward one square
    const oneForward = String.fromCharCode(file) + (rank + forwardDirection);
    if (rank + forwardDirection >= 1 && rank + forwardDirection <= 8) {
        if (!boardState.pieces[oneForward]) {
            validMoves.push(oneForward);
            
            // Forward two squares (only from starting position)
            const isStartPosition = (playerColor === 'white' && rank === 2) || 
                                   (playerColor === 'black' && rank === 7);
            
            if (isStartPosition) {
                const twoForward = String.fromCharCode(file) + (rank + 2 * forwardDirection);
                if (!boardState.pieces[twoForward]) {
                    validMoves.push(twoForward);
                }
            }
        }
    }
    
    // Diagonal captures
    const captureDirections = [
        { fileStep: -1, rankStep: forwardDirection },  // Capture left
        { fileStep: 1, rankStep: forwardDirection }    // Capture right
    ];
    
    for (const direction of captureDirections) {
        const newFile = file + direction.fileStep;
        const newRank = rank + direction.rankStep;
        
        // Check if position is within board
        if (newFile < 97 || newFile > 104 || newRank < 1 || newRank > 8) {
            continue;
        }
        
        const newPosition = String.fromCharCode(newFile) + newRank;
        const pieceAtNew = boardState.pieces[newPosition];
        
        // Can only move diagonally if capturing
        if (pieceAtNew && pieceAtNew.split('-')[1] !== playerColor) {
            validMoves.push(newPosition);
        }
        
        // Note: En passant will be implemented separately
    }
    
    return validMoves;
}
