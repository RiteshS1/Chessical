// board.js

const board = document.getElementById('board');
const piecesFolder = 'pieces/';
let draggedPiece = null;
let sourceSquare = null;
const capturedWhitePieces = [];
const capturedBlackPieces = [];
const positionHistory = [];
let whiteKingMoved = false;
let blackKingMoved = false;
let whiteKingsideRookMoved = false;
let whiteQueensideRookMoved = false;
let blackKingsideRookMoved = false;
let blackQueensideRookMoved = false;
let selectedPiece = null;
let selectedSquare = null;

// Sound effects
const sounds = {
    move: new Audio('sounds/move.mp3'),
    capture: new Audio('sounds/capture.mp3'),
    castle: new Audio('sounds/castle.mp3'),
    check: new Audio('sounds/check.mp3'),
    promote: new Audio('sounds/promote.mp3'),
    notify: new Audio('sounds/notify.mp3')
};

// Preload sounds
function preloadSounds() {
    for (const sound in sounds) {
        sounds[sound].load(); // Preload each sound
    }
}

function initBoard() {
    const initialBoard = [
        ['black_rook', 'black_knight', 'black_bishop', 'black_queen', 'black_king', 'black_bishop', 'black_knight', 'black_rook'],
        ['black_pawn', 'black_pawn', 'black_pawn', 'black_pawn', 'black_pawn', 'black_pawn', 'black_pawn', 'black_pawn'],
        [], [], [], [], 
        ['white_pawn', 'white_pawn', 'white_pawn', 'white_pawn', 'white_pawn', 'white_pawn', 'white_pawn', 'white_pawn'],
        ['white_rook', 'white_knight', 'white_bishop', 'white_queen', 'white_king', 'white_bishop', 'white_knight', 'white_rook']
    ];

    let isWhiteSquare = true;
    const fileLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let i = 0; i < 64; i++) {
        const square = document.createElement('div');
        square.classList.add('square', isWhiteSquare ? 'white' : 'black');
        square.setAttribute('data-index', i);
        board.appendChild(square);
        isWhiteSquare = !isWhiteSquare;

        const row = Math.floor(i / 8);
        const col = i % 8;
        const piece = initialBoard[row][col];
        if (row === 0 || row === 7) {
            const label = document.createElement('div');
            label.classList.add('square-label');
            label.textContent = fileLabels[col];
            square.appendChild(label);
        }
        if (piece) {
            const pieceImg = document.createElement('img');
            pieceImg.src = `${piecesFolder}${piece}.png`;
            pieceImg.classList.add('piece');
            pieceImg.setAttribute('draggable', true);
            pieceImg.setAttribute('id', `${piece}-${i}`);
            pieceImg.setAttribute('data-piece', piece);
            square.appendChild(pieceImg);
        }

        if (i % 8 === 7) {
            isWhiteSquare = !isWhiteSquare;
        }

        square.addEventListener('dragover', handleDragOver);
        square.addEventListener('drop', handleDrop);
    }

    document.querySelectorAll('.piece').forEach(piece => {
        piece.addEventListener('dragstart', handleDragStart);
    });

    initializeTouchAndClickEvents();
}

function handleDragStart(event) {
    draggedPiece = event.target;
    sourceSquare = draggedPiece.parentElement;
    event.dataTransfer.setData('text/plain', draggedPiece.id);
    event.target.classList.add('dragging');
}

function handleDragOver(event) {
    event.preventDefault();
}

function handleDrop(event) {
    event.preventDefault();
    const targetSquare = event.target.classList.contains('square') ? event.target : event.target.parentElement;
    
    const pieceId = event.dataTransfer.getData('text/plain');
    if (!draggedPiece) {
        draggedPiece = document.getElementById(pieceId);
    }
    
    const sourceIndex = parseInt(sourceSquare.getAttribute('data-index'));
    const targetIndex = parseInt(targetSquare.getAttribute('data-index'));
    
    const targetPiece = targetSquare.querySelector('.piece');
    
    if (targetPiece && targetPiece.getAttribute('data-piece').startsWith(draggedPiece.getAttribute('data-piece').split('_')[0])) {
        draggedPiece.classList.remove('dragging');
        draggedPiece = null;
        return;
    }
    
    if (isValidMove(draggedPiece, sourceIndex, targetIndex)) {
        const pieceType = draggedPiece.getAttribute('data-piece');
        const sourceRow = Math.floor(sourceIndex / 8);
        const sourceCol = sourceIndex % 8;
        const targetCol = targetIndex % 8;

        // Update castling flags
        if (pieceType === 'white_king') {
            whiteKingMoved = true;
            // Handle kingside castling
            if (targetCol - sourceCol === 2) {
                const rookSquare = document.querySelector(`[data-index="${sourceRow * 8 + 7}"]`);
                const newRookSquare = document.querySelector(`[data-index="${sourceRow * 8 + 5}"]`);
                const rook = rookSquare.querySelector('.piece');
                newRookSquare.appendChild(rook);
            }
            // Handle queenside castling
            if (sourceCol - targetCol === 2) {
                const rookSquare = document.querySelector(`[data-index="${sourceRow * 8}"]`);
                const newRookSquare = document.querySelector(`[data-index="${sourceRow * 8 + 3}"]`);
                const rook = rookSquare.querySelector('.piece');
                newRookSquare.appendChild(rook);
            }
        } else if (pieceType === 'black_king') {
            blackKingMoved = true;
            // Similar castling logic for black
            if (targetCol - sourceCol === 2) {
                const rookSquare = document.querySelector(`[data-index="${sourceRow * 8 + 7}"]`);
                const newRookSquare = document.querySelector(`[data-index="${sourceRow * 8 + 5}"]`);
                const rook = rookSquare.querySelector('.piece');
                newRookSquare.appendChild(rook);
            }
            if (sourceCol - targetCol === 2) {
                const rookSquare = document.querySelector(`[data-index="${sourceRow * 8}"]`);
                const newRookSquare = document.querySelector(`[data-index="${sourceRow * 8 + 3}"]`);
                const rook = rookSquare.querySelector('.piece');
                newRookSquare.appendChild(rook);
            }
        }
        // Update rook movement flags
        else if (pieceType === 'white_rook') {
            if (sourceIndex === 56) whiteQueensideRookMoved = true;
            if (sourceIndex === 63) whiteKingsideRookMoved = true;
        }
        else if (pieceType === 'black_rook') {
            if (sourceIndex === 0) blackQueensideRookMoved = true;
            if (sourceIndex === 7) blackKingsideRookMoved = true;
        }

        if (targetPiece) {
            targetPiece.remove();
            
            const capturedPieceColor = targetPiece.getAttribute('data-piece').split('_')[0];
            if (capturedPieceColor === 'white') {
                capturedWhitePieces.push(targetPiece);
            } else {
                capturedBlackPieces.push(targetPiece);
            }
            
            displayCapturedPieces();
        }
        
        targetSquare.appendChild(draggedPiece);
        handlePawnPromotion(targetSquare, draggedPiece);
        
        const currentPosition = getCurrentPosition();
        
        const repetitionCount = positionHistory.filter(pos => pos === currentPosition).length;
        
        if (repetitionCount >= 2) {
            alert("Draw by threefold repetition!");
            return;
        }
        
        positionHistory.push(currentPosition);
        
        updateTurn();
        updateEvaluationBar();

        // Add checkmate detection here
        const pieceColor = draggedPiece.getAttribute('data-piece').split('_')[0];
        const opponentIsWhite = pieceColor === 'black';
        
        if (isCheckmate(opponentIsWhite)) {
            setTimeout(() => {
                showGameEndModal(`${pieceColor.charAt(0).toUpperCase() + pieceColor.slice(1)} wins by checkmate!`);
            }, 100); // Small delay to ensure the UI updates first
        }
    }
    
    draggedPiece.classList.remove('dragging');
    draggedPiece = null;
}

// Function to display captured pieces
function displayCapturedPieces() {
    // You'll need to add these elements to your HTML:
    // <div id="captured-white" class="captured-pieces"></div>
    // <div id="captured-black" class="captured-pieces"></div>
    
    const whiteCapturedArea = document.getElementById('captured-white');
    const blackCapturedArea = document.getElementById('captured-black');
    
    if (whiteCapturedArea && blackCapturedArea) {
        // Clear existing display
        whiteCapturedArea.innerHTML = '';
        blackCapturedArea.innerHTML = '';
        
        // Display white captured pieces
        capturedWhitePieces.forEach(piece => {
            const pieceClone = piece.cloneNode(true);
            pieceClone.removeAttribute('draggable');
            whiteCapturedArea.appendChild(pieceClone);
        });
        
        // Display black captured pieces
        capturedBlackPieces.forEach(piece => {
            const pieceClone = piece.cloneNode(true);
            pieceClone.removeAttribute('draggable');
            blackCapturedArea.appendChild(pieceClone);
        });
    }
}

// Check if the move is valid for the piece
function isValidMove(draggedPiece, sourceIndex, targetIndex) {
    // First check if target square has a piece of same color
    const targetSquare = document.querySelector(`[data-index="${targetIndex}"]`);
    const targetPiece = targetSquare.querySelector('.piece');
    if (targetPiece) {
        const sourceColor = draggedPiece.getAttribute('data-piece').split('_')[0];
        const targetColor = targetPiece.getAttribute('data-piece').split('_')[0];
        if (sourceColor === targetColor) return false; // Cannot capture own piece
    }

    // Check if the target piece is a king
    if (targetPiece && targetPiece.getAttribute('data-piece').includes('king')) {
        return false; // Cannot capture the king
    }

    // Check for check resolution
    const pieceType = draggedPiece.getAttribute('data-piece');
    const isWhite = pieceType.startsWith('white');
    const kingPos = findKingPosition(isWhite);

    // If king is in check, only allow moves that resolve the check
    if (kingPos && isKingInCheck(kingPos.row, kingPos.col, isWhite)) {
        if (!doesMoveResolveCheck(draggedPiece, sourceIndex, targetIndex)) {
            return false;
        }
    }

    const sourceRow = Math.floor(sourceIndex / 8);
    const sourceCol = sourceIndex % 8;
    const targetRow = Math.floor(targetIndex / 8);
    const targetCol = targetIndex % 8;

    switch (pieceType.split('_')[1]) {
        case 'pawn':
            return validatePawnMove(sourceRow, sourceCol, targetRow, targetCol, pieceType);
        case 'rook':
            return validateRookMove(sourceRow, sourceCol, targetRow, targetCol);
        case 'knight':
            return validateKnightMove(sourceRow, sourceCol, targetRow, targetCol);
        case 'bishop':
            return validateBishopMove(sourceRow, sourceCol, targetRow, targetCol);
        case 'queen':
            return validateQueenMove(sourceRow, sourceCol, targetRow, targetCol);
        case 'king':
            return validateKingMove(sourceRow, sourceCol, targetRow, targetCol);
        default:
            return false;
    }
}

// Add this helper function to check if a path is clear
function isPathClear(sourceRow, sourceCol, targetRow, targetCol) {
    const rowStep = sourceRow === targetRow ? 0 : (targetRow - sourceRow) / Math.abs(targetRow - sourceRow);
    const colStep = sourceCol === targetCol ? 0 : (targetCol - sourceCol) / Math.abs(targetCol - sourceCol);
    
    let currentRow = sourceRow + rowStep;
    let currentCol = sourceCol + colStep;
    
    while (currentRow !== targetRow || currentCol !== targetCol) {
        const square = document.querySelector(`.square[data-index="${currentRow * 8 + currentCol}"]`);
        if (square.querySelector('.piece')) {
            return false; // Path is blocked
        }
        currentRow += rowStep;
        currentCol += colStep;
    }
    return true;
}

// Update the validation functions
function validateRookMove(sourceRow, sourceCol, targetRow, targetCol) {
    if (sourceRow !== targetRow && sourceCol !== targetCol) {
        return false; // Not a straight line
    }
    return isPathClear(sourceRow, sourceCol, targetRow, targetCol);
}

function validateBishopMove(sourceRow, sourceCol, targetRow, targetCol) {
    if (Math.abs(sourceRow - targetRow) !== Math.abs(sourceCol - targetCol)) {
        return false; // Not a diagonal
    }
    return isPathClear(sourceRow, sourceCol, targetRow, targetCol);
}

function validateQueenMove(sourceRow, sourceCol, targetRow, targetCol) {
    if (sourceRow === targetRow || sourceCol === targetCol || 
        Math.abs(sourceRow - targetRow) === Math.abs(sourceCol - targetCol)) {
        return isPathClear(sourceRow, sourceCol, targetRow, targetCol);
    }
    return false;
}

function validatePawnMove(sourceRow, sourceCol, targetRow, targetCol, pieceType) {
    const direction = pieceType.startsWith('white') ? -1 : 1;
    const startingRow = pieceType.startsWith('white') ? 6 : 1;

    // Moving forward one square
    if (sourceCol === targetCol && targetRow === sourceRow + direction) {
        // Check if target square is empty
        const targetSquare = document.querySelector(`.square[data-index="${targetRow * 8 + targetCol}"]`);
        return !targetSquare.querySelector('.piece');
    }

    // Moving forward two squares from starting position
    if (sourceCol === targetCol && sourceRow === startingRow && targetRow === sourceRow + 2 * direction) {
        // Check if both squares in front are empty
        const middleSquare = document.querySelector(`.square[data-index="${(sourceRow + direction) * 8 + sourceCol}"]`);
        const targetSquare = document.querySelector(`.square[data-index="${targetRow * 8 + targetCol}"]`);
        return !middleSquare.querySelector('.piece') && !targetSquare.querySelector('.piece');
    }

    // Capturing diagonally
    if (Math.abs(sourceCol - targetCol) === 1 && targetRow === sourceRow + direction) {
        const targetSquare = document.querySelector(`.square[data-index="${targetRow * 8 + targetCol}"]`);
        const targetPiece = targetSquare.querySelector('.piece');
        return targetPiece && targetPiece.getAttribute('data-piece').startsWith(
            pieceType.startsWith('white') ? 'black' : 'white'
        );
    }

    return false;
}

// Knight doesn't need path checking as it jumps over pieces
function validateKnightMove(sourceRow, sourceCol, targetRow, targetCol) {
    const rowDiff = Math.abs(sourceRow - targetRow);
    const colDiff = Math.abs(sourceCol - targetCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

// Add these functions after your existing validation functions

function isKingInCheck(kingRow, kingCol, isWhiteKing = true) {
    // Check for attacks from all directions
    return isPawnAttackingKing(kingRow, kingCol, isWhiteKing) ||
           isRookAttackingKing(kingRow, kingCol, isWhiteKing) ||
           isKnightAttackingKing(kingRow, kingCol, isWhiteKing) ||
           isBishopAttackingKing(kingRow, kingCol, isWhiteKing) ||
           isQueenAttackingKing(kingRow, kingCol, isWhiteKing);
}

function isPawnAttackingKing(kingRow, kingCol, isWhiteKing) {
    const direction = isWhiteKing ? -1 : 1; // White king looks up, black king looks down
    const attackRows = [kingRow + direction];
    const attackCols = [kingCol - 1, kingCol + 1];

    for (let col of attackCols) {
        if (col >= 0 && col < 8) {
            const squareIndex = (kingRow + direction) * 8 + col;
            const square = document.querySelector(`[data-index="${squareIndex}"]`);
            if (square) {
                const piece = square.querySelector('.piece');
                if (piece) {
                    const pieceType = piece.getAttribute('data-piece');
                    if (pieceType === `${isWhiteKing ? 'black' : 'white'}_pawn`) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function isRookAttackingKing(kingRow, kingCol, isWhiteKing) {
    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1] // Up, Down, Left, Right
    ];
    
    return isAttackingInDirections(kingRow, kingCol, directions, isWhiteKing, ['rook', 'queen']);
}

function isBishopAttackingKing(kingRow, kingCol, isWhiteKing) {
    const directions = [
        [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonals
    ];
    
    return isAttackingInDirections(kingRow, kingCol, directions, isWhiteKing, ['bishop', 'queen']);
}

function isQueenAttackingKing(kingRow, kingCol, isWhiteKing) {
    return isRookAttackingKing(kingRow, kingCol, isWhiteKing) ||
           isBishopAttackingKing(kingRow, kingCol, isWhiteKing);
}

function isKnightAttackingKing(kingRow, kingCol, isWhiteKing) {
    const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (let [rowOffset, colOffset] of knightMoves) {
        const newRow = kingRow + rowOffset;
        const newCol = kingCol + colOffset;

        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const squareIndex = newRow * 8 + newCol;
            const square = document.querySelector(`[data-index="${squareIndex}"]`);
            if (square) {
                const piece = square.querySelector('.piece');
                if (piece) {
                    const pieceType = piece.getAttribute('data-piece');
                    if (pieceType === `${isWhiteKing ? 'black' : 'white'}_knight`) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function isAttackingInDirections(kingRow, kingCol, directions, isWhiteKing, pieceTypes) {
    const enemyColor = isWhiteKing ? 'black' : 'white';

    for (let [rowDir, colDir] of directions) {
        let currentRow = kingRow + rowDir;
        let currentCol = kingCol + colDir;

        while (currentRow >= 0 && currentRow < 8 && currentCol >= 0 && currentCol < 8) {
            const squareIndex = currentRow * 8 + currentCol;
            const square = document.querySelector(`[data-index="${squareIndex}"]`);
            if (square) {
                const piece = square.querySelector('.piece');
                if (piece) {
                    const [color, type] = piece.getAttribute('data-piece').split('_');
                    if (color === enemyColor && pieceTypes.includes(type)) {
                        return true;
                    }
                    break; // Found a piece, stop looking in this direction
                }
            }
            currentRow += rowDir;
            currentCol += colDir;
        }
    }
    return false;
}

// Update validateKingMove to use the new functions
function validateKingMove(sourceRow, sourceCol, targetRow, targetCol) {
    const rowDiff = Math.abs(sourceRow - targetRow);
    const colDiff = Math.abs(sourceCol - targetCol);
    
    // Normal king move
    if (rowDiff <= 1 && colDiff <= 1) {
        // Check if the target square is under attack
        const isWhiteKing = document.querySelector(`[data-index="${sourceRow * 8 + sourceCol}"]`)
            .querySelector('.piece').getAttribute('data-piece').startsWith('white');
        
        // Check if the target square is adjacent to the opposing king
        const opponentKingPos = findKingPosition(!isWhiteKing);
        if (opponentKingPos) {
            const opponentKingRow = opponentKingPos.row;
            const opponentKingCol = opponentKingPos.col;
            if (Math.abs(opponentKingRow - targetRow) <= 1 && Math.abs(opponentKingCol - targetCol) <= 1) {
                return false; // Cannot move into a square adjacent to the opposing king
            }
        }

        return !isKingInCheck(targetRow, targetCol, isWhiteKing);
    }
    
    // Castling logic
    if (rowDiff === 0 && colDiff === 2) {
        const isWhiteKing = sourceRow === 7;
        
        // Check if king has moved
        if ((isWhiteKing && whiteKingMoved) || (!isWhiteKing && blackKingMoved)) {
            return false;
        }
        
        // Check if king is in check
        if (isKingInCheck(sourceRow, sourceCol, isWhiteKing)) {
            return false;
        }
        
        // Kingside castling
        if (targetCol > sourceCol) {
            if (isWhiteKing && whiteKingsideRookMoved) return false;
            if (!isWhiteKing && blackKingsideRookMoved) return false;
            
            return isPathClear(sourceRow, sourceCol, targetRow, 7) &&
                   !isKingInCheck(sourceRow, sourceCol + 1, isWhiteKing) &&
                   !isKingInCheck(sourceRow, sourceCol + 2, isWhiteKing);
        }
        
        // Queenside castling
        if (targetCol < sourceCol) {
            if (isWhiteKing && whiteQueensideRookMoved) return false;
            if (!isWhiteKing && blackQueensideRookMoved) return false;
            
            return isPathClear(sourceRow, sourceCol, targetRow, 0) &&
                   !isKingInCheck(sourceRow, sourceCol - 1, isWhiteKing) &&
                   !isKingInCheck(sourceRow, sourceCol - 2, isWhiteKing);
        }
    }
    
    return false;
}

// Add this function to get current position as a string
function getCurrentPosition() {
    let position = '';
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        const piece = square.querySelector('.piece');
        if (piece) {
            position += piece.getAttribute('data-piece');
        } else {
            position += 'empty';
        }
    });
    return position;
}

// Helper function to find king position
function findKingPosition(isWhite) {
    const kingColor = isWhite ? 'white' : 'black';
    const squares = document.querySelectorAll('.square');
    for (let square of squares) {
        const piece = square.querySelector('.piece');
        if (piece && piece.getAttribute('data-piece') === `${kingColor}_king`) {
            const index = parseInt(square.getAttribute('data-index'));
            return {
                row: Math.floor(index / 8),
                col: index % 8,
                index: index
            };
        }
    }
    return null;
}

// Check if a move would resolve check
function doesMoveResolveCheck(piece, sourceIndex, targetIndex) {
    // Store original state
    const sourceSquare = document.querySelector(`[data-index="${sourceIndex}"]`);
    const targetSquare = document.querySelector(`[data-index="${targetIndex}"]`);
    const targetPiece = targetSquare.querySelector('.piece');
    const isWhite = piece.getAttribute('data-piece').startsWith('white');

    // Make temporary move
    sourceSquare.removeChild(piece);
    if (targetPiece) {
        targetSquare.removeChild(targetPiece);
    }
    targetSquare.appendChild(piece);

    // Check if king is still in check after move
    const kingPos = findKingPosition(isWhite);
    const stillInCheck = kingPos ? isKingInCheck(kingPos.row, kingPos.col, isWhite) : false;

    // Restore original position
    targetSquare.removeChild(piece);
    if (targetPiece) {
        targetSquare.appendChild(targetPiece);
    }
    sourceSquare.appendChild(piece);

    return !stillInCheck;
}

// Initialize the board with pieces and listeners
preloadSounds(); // Preload sounds
initBoard();

// Add this function after handleDrop
function handlePawnPromotion(square, piece) {
    const row = Math.floor(parseInt(square.getAttribute('data-index')) / 8);
    const pieceColor = piece.getAttribute('data-piece').split('_')[0];
    
    // Check if pawn reached the opposite end
    if (piece.getAttribute('data-piece').includes('pawn') && 
        ((pieceColor === 'white' && row === 0) || (pieceColor === 'black' && row === 7))) {
        
        // Create and show promotion modal
        const modal = document.createElement('div');
        modal.className = 'promotion-modal';
        
        // Add promotion piece options
        const pieces = ['queen', 'rook', 'bishop', 'knight'];
        pieces.forEach(pieceType => {
            const option = document.createElement('img');
            option.src = `${piecesFolder}${pieceColor}_${pieceType}.png`;
            option.className = 'promotion-option';
            option.addEventListener('click', () => {
                // Update the piece
                piece.src = option.src;
                piece.setAttribute('data-piece', `${pieceColor}_${pieceType}`);
                sounds.promote.play(); // Play promote sound
                modal.remove();
                updateBoardState();
                updateEvaluationBar();
            });
            modal.appendChild(option);
        });
        
        document.body.appendChild(modal);
    }
}

// Add these functions after your existing isKingInCheck function
function isCheckmate(isWhiteKing) {
    // First verify the king is in check
    const kingPos = findKingPosition(isWhiteKing);
    if (!kingPos || !isKingInCheck(kingPos.row, kingPos.col, isWhiteKing)) {
        return false;
    }

    // Generate all possible moves
    const allMoves = generateAllPossibleMoves(isWhiteKing);
    
    // Try each move to see if it gets out of check
    for (const move of allMoves) {
        const sourceSquare = document.querySelector(`[data-index="${move.from}"]`);
        const piece = sourceSquare.querySelector('.piece');
        if (doesMoveResolveCheck(piece, move.from, move.to)) {
            return false;
        }
    }
    
    return true;
}

function showGameEndModal(message) {
    const modal = document.createElement('div');
    modal.className = 'promotion-modal'; // Reuse the promotion modal styling
    
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.textAlign = 'center';
    messageElement.style.marginBottom = '10px';
    
    const newGameButton = document.createElement('button');
    newGameButton.textContent = 'New Game';
    newGameButton.style.padding = '5px 10px';
    newGameButton.onclick = () => {
        location.reload();
    };
    
    modal.appendChild(messageElement);
    modal.appendChild(newGameButton);
    document.body.appendChild(modal);
}

function initializeTouchAndClickEvents() {
    document.querySelectorAll('.square').forEach(square => {
        // Add click handler for desktop
        square.addEventListener('click', handleSquareClick);
        
        // Prevent default touch behavior that might interfere with our logic
        square.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleSquareClick(e);
        });
        
        // Prevent any default touch behaviors that might interfere
        square.addEventListener('touchend', (e) => {
            e.preventDefault();
        });
    });
}

function handleSquareClick(event) {
    // Get the actual square element, whether from touch or click
    const square = event.target.classList.contains('square') ? 
        event.target : 
        event.target.closest('.square');
    
    if (!square) return;
    
    const piece = square.querySelector('.piece');

    // If no piece is selected
    if (!selectedPiece) {
        if (piece) {
            // Select the piece
            selectedPiece = piece;
            selectedSquare = square;
            square.classList.add('selected-square');
        }
        return;
    }

    // If a piece is already selected
    if (selectedPiece) {
        const sourceIndex = parseInt(selectedSquare.getAttribute('data-index'));
        const targetIndex = parseInt(square.getAttribute('data-index'));

        // Clear previous selection
        selectedSquare.classList.remove('selected-square');

        // If clicking the same square, deselect the piece
        if (square === selectedSquare) {
            selectedPiece = null;
            selectedSquare = null;
            return;
        }

        // Try to make the move
        if (isValidMove(selectedPiece, sourceIndex, targetIndex)) {
            const targetPiece = square.querySelector('.piece');
            
            // Handle capture
            if (targetPiece) {
                const capturedPieceColor = targetPiece.getAttribute('data-piece').split('_')[0];
                if (capturedPieceColor === selectedPiece.getAttribute('data-piece').split('_')[0]) {
                    selectedPiece = null;
                    selectedSquare = null;
                    return;
                }
                targetPiece.remove();
                sounds.capture.play(); // Play capture sound

                if (capturedPieceColor === 'white') {
                    capturedWhitePieces.push(targetPiece);
                } else {
                    capturedBlackPieces.push(targetPiece);
                }
                
                displayCapturedPieces();
            }

            // Move the piece
            square.appendChild(selectedPiece);
            sounds.move.play(); // Play move sound
            handlePawnPromotion(square, selectedPiece);
            
            const currentPosition = getCurrentPosition();
            positionHistory.push(currentPosition);
            
            updateTurn();
            updateEvaluationBar();

            // Check for checkmate
            const pieceColor = selectedPiece.getAttribute('data-piece').split('_')[0];
            const opponentIsWhite = pieceColor === 'black';
            
            if (isCheckmate(opponentIsWhite)) {
                setTimeout(() => {
                    sounds.notify.play(); // Play checkmate sound
                    showGameEndModal(`${pieceColor.charAt(0).toUpperCase() + pieceColor.slice(1)} wins by checkmate!`);
                }, 100);
            }
        }

        // Reset selection
        selectedPiece = null;
        selectedSquare = null;
    }
}


// Add this to your existing JavaScript file
const modeToggle = document.getElementById('mode-toggle');

modeToggle.addEventListener('click', function() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    modeToggle.src = isDarkMode ? 'pieces/night-mode.png' : 'pieces/day-mode.png';
});