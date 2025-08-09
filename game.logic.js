// game.logic.js

function isAlly(piece, target) {
  return target && target.color === piece.color;
}

// 좌표 변환 관련 유틸리티 함수들
export const transformCoordinatesForRotation = (row, col, currentTurn) => {
  // 검은색 턴일 때 180도 회전된 좌표로 변환
  if (currentTurn === 'black') {
    return { row: 7 - row, col: 7 - col };
  }
  return { row, col };
};

export const reverseTransformCoordinatesForRotation = (row, col, currentTurn) => {
  // 화면 좌표를 실제 보드 좌표로 역변환
  if (currentTurn === 'black') {
    return { row: 7 - row, col: 7 - col };
  }
  return { row, col };
};

// 말 이동 가능 여부 체크 (룩, 비숍, 퀸, 나이트, 킹, 폰 기본 규칙 포함)
export function canPieceMoveTo(board, fromRow, fromCol, toRow, toCol) {
  if (fromRow === toRow && fromCol === toCol) return false; // 같은 자리 이동 불가

  const piece = board[fromRow][fromCol];
  if (!piece) return false;

  const target = board[toRow][toCol];
  if (isAlly(piece, target)) return false; // 아군 말이 있으면 이동 불가

  const dr = toRow - fromRow;
  const dc = toCol - fromCol;

  switch (piece.type) {
    case 'pawn': {
      const dir = piece.color === 'white' ? -1 : 1;
      const startRow = piece.color === 'white' ? 6 : 1;

      // 앞으로 한 칸 이동
      if (dc === 0 && dr === dir && !target) return true;

      // 처음 두 칸 이동
      if (
        dc === 0 &&
        dr === 2 * dir &&
        fromRow === startRow &&
        !board[fromRow + dir][fromCol] &&
        !target
      ) return true;

      // 대각선 공격
      if (Math.abs(dc) === 1 && dr === dir && target && target.color !== piece.color)
        return true;

      return false;
    }
    case 'rook': {
      if (dr !== 0 && dc !== 0) return false;

      const stepRow = dr === 0 ? 0 : dr / Math.abs(dr);
      const stepCol = dc === 0 ? 0 : dc / Math.abs(dc);

      let r = fromRow + stepRow;
      let c = fromCol + stepCol;

      while (r !== toRow || c !== toCol) {
        if (board[r][c]) return false;
        r += stepRow;
        c += stepCol;
      }
      return true;
    }
    case 'bishop': {
      if (Math.abs(dr) !== Math.abs(dc)) return false;

      const stepRow = dr / Math.abs(dr);
      const stepCol = dc / Math.abs(dc);

      let r = fromRow + stepRow;
      let c = fromCol + stepCol;

      while (r !== toRow && c !== toCol) {
        if (board[r][c]) return false;
        r += stepRow;
        c += stepCol;
      }
      return true;
    }

    case 'queen': {
      // 룩처럼 직선 이동 가능
      if (dr === 0 || dc === 0) {
        const stepRow = dr === 0 ? 0 : dr / Math.abs(dr);
        const stepCol = dc === 0 ? 0 : dc / Math.abs(dc);

        let r = fromRow + stepRow;
        let c = fromCol + stepCol;

        while (r !== toRow || c !== toCol) {
          if (board[r][c]) return false;
          r += stepRow;
          c += stepCol;
        }
        return true;
      }

      // 비숍처럼 대각선 이동 가능
      if (Math.abs(dr) === Math.abs(dc)) {
        const stepRow = dr / Math.abs(dr);
        const stepCol = dc / Math.abs(dc);

        let r = fromRow + stepRow;
        let c = fromCol + stepCol;

        while (r !== toRow && c !== toCol) {
          if (board[r][c]) return false;
          r += stepRow;
          c += stepCol;
        }
        return true;
      }

      return false;
    }

    case 'knight': {
      const validMoves = [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ];
      return validMoves.some(([x, y]) => dr === x && dc === y);
    }
    case 'king': {
      // 캐슬링 제외한 기본 한 칸 이동
      return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    }
    default:
      return false;
  }
}

// 보드 복사 함수
function copyBoard(board) {
  return board.map(row => row.map(piece => piece ? { ...piece } : null));
}

// 가상으로 수를 둔 후 킹이 체크 상태인지 확인
function wouldKingBeInCheckAfterMove(board, fromRow, fromCol, toRow, toCol, color) {
  const newBoard = copyBoard(board);
  const piece = newBoard[fromRow][fromCol];
  
  // 이동 실행
  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = null;
  
  // 이동 후 킹이 체크 상태인지 확인
  return isKingInCheck(newBoard, color);
}

// findKing 수정 (키 이름을 row, col 로 변경)
export function findKing(board, color) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

// isKingInCheck 수정
export function isKingInCheck(board, color) {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color !== color) {
        if (canPieceMoveTo(board, r, c, kingPos.row, kingPos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

// 특정 말의 모든 합법적인 이동 경로 구하기 (킹 안전성 포함)
export function getLegalMovesForPiece(board, fromRow, fromCol) {
  const piece = board[fromRow][fromCol];
  if (!piece) return [];

  const legalMoves = [];

  for (let toRow = 0; toRow < 8; toRow++) {
    for (let toCol = 0; toCol < 8; toCol++) {
      if (canPieceMoveTo(board, fromRow, fromCol, toRow, toCol)) {
        // 이동 후 내 킹이 체크 상태가 되지 않는 경우만 합법적인 수
        if (!wouldKingBeInCheckAfterMove(board, fromRow, fromCol, toRow, toCol, piece.color)) {
          legalMoves.push({ fromRow, fromCol, toRow, toCol });
        }
      }
    }
  }

  return legalMoves;
}

// 회전된 화면에서의 합법적 이동 경로 구하기
export function getLegalMovesForPieceRotated(board, fromRow, fromCol, currentTurn) {
  const moves = getLegalMovesForPiece(board, fromRow, fromCol);
  
  // 검은색 턴이면 화면 좌표를 회전시켜서 반환
  if (currentTurn === 'black') {
    return moves.map(move => ({
      fromRow: 7 - move.fromRow,
      fromCol: 7 - move.fromCol,
      toRow: 7 - move.toRow,
      toCol: 7 - move.toCol
    }));
  }
  
  return moves;
}

// 이동 가능한 합법 수가 있는지 확인
export function hasAnyLegalMove(board, color) {
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (!piece || piece.color !== color) continue;

      const legalMoves = getLegalMovesForPiece(board, fromRow, fromCol);
      if (legalMoves.length > 0) {
        return true;
      }
    }
  }
  return false;
}

// 체크메이트 여부 판단
export function isCheckmate(board, color) {
  return isKingInCheck(board, color) && !hasAnyLegalMove(board, color);
}

// 스테일메이트 여부 판단
export function isStalemate(board, color) {
  const inCheck = isKingInCheck(board, color);
  return !inCheck && !hasAnyLegalMove(board, color);
}

// 킹 생존 여부 판단
export function isKingAlive(board, color) {
  return board.flat().some(piece => piece?.type === 'king' && piece.color === color);
}

export function isKingCaptured(board, color) {
  return !isKingAlive(board, color);
}

// 모든 합법적인 수 반환 (색깔별)
export function getAllLegalMoves(board, color) {
  let allMoves = [];

  board.forEach((row, y) => {
    row.forEach((piece, x) => {
      if (piece && piece.color === color) {
        const moves = getLegalMovesForPiece(board, y, x);
        allMoves.push(...moves);
      }
    });
  });

  return allMoves;
}

// 회전 상태를 고려한 모든 합법적인 수 반환
export function getAllLegalMovesRotated(board, color, currentTurn) {
  const moves = getAllLegalMoves(board, color);
  
  if (currentTurn === 'black') {
    return moves.map(move => ({
      fromRow: 7 - move.fromRow,
      fromCol: 7 - move.fromCol,
      toRow: 7 - move.toRow,
      toCol: 7 - move.toCol
    }));
  }
  
  return moves;
}

// 게임 상태 관리 함수들
export function getGameStatus(board, currentTurn) {
  const inCheck = isKingInCheck(board, currentTurn);
  const hasLegalMoves = hasAnyLegalMove(board, currentTurn);
  const isCheckmate = inCheck && !hasLegalMoves;
  const isStalemate = !inCheck && !hasLegalMoves;
  
  return {
    inCheck,
    hasLegalMoves,
    isCheckmate,
    isStalemate,
    gameOver: isCheckmate || isStalemate
  };
}

// 턴 전환 함수
export function getNextTurn(currentTurn) {
  return currentTurn === 'white' ? 'black' : 'white';
}

// 보드 회전 각도 계산 함수
export function getBoardRotationAngle(currentTurn) {
  return currentTurn === 'white' ? 0 : 180;
}

// 디버깅용 함수들
export function debugGameState(board, color) {
  const inCheck = isKingInCheck(board, color);
  const hasLegalMoves = hasAnyLegalMove(board, color);
  const kingPos = findKing(board, color);
  
  console.log(`=== 게임 상태 디버그 (${color}) ===`);
  console.log('킹 위치:', kingPos);
  console.log('체크 상태:', inCheck);
  console.log('합법적 수 존재:', hasLegalMoves);
  console.log('체크메이트:', inCheck && !hasLegalMoves);
  console.log('스테일메이트:', !inCheck && !hasLegalMoves);
  
  return {
    inCheck,
    hasLegalMoves,
    isCheckmate: inCheck && !hasLegalMoves,
    isStalemate: !inCheck && !hasLegalMoves
  };
}









