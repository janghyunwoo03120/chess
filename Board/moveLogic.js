import { isAllyPiece, wouldPassThroughCheck, updateHasMovedState } from './boardUtils';
import { isKingInCheck } from '../game.logic';

// 좌표 변환 함수 (회전된 화면에서 실제 보드 좌표로)
export const transformCoordinates = (row, col, isRotated) => {
  if (!isRotated) return { row, col };
  return { row: 7 - row, col: 7 - col };
};

// 역 좌표 변환 함수 (실제 보드 좌표에서 화면 좌표로)
export const reverseTransformCoordinates = (row, col, isRotated) => {
  if (!isRotated) return { row, col };
  return { row: 7 - row, col: 7 - col };
};

// 각 말 별 유효 이동 여부 확인
export const isValidMove = (piece, fromRow, fromCol, toRow, toCol, board, enPassantTarget, hasMoved) => {
  const dr = toRow - fromRow;
  const dc = toCol - fromCol;

  switch (piece.type) {
    case 'pawn': {
      const direction = piece.color === 'white' ? -1 : 1;
      const startRow = piece.color === 'white' ? 6 : 1;

      // 앞으로 한 칸
      if (dr === direction && dc === 0 && board[toRow][toCol] === null) return true;

      // 처음 두 칸 이동
      if (
        fromRow === startRow &&
        dr === direction * 2 &&
        dc === 0 &&
        board[fromRow + direction][fromCol] === null &&
        board[toRow][toCol] === null
      ) return true;

      // 대각선 공격
      if (
        dr === direction &&
        Math.abs(dc) === 1 &&
        board[toRow][toCol] !== null &&
        board[toRow][toCol].color !== piece.color
      ) return true;

      // 앙파상
      if (
        dr === direction &&
        Math.abs(dc) === 1 &&
        board[toRow][toCol] === null &&
        enPassantTarget !== null &&
        toRow === enPassantTarget[0] &&
        toCol === enPassantTarget[1]
      ) return true;

      return false;
    }
    case 'rook': {
      if (dr !== 0 && dc !== 0) return false;
      let stepRow = dr > 0 ? 1 : dr < 0 ? -1 : 0;
      let stepCol = dc > 0 ? 1 : dc < 0 ? -1 : 0;

      let r = fromRow + stepRow;
      let c = fromCol + stepCol;

      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (r === toRow && c === toCol) break;

        if (board[r][c] !== null) return false;
        r += stepRow;
        c += stepCol;
      }

      if (isAllyPiece(piece, board[toRow][toCol])) return false;
      return true;
    }

    case 'bishop': {
      if (Math.abs(dr) !== Math.abs(dc)) return false;
      let stepRow = dr > 0 ? 1 : -1;
      let stepCol = dc > 0 ? 1 : -1;

      let r = fromRow + stepRow;
      let c = fromCol + stepCol;

      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (r === toRow && c === toCol) break;

        if (board[r][c] !== null) return false;
        r += stepRow;
        c += stepCol;
      }

      if (isAllyPiece(piece, board[toRow][toCol])) return false;
      return true;
    }

    case 'queen': {
      if (
        isValidMove({ type: 'rook', color: piece.color }, fromRow, fromCol, toRow, toCol, board, enPassantTarget, hasMoved)
      ) {
        return true;
      }
      if (
        isValidMove({ type: 'bishop', color: piece.color }, fromRow, fromCol, toRow, toCol, board, enPassantTarget, hasMoved)
      ) {
        return true;
      }
      return false;
    }
    case 'king': {
      if (isAllyPiece(piece, board[toRow][toCol])) return false;

      // 캐슬링 조건
      if (!hasMoved[piece.color].kingMoved && fromRow === toRow) {
        if (
          dc === 2 &&
          !hasMoved[piece.color].rookKingSideMoved &&
          board[fromRow][fromCol + 1] === null &&
          board[fromRow][fromCol + 2] === null &&
          !isKingInCheck(board, piece.color) &&
          !wouldPassThroughCheck(board, piece.color, fromRow, fromCol, fromCol + 1) &&
          !wouldPassThroughCheck(board, piece.color, fromRow, fromCol, fromCol + 2)
        ) {
          return true;
        }
        if (
          dc === -2 &&
          !hasMoved[piece.color].rookQueenSideMoved &&
          board[fromRow][fromCol - 1] === null &&
          board[fromRow][fromCol - 2] === null &&
          board[fromRow][fromCol - 3] === null &&
          !isKingInCheck(board, piece.color) &&
          !wouldPassThroughCheck(board, piece.color, fromRow, fromCol, fromCol - 1) &&
          !wouldPassThroughCheck(board, piece.color, fromRow, fromCol, fromCol - 2)
        ) {
          return true;
        }
      }

      return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    }
    case 'knight':
      if (isAllyPiece(piece, board[toRow][toCol])) return false;
      return (
        (Math.abs(dr) === 2 && Math.abs(dc) === 1) ||
        (Math.abs(dr) === 1 && Math.abs(dc) === 2)
      );
    default:
      return false;
  }
};

// 현재 말의 합법적 이동 위치 반환 (회전 상태 고려)
export const getLegalMoves = (piece, row, col, board, enPassantTarget, hasMoved) => {
  const moves = [];
  if (!piece) return moves;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isValidMove(piece, row, col, r, c, board, enPassantTarget, hasMoved)) {
        moves.push({ row: r, col: c });
      }
    }
  }
  return moves;
};

// 회전된 화면에서의 합법적 이동 위치 반환
export const getLegalMovesForRotatedBoard = (piece, row, col, board, enPassantTarget, hasMoved, isRotated) => {
  const moves = getLegalMoves(piece, row, col, board, enPassantTarget, hasMoved);
  
  if (!isRotated) return moves;
  
  // 회전된 화면에서 보여줄 좌표로 변환
  return moves.map(move => reverseTransformCoordinates(move.row, move.col, isRotated));
};

// 이동 처리 로직
export const handleMove = ({
  board,
  selectedPiece,
  fromRow,
  fromCol,
  toRow,
  toCol,
  enPassantTarget,
  hasMoved,
  currentTurn
}) => {
  const newBoard = board.map(r => r.slice());
  let newHasMoved = { ...hasMoved };
  let newEnPassantTarget = null;

  // 앙파상 캡처 처리
  if (
    selectedPiece.type === 'pawn' &&
    Math.abs(toCol - fromCol) === 1 &&
    toRow - fromRow === (selectedPiece.color === 'white' ? -1 : 1) &&
    board[toRow][toCol] === null &&
    enPassantTarget !== null &&
    toRow === enPassantTarget[0] &&
    toCol === enPassantTarget[1]
  ) {
    const captureRow = selectedPiece.color === 'white' ? toRow + 1 : toRow - 1;
    newBoard[captureRow][toCol] = null;
  }

  // 캐슬링 처리
  if (
    selectedPiece.type === 'king' &&
    Math.abs(toCol - fromCol) === 2 &&
    toRow === fromRow
  ) {
    if (toCol > fromCol) {
      // 킹사이드 캐슬링
      newBoard[toRow][toCol] = selectedPiece;
      newBoard[fromRow][fromCol] = null;
      newBoard[toRow][toCol - 1] = newBoard[toRow][7];
      newBoard[toRow][7] = null;
    } else {
      // 퀸사이드 캐슬링
      newBoard[toRow][toCol] = selectedPiece;
      newBoard[fromRow][fromCol] = null;
      newBoard[toRow][toCol + 1] = newBoard[toRow][0];
      newBoard[toRow][0] = null;
    }
    newHasMoved = updateHasMovedState(newHasMoved, selectedPiece.color, {
      kingMoved: true,
      rookKingSideMoved: toCol > fromCol ? true : hasMoved[selectedPiece.color].rookKingSideMoved,
      rookQueenSideMoved: toCol < fromCol ? true : hasMoved[selectedPiece.color].rookQueenSideMoved,
    });
  } else {
    // 일반 이동
    newBoard[toRow][toCol] = selectedPiece;
    newBoard[fromRow][fromCol] = null;

    if (selectedPiece.type === 'king') {
      newHasMoved = updateHasMovedState(newHasMoved, selectedPiece.color, { kingMoved: true });
    }
    if (selectedPiece.type === 'rook') {
      if (fromCol === 0) {
        newHasMoved = updateHasMovedState(newHasMoved, selectedPiece.color, { rookQueenSideMoved: true });
      } else if (fromCol === 7) {
        newHasMoved = updateHasMovedState(newHasMoved, selectedPiece.color, { rookKingSideMoved: true });
      }
    }
  }

  // 앙파상 타겟 업데이트 (폰 두 칸 전진 시)
  if (
    selectedPiece.type === 'pawn' &&
    Math.abs(toRow - fromRow) === 2
  ) {
    newEnPassantTarget = [(fromRow + toRow) / 2, toCol];
  }

  return {
    newBoard,
    newHasMoved,
    newEnPassantTarget
  };
};