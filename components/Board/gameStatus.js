import { isKingInCheck, isCheckmate, isStalemate, isKingAlive } from '../game.logic';
import { playCheckmateSound, playStalemateSound, playKingCapturedSound, playCheckSound } from './sound';

// 게임 상태 체크 (킹 생존, 체크메이트, 스테일메이트)
export const handleGameStatusCheck = ({
  gameOver,
  board,
  currentTurn,
  setGameOver,
  setMessage,
  navigate
}) => {
  if (gameOver) return;

  // 킹 생존 체크 (먼저 확인)
  if (!isKingAlive(board, 'white')) {
    setGameOver(true);
    setMessage('흑 승리 (백의 킹이 잡힘)');
    playKingCapturedSound(); // 킹 사망 사운드로 변경
    setTimeout(() => {
      navigate('/gameover', { state: { winner: '흑' } });
    }, 1500);
    return;
  }
  if (!isKingAlive(board, 'black')) {
    setGameOver(true);
    setMessage('백 승리 (흑의 킹이 잡힘)');
    playKingCapturedSound(); // 킹 사망 사운드로 변경
    setTimeout(() => {
      navigate('/gameover', { state: { winner: '백' } });
    }, 1500);
    return;
  }

  // 현재 턴의 플레이어가 체크 상태인지 확인
  const isCurrentPlayerInCheck = isKingInCheck(board, currentTurn);

  // 체크메이트 체크 (체크 상태에서만 체크메이트 가능)
  if (isCurrentPlayerInCheck && isCheckmate(board, currentTurn)) {
    const winner = currentTurn === 'white' ? '흑' : '백';
    setGameOver(true);
    setMessage(`${winner} 승리 (체크메이트)`);
    playCheckmateSound(); // gameover.mp3 재생
    setTimeout(() => {
      navigate('/gameover', { state: { winner } });
    }, 1500);
    return;
  }

  // 스테일메이트 체크 (체크 상태가 아닐 때만 스테일메이트 가능)
  if (!isCurrentPlayerInCheck && isStalemate(board, currentTurn)) {
    setGameOver(true);
    setMessage('무승부 (스테일메이트)');
    playStalemateSound(); // gameover.mp3 재생
    setTimeout(() => {
      navigate('/gameover', { state: { winner: '무승부' } });
    }, 1500);
    return;
  }

  // 체크 상태 메시지 표시 (게임이 끝나지 않은 경우)
  if (isCurrentPlayerInCheck) {
    const playerName = currentTurn === 'white' ? '백' : '흑';
    setMessage(`${playerName} 체크!`);
    playCheckSound(); // 체크 사운드 재생 추가
  }
};

// 게임 종료 상태 확인
export const checkGameEndConditions = (board) => {
  const whiteInCheck = isKingInCheck(board, 'white');
  const blackInCheck = isKingInCheck(board, 'black');
  
  // 체크메이트는 체크 상태일 때만 확인
  const whiteCheckmate = whiteInCheck ? isCheckmate(board, 'white') : false;
  const blackCheckmate = blackInCheck ? isCheckmate(board, 'black') : false;
  
  // 스테일메이트는 체크 상태가 아닐 때만 확인
  const whiteStalemate = !whiteInCheck ? isStalemate(board, 'white') : false;
  const blackStalemate = !blackInCheck ? isStalemate(board, 'black') : false;

  return {
    whiteInCheck,
    blackInCheck,
    whiteCheckmate,
    blackCheckmate,
    whiteStalemate,
    blackStalemate
  };
};

// 스테일메이트 상세 디버깅 함수 (문제 해결용)
export const debugStalemate = (board, color) => {
  const inCheck = isKingInCheck(board, color);
  const stalematePossible = isStalemate(board, color);
  
  console.log(`=== 스테일메이트 디버그 (${color}) ===`);
  console.log('체크 상태:', inCheck);
  console.log('스테일메이트 판정:', stalematePossible);
  console.log('스테일메이트 조건:', !inCheck && stalematePossible);
  
  return {
    inCheck,
    stalematePossible,
    isStalemate: !inCheck && stalematePossible
  };
};