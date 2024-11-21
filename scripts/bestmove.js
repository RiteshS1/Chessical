let isWhiteTurn = true; // Track current turn

class VirtualBoard {
    constructor() {
        this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
        this.initialize();
    }

    initialize() {
        // Copy current board state
        document.querySelectorAll('.square').forEach(square => {
            const piece = square.querySelector('.piece');
            if (piece) {
                const index = parseInt(square.getAttribute('data-index'));
                const row = Math.floor(index / 8);
                const col = index % 8;
                this.board[row][col] = piece.getAttribute('data-piece');
            }
        });
    }

    makeMove(from, to) {
        const fromRow = Math.floor(from / 8);
        const fromCol = from % 8;
        const toRow = Math.floor(to / 8);
        const toCol = to % 8;
        
        const piece = this.board[fromRow][fromCol];
        this.board[fromRow][fromCol] = null;
        this.board[toRow][toCol] = piece;
    }

    undoMove(from, to, capturedPiece) {
        const fromRow = Math.floor(from / 8);
        const fromCol = from % 8;
        const toRow = Math.floor(to / 8);
        const toCol = to % 8;
        
        const piece = this.board[toRow][toCol];
        this.board[fromRow][fromCol] = piece;
        this.board[toRow][toCol] = capturedPiece;
    }
}

function suggestBestMove() {
    const button = document.getElementById('suggest-best-move');
    button.disabled = true;
    button.textContent = 'Calculating...';

    setTimeout(() => {
        try {
            // Only look at immediate moves (depth 1)
            const virtualBoard = new VirtualBoard();
            const possibleMoves = generateAllPossibleMoves(isWhiteTurn);
            
            // Evaluate only the top 10 moves based on basic piece capture value
            const bestMoves = possibleMoves
                .map(move => {
                    const targetSquare = document.querySelector(`[data-index="${move.to}"]`);
                    const targetPiece = targetSquare.querySelector('.piece');
                    const captureValue = targetPiece ? getPieceBasicValue(targetPiece.getAttribute('data-piece')) : 0;
                    return { ...move, value: captureValue };
                })
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);

            // Find the best move among these candidates
            let bestMove = bestMoves[0];  // Default to first move
            let bestValue = -Infinity;

            for (const move of bestMoves) {
                virtualBoard.makeMove(move.from, move.to);
                const value = evaluateBoard(virtualBoard);
                virtualBoard.undoMove(move.from, move.to, null);
                
                if (value > bestValue) {
                    bestValue = value;
                    bestMove = move;
                }
            }

            if (bestMove) {
                highlightBestMove(bestMove.from, bestMove.to);
            }
        } catch (error) {
            console.error("Error calculating best move:", error);
        } finally {
            button.disabled = false;
            button.textContent = 'Suggest Best Move';
        }
    }, 1000);
}

// Helper function to get basic piece values
function getPieceBasicValue(pieceType) {
    const values = {
        'pawn': 1,
        'knight': 3,
        'bishop': 3,
        'rook': 5,
        'queen': 9,
        'king': 0  // We don't want to prioritize capturing the king
    };
    const type = pieceType.split('_')[1];
    return values[type] || 0;
}

function generateAllPossibleMoves(isWhite) {
    const moves = [];
    const kingPos = findKingPosition(isWhite);
    const inCheck = kingPos && isKingInCheck(kingPos.row, kingPos.col, isWhite);
    
    const squares = document.querySelectorAll('.square');
    
    squares.forEach(sourceSquare => {
        const piece = sourceSquare.querySelector('.piece');
        if (!piece) return;
        
        const pieceType = piece.getAttribute('data-piece');
        if ((isWhite && !pieceType.startsWith('white')) || 
            (!isWhite && !pieceType.startsWith('black'))) {
            return;
        }
        
        const sourceIndex = parseInt(sourceSquare.getAttribute('data-index'));
        
        squares.forEach(targetSquare => {
            const targetIndex = parseInt(targetSquare.getAttribute('data-index'));
            if (sourceIndex === targetIndex) return;
            
            try {
                if (isValidMove(piece, sourceIndex, targetIndex)) {
                    // If in check, only add moves that resolve check
                    if (!inCheck || doesMoveResolveCheck(piece, sourceIndex, targetIndex)) {
                        moves.push({
                            from: sourceIndex,
                            to: targetIndex,
                            piece: piece,
                            pieceType: pieceType,
                            moveNotation: getAlgebraicNotation(sourceIndex, targetIndex, pieceType)
                        });
                    }
                }
            } catch (error) {
                console.error('Error validating move:', error);
            }
        });
    });
    
    console.log(`Generated ${moves.length} valid moves for ${isWhite ? 'white' : 'black'}`);
    return moves;
}

function getAlgebraicNotation(sourceIndex, targetIndex, pieceType) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

    const sourceFile = files[sourceIndex % 8];
    const sourceRank = ranks[Math.floor(sourceIndex / 8)];
    const targetFile = files[targetIndex % 8];
    const targetRank = ranks[Math.floor(targetIndex / 8)];

    const pieceChar = pieceType.split('_')[1].toUpperCase().charAt(0);

    return `${pieceChar}${sourceFile}${sourceRank}${targetFile}${targetRank}`;
}

function makeTemporaryMove(move) {
    const sourceSquare = document.querySelector(`[data-index="${move.from}"]`);
    const targetSquare = document.querySelector(`[data-index="${move.to}"]`);
    const capturedPiece = targetSquare.querySelector('.piece');

    if (capturedPiece) {
        targetSquare.removeChild(capturedPiece);
    }

    sourceSquare.removeChild(move.piece);
    targetSquare.appendChild(move.piece);

    updateBoardState(); // Update the internal board state
    return capturedPiece;
}

function undoTemporaryMove(move, capturedPiece) {
    const sourceSquare = document.querySelector(`[data-index="${move.from}"]`);
    const targetSquare = document.querySelector(`[data-index="${move.to}"]`);

    targetSquare.removeChild(move.piece);
    sourceSquare.appendChild(move.piece);

    if (capturedPiece) {
        targetSquare.appendChild(capturedPiece);
    }

    updateBoardState(); // Update the internal board state
}

function minimax(virtualBoard, depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0) {
        return evaluatePosition(virtualBoard);
    }

    const possibleMoves = generateAllPossibleMoves(isMaximizingPlayer);

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of possibleMoves) {
            const capturedPiece = makeTemporaryMove(move);
            const eval = minimax(virtualBoard, depth - 1, alpha, beta, false);
            undoTemporaryMove(move, capturedPiece);

            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of possibleMoves) {
            const capturedPiece = makeTemporaryMove(move);
            const eval = minimax(virtualBoard, depth - 1, alpha, beta, true);
            undoTemporaryMove(move, capturedPiece);

            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluatePosition(virtualBoard) {
    return evaluateBoard(virtualBoard); // This function is from evaluation.js
}

function highlightBestMove(sourceIndex, targetIndex) {
    // Clear any existing highlights first
    clearHighlights();
    
    const sourceSquare = document.querySelector(`[data-index="${sourceIndex}"]`);
    const targetSquare = document.querySelector(`[data-index="${targetIndex}"]`);

    if (sourceSquare && targetSquare) {
        // Add highlights
        sourceSquare.classList.add('highlighted-square');
        targetSquare.classList.add('highlighted-square');

        // Add move notation
        const notationElement = document.createElement('div');
        notationElement.classList.add('move-notation');
        notationElement.textContent = getAlgebraicNotation(sourceIndex, targetIndex, sourceSquare.querySelector('.piece').getAttribute('data-piece'));
        targetSquare.appendChild(notationElement);

        // Remove highlights after 4 seconds
        setTimeout(() => {
            clearHighlights();
        }, 4000);
    }
}

function clearHighlights() {
    // Remove all highlights
    document.querySelectorAll('.highlighted-square').forEach(square => {
        square.classList.remove('highlighted-square');
    });
    
    // Remove all move notations
    document.querySelectorAll('.move-notation').forEach(notation => {
        notation.remove();
    });
}

// Add event listener for the suggest move button
document.getElementById('suggest-best-move').addEventListener('click', () => {
    console.log("Suggest move button clicked");
    suggestBestMove();
});

function updateTurn() {
    isWhiteTurn = !isWhiteTurn;
}
