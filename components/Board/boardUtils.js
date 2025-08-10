import { isKingInCheck } from '../game.logic';

// 초기 체스보드 설정
export const initialBoard = [
  [
    { type: 'rook', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'rook', color: 'black' }
  ],
  Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' })),
  [
    { type: 'rook', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'queen', color: 'white' },
    { type: 'king', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'rook', color: 'white' }
  ]
];

// 같은 편 말인지 확인
export const isAllyPiece = (piece, targetSquare) => {
  return (
    targetSquare !== null &&
    typeof targetSquare === 'object' &&
    targetSquare.color === piece.color
  );
};

// 캐슬링 시 킹이 지나치는 칸에서 체크 받는지 확인
export const wouldPassThroughCheck = (board, color, row, fromCol, toCol) => {
  const step = toCol > fromCol ? 1 : -1;
  for (let c = fromCol + step; c !== toCol + step; c += step) {
    const tempBoard = board.map(r => r.slice());
    tempBoard[row][c] = { type: 'king', color };
    tempBoard[row][fromCol] = null;
    if (isKingInCheck(tempBoard, color)) return true;
  }
  return false;
};

// hasMoved 상태 업데이트 헬퍼 함수
export const updateHasMovedState = (hasMoved, color, updates) => {
  return {
    ...hasMoved,
    [color]: { ...hasMoved[color], ...updates },
  };
};