// board.js

const board = document.getElementById('board');
const piecesFolder = '../public/pieces/';
let draggedPiece = null;
let sourceSquare = null;
const capturedWhitePieces = [];
const capturedBlackPieces = [];

function initBoard() {
    const initialBoard = [
        ['black_rook', 'black_knight', 'black_bishop', 'black_queen', 'black_king', 'black_bishop', 'black_knight', 'black_rook'],
        ['black_pawn', 'black_pawn', 'black_pawn', 'black_pawn', 'black_pawn', 'black_pawn', 'black_pawn', 'black_pawn'],
        [], [], [], [], 
        ['white_pawn', 'white_pawn', 'white_pawn', 'white_pawn', 'white_pawn', 'white_pawn', 'white_pawn', 'white_pawn'],
        ['white_rook', 'white_knight', 'white_bishop', 'white_queen', 'white_king', 'white_bishop', 'white_knight', 'white_rook']
    ];

    let isWhiteSquare = true;

    for (let i = 0; i < 64; i++) {
        const square = document.createElement('div');
        square.classList.add('square', isWhiteSquare ? 'white' : 'black');
        square.setAttribute('data-index', i);
        board.appendChild(square);
        isWhiteSquare = !isWhiteSquare;

        const row = Math.floor(i / 8);
        const col = i % 8;
        const piece = initialBoard[row][col];

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
        updateTurn();
        updateEvaluationBar();
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
    const pieceType = draggedPiece.getAttribute('data-piece');
    const sourceRow = Math.floor(sourceIndex / 8);
    const sourceCol = sourceIndex % 8;
    const targetRow = Math.floor(targetIndex / 8);
    const targetCol = targetIndex % 8;

    switch (pieceType.split('_')[1]) {  // Get the type of piece (e.g., 'pawn', 'knight')
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

// King moves only one square, so no path checking needed
function validateKingMove(sourceRow, sourceCol, targetRow, targetCol) {
    const rowDiff = Math.abs(sourceRow - targetRow);
    const colDiff = Math.abs(sourceCol - targetCol);
    return rowDiff <= 1 && colDiff <= 1;
}

// Initialize the board with pieces and listeners
initBoard();
