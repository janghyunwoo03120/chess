// components/OnlineGameLogic.js
import { isKingInCheck, isCheckmate, isStalemate, isKingAlive } from './game.logic';
import { playMoveSound, playCheckSound, playCheckmateSound, playStalemateSound, playGameOverSound } from './Board/sound';

// 온라인 게임에서의 이동 검증
export const validateOnlineMove = (board, fromRow, fromCol, toRow, toCol, currentTurn, playerColor) => {
  // 온라인 게임에서는 자신의 턴과 색깔만 이동 가능
  if (currentTurn !== playerColor) {
    return {
      valid: false,
      error: '상대방의 턴입니다'
    };
  }

  const piece = board[fromRow][fromCol];
  if (!piece) {
    return {
      valid: false,
      error: '선택한 위치에 말이 없습니다'
    };
  }

  if (piece.color !== playerColor) {
    return {
      valid: false,
      error: '자신의 말만 움직일 수 있습니다'
    };
  }

  return {
    valid: true,
    error: null
  };
};

// 게임 상태 업데이트 및 검증
export const updateGameState = (moveResult, currentTurn, gameOver) => {
  const { newBoard } = moveResult;
  const nextTurn = currentTurn === 'white' ? 'black' : 'white';

  // 킹 생존 체크
  const whiteKingAlive = isKingAlive(newBoard, 'white');
  const blackKingAlive = isKingAlive(newBoard, 'black');

  if (!whiteKingAlive) {
    return {
      gameOver: true,
      winner: '흑',
      message: '흑 승리 (백 킹 사망)',
      nextTurn: currentTurn,
      sound: 'gameOver'
    };
  }

  if (!blackKingAlive) {
    return {
      gameOver: true,
      winner: '백',
      message: '백 승리 (흑 킹 사망)',
      nextTurn: currentTurn,
      sound: 'gameOver'
    };
  }

  // 체크 상태 확인
  const whiteInCheck = isKingInCheck(newBoard, 'white');
  const blackInCheck = isKingInCheck(newBoard, 'black');
  const whiteCheckmate = whiteInCheck && isCheckmate(newBoard, 'white');
  const blackCheckmate = blackInCheck && isCheckmate(newBoard, 'black');
  const whiteStalemate = !whiteInCheck && isStalemate(newBoard, 'white');
  const blackStalemate = !blackInCheck && isStalemate(newBoard, 'black');

  // 체크메이트 확인
  if (whiteCheckmate) {
    return {
      gameOver: true,
      winner: '흑',
      message: '체크메이트: 흑 승',
      nextTurn: currentTurn,
      sound: 'checkmate'
    };
  }

  if (blackCheckmate) {
    return {
      gameOver: true,
      winner: '백',
      message: '체크메이트: 백 승',
      nextTurn: currentTurn,
      sound: 'checkmate'
    };
  }

  // 스테일메이트 확인
  if (whiteStalemate || blackStalemate) {
    return {
      gameOver: true,
      winner: '무승부',
      message: '스테일메이트',
      nextTurn: currentTurn,
      sound: 'stalemate'
    };
  }

  // 체크 상태 확인
  if (whiteInCheck || blackInCheck) {
    const checkedPlayer = whiteInCheck ? '백' : '흑';
    return {
      gameOver: false,
      winner: null,
      message: `${checkedPlayer} 체크 중`,
      nextTurn,
      sound: 'check'
    };
  }

  // 일반적인 턴 진행
  return {
    gameOver: false,
    winner: null,
    message: `${nextTurn === 'white' ? '백' : '흑'} 턴`,
    nextTurn,
    sound: 'move'
  };
};

// 온라인 게임용 이동 데이터 생성
export const createMoveData = (gameState, moveInfo, moveCount) => {
  return {
    move: {
      from: { row: moveInfo.fromRow, col: moveInfo.fromCol },
      to: { row: moveInfo.toRow, col: moveInfo.toCol },
      piece: moveInfo.piece
    },
    newBoard: gameState.board,
    currentTurn: gameState.currentTurn,
    gameStatus: {
      message: gameState.message,
      gameOver: gameState.gameOver,
      winner: gameState.winner
    },
    gameData: {
      hasMoved: gameState.hasMoved,
      enPassantTarget: gameState.enPassantTarget,
      lastMove: gameState.lastMove,
      whiteMoveCount: moveCount.white,
      blackMoveCount: moveCount.black
    },
    timeRemaining: {
      white: gameState.whiteTime || 600,
      black: gameState.blackTime || 600
    }
  };
};

// 상대방 이동 적용
export const applyOpponentMove = (currentGameState, moveData) => {
  const {
    newBoard,
    currentTurn,
    gameStatus,
    gameData,
    timeRemaining
  } = moveData;

  // 사운드 재생
  playMoveSound();

  if (gameStatus.message.includes('체크메이트')) {
    playCheckmateSound();
  } else if (gameStatus.message.includes('스테일메이트')) {
    playStalemateSound();
  } else if (gameStatus.message.includes('체크')) {
    playCheckSound();
  } else if (gameStatus.gameOver) {
    playGameOverSound();
  }

  return {
    ...currentGameState,
    board: newBoard,
    currentTurn,
    message: gameStatus.message,
    gameOver: gameStatus.gameOver,
    winner: gameStatus.winner,
    hasMoved: gameData.hasMoved,
    enPassantTarget: gameData.enPassantTarget,
    lastMove: gameData.lastMove,
    whiteMoveCount: gameData.whiteMoveCount,
    blackMoveCount: gameData.blackMoveCount,
    whiteTime: timeRemaining?.white,
    blackTime: timeRemaining?.black,
    selectedPos: null,
    legalMoves: []
  };
};

// 게임 동기화 데이터 생성
export const createSyncData = (gameState) => {
  return {
    board: gameState.board,
    currentTurn: gameState.currentTurn,
    message: gameState.message,
    gameOver: gameState.gameOver,
    winner: gameState.winner,
    hasMoved: gameState.hasMoved,
    enPassantTarget: gameState.enPassantTarget,
    lastMove: gameState.lastMove,
    whiteMoveCount: gameState.whiteMoveCount,
    blackMoveCount: gameState.blackMoveCount,
    gameStarted: gameState.gameStarted,
    whiteTime: gameState.whiteTime || 600,
    blackTime: gameState.blackTime || 600
  };
};

// 좌표 변환 (플레이어 색깔에 따른 보드 회전)
export const transformCoordinatesForPlayer = (row, col, playerColor) => {
  if (playerColor === 'white') {
    return { row, col }; // 흰색 플레이어는 그대로
  } else {
    return { row: 7 - row, col: 7 - col }; // 검은색 플레이어는 회전
  }
};

export const reverseTransformCoordinatesForPlayer = (row, col, playerColor) => {
  if (playerColor === 'white') {
    return { row, col };
  } else {
    return { row: 7 - row, col: 7 - col };
  }
};

// 하이라이트 위치 변환
export const transformHighlightsForPlayer = (highlights, playerColor) => {
  if (playerColor === 'white') {
    return highlights;
  } else {
    return highlights.map(highlight => ({
      row: 7 - highlight.row,
      col: 7 - highlight.col
    }));
  }
};

// 마지막 이동 위치 변환
export const transformLastMoveForPlayer = (lastMove, playerColor) => {
  if (!lastMove || playerColor === 'white') {
    return lastMove;
  } else {
    return {
      from: { row: 7 - lastMove.from.row, col: 7 - lastMove.from.col },
      to: { row: 7 - lastMove.to.row, col: 7 - lastMove.to.col }
    };
  }
};

// 온라인 게임 상태 초기값
export const getInitialOnlineGameState = () => {
  return {
    isConnected: false,
    isInRoom: false,
    roomCode: null,
    playerColor: null,
    playerName: null,
    opponent: null,
    waitingForOpponent: true,
    gameStarted: false,
    connectionStatus: 'disconnected'
  };
};

// 연결 상태 메시지 생성
export const getConnectionStatusMessage = (onlineState) => {
  if (!onlineState.isConnected) {
    return '서버에 연결 중...';
  }
  
  if (!onlineState.isInRoom) {
    return '방에 입장 중...';
  }
  
  if (onlineState.waitingForOpponent) {
    return '상대방을 기다리는 중...';
  }
  
  if (!onlineState.gameStarted) {
    return '게임 시작 준비 중...';
  }
  
  return null;
};