import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Tile from '../Tile/Tile';
import './Board.css';
import { isKingInCheck, isCheckmate, isStalemate, isKingAlive } from '../game.logic';
import ChessTimer from '../ChessTimer';
import PalaceBackground from '../PalaceBackground';
import { initialBoard } from './boardUtils';
import { handleMove, isValidMove, getLegalMoves } from './moveLogic';
import PromotionModal from './PromotionModal';
import { playMoveSound, playCheckSound, playCheckmateSound, playStalemateSound, playGameOverSound } from './sound';

const Board = () => {
  const navigate = useNavigate();

  const [board, setBoard] = useState(initialBoard);
  const [selectedPos, setSelectedPos] = useState(null);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [legalMoves, setLegalMoves] = useState([]);
  const [whiteMoveCount, setWhiteMoveCount] = useState(0);
  const [blackMoveCount, setBlackMoveCount] = useState(0);
  const [hasMoved, setHasMoved] = useState({
    white: { kingMoved: false, rookKingSideMoved: false, rookQueenSideMoved: false },
    black: { kingMoved: false, rookKingSideMoved: false, rookQueenSideMoved: false },
  });
  const [enPassantTarget, setEnPassantTarget] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  // 체크 해소 여부를 검증하는 함수
  const wouldMoveResolveCheck = (selectedPiece, fromRow, fromCol, toRow, toCol, currentBoard, currentTurn) => {
    const tempBoard = currentBoard.map(row => [...row]);
    
    const capturedPiece = tempBoard[toRow][toCol];
    tempBoard[toRow][toCol] = selectedPiece;
    tempBoard[fromRow][fromCol] = null;
    
    if (selectedPiece.type === 'pawn' && Math.abs(fromCol - toCol) === 1 && !capturedPiece) {
      const capturedPawnRow = currentTurn === 'white' ? toRow + 1 : toRow - 1;
      tempBoard[capturedPawnRow][toCol] = null;
    }
    
    if (selectedPiece.type === 'king' && Math.abs(fromCol - toCol) === 2) {
      if (toCol === 6) {
        tempBoard[fromRow][5] = tempBoard[fromRow][7];
        tempBoard[fromRow][7] = null;
      } else if (toCol === 2) {
        tempBoard[fromRow][3] = tempBoard[fromRow][0];
        tempBoard[fromRow][0] = null;
      }
    }
    
    return !isKingInCheck(tempBoard, currentTurn);
  };

  // 항복 처리
  const handleSurrender = (currentTurn) => {
    if (gameOver) return;
    const winner = currentTurn === 'white' ? '흑' : '백';
    setGameOver(true);
    setMessage(`${winner} 승리 (항복)`);
    navigate('/gameover', { state: { winner } });
  };

  // 게임 상태 체크용 메시지에서 승자 추출
  const getWinnerName = (msg) => {
    if (msg.includes('백')) return '백';
    if (msg.includes('흑')) return '흑';
    return '무승부';
  };

  // 메시지 변화에 따른 게임 종료 처리
  useEffect(() => {
    if (message.includes('체크메이트')) {
      playCheckmateSound();
      setTimeout(() => {
        const winner = getWinnerName(message);
        navigate('/gameover', { state: { winner } });
      }, 1000);
    } else if (message.includes('스테일메이트')) {
      playStalemateSound();
      setTimeout(() => {
        navigate('/gameover', { state: { winner: '무승부' } });
      }, 1000);
    } else if (message.includes('항복') || message.includes('시간 초과')) {
      setTimeout(() => {
        const winner = getWinnerName(message);
        navigate('/gameover', { state: { winner } });
      }, 1000);
    }
  }, [message, navigate]);

  // 킹 사망에 따른 게임 종료 처리
  useEffect(() => {
    if (gameOver) return;

    const whiteKingAlive = isKingAlive(board, 'white');
    const blackKingAlive = isKingAlive(board, 'black');

    if (!whiteKingAlive) {
      setGameOver(true);
      setMessage('흑 승리 (백 킹 사망)');
      playGameOverSound();
      setTimeout(() => {
        navigate('/gameover', { state: { winner: '흑' } });
      }, 1000);
    } else if (!blackKingAlive) {
      setGameOver(true);
      setMessage('백 승리 (흑 킹 사망)');
      playGameOverSound();
      setTimeout(() => {
        navigate('/gameover', { state: { winner: '백' } });
      }, 1000);
    }
  }, [board, gameOver, navigate]);

  // 시간 초과 처리
  const handleTimeOut = (color) => {
    if (gameOver) return;
    playGameOverSound();
    setGameOver(true);
    const winner = color === 'white' ? '흑' : '백';
    setMessage(`시간 초과! ${winner} 승리`);
    navigate('/gameover', { state: { winner } });
  };

  // 좌표 변환 함수
  const transformCoordinates = (row, col, isRotated) => {
    if (!isRotated) return { row, col };
    return { row: 7 - row, col: 7 - col };
  };

  // 보드별 말 조작 권한 확인 함수
  const canPlayerControlPiece = (piece, boardType) => {
    if (!piece) return false;
    
    if (boardType === 'white') {
      return piece.color === 'white';
    } else if (boardType === 'black') {
      return piece.color === 'black';
    }
    
    return true;
  };

  // 마지막 이동 위치인지 확인하는 함수
  const isLastMovePosition = (row, col) => {
    if (!lastMove) return false;
    return (lastMove.from.row === row && lastMove.from.col === col) ||
           (lastMove.to.row === row && lastMove.to.col === col);
  };

  // 수정된 클릭 처리 함수
  const handleClick = (row, col, boardType = 'main') => {
    if (gameOver || promotion) return;

    const isRotated = boardType === 'black';
    const { row: actualRow, col: actualCol } = transformCoordinates(row, col, isRotated);
    const clickedPiece = board[actualRow][actualCol];

    // 선택된 칸 다시 클릭하면 선택 해제
    if (selectedPos && selectedPos.row === actualRow && selectedPos.col === actualCol) {
      setSelectedPos(null);
      setLegalMoves([]);
      return;
    }

    // 아무것도 선택하지 않은 상태에서 말을 선택하는 경우
    if (!selectedPos) {
      if (clickedPiece) {
        // 보드별 권한 체크: 해당 보드에서 조작 가능한 말인지 확인
        if (!canPlayerControlPiece(clickedPiece, boardType)) {
          console.log(`❌ ${boardType} 보드에서는 ${clickedPiece.color} 말을 선택할 수 없습니다!`);
          return;
        }
        
        // 현재 턴의 말인지 확인
        if (clickedPiece.color !== currentTurn) {
          console.log(`❌ ${clickedPiece.color} 말은 ${currentTurn} 턴에 움직일 수 없습니다!`);
          return;
        }

        // 유효한 말 선택
        setSelectedPos({ row: actualRow, col: actualCol });
        
        const basicLegalMoves = getLegalMoves(clickedPiece, actualRow, actualCol, board, enPassantTarget, hasMoved);
        const filteredLegalMoves = basicLegalMoves.filter(move => {
          return wouldMoveResolveCheck(clickedPiece, actualRow, actualCol, move.row, move.col, board, currentTurn);
        });
        
        setLegalMoves(filteredLegalMoves);
      }
      return;
    }

    // 이미 말을 선택한 상태에서 이동/공격 처리
    const selectedPiece = board[selectedPos.row][selectedPos.col];

    // 이동 유효성 검사 + 체크 해소 검증
    const basicMoveValid = isValidMove(selectedPiece, selectedPos.row, selectedPos.col, actualRow, actualCol, board, enPassantTarget, hasMoved);
    
    if (basicMoveValid) {
      // 현재 체크 상태 확인
      const isCurrentlyInCheck = isKingInCheck(board, currentTurn);
      
      // 체크 상태라면 이동 후 체크가 해소되는지 확인
      if (isCurrentlyInCheck) {
        const wouldResolveCheck = wouldMoveResolveCheck(selectedPiece, selectedPos.row, selectedPos.col, actualRow, actualCol, board, currentTurn);
        
        if (!wouldResolveCheck) {
          console.log('❌ 체크 상태를 해소하지 못하는 이동입니다!');
          setSelectedPos(null);
          setLegalMoves([]);
          return;
        }
      } else {
        // 체크 상태가 아니어도, 이동 후 자신이 체크에 빠지면 안 됨
        const wouldCauseCheck = !wouldMoveResolveCheck(selectedPiece, selectedPos.row, selectedPos.col, actualRow, actualCol, board, currentTurn);
        
        if (wouldCauseCheck) {
          console.log('❌ 이동 후 자신의 킹이 체크에 빠집니다!');
          setSelectedPos(null);
          setLegalMoves([]);
          return;
        }
      }

      // 유효한 이동/공격 처리
      const moveResult = handleMove({
        board,
        selectedPiece,
        fromRow: selectedPos.row,
        fromCol: selectedPos.col,
        toRow: actualRow,
        toCol: actualCol,
        enPassantTarget,
        hasMoved,
        currentTurn
      });

      // 게임 시작 표시
      if (!gameStarted) {
        setGameStarted(true);
      }

      // 마지막 이동 정보 업데이트
      setLastMove({
        from: { row: selectedPos.row, col: selectedPos.col },
        to: { row: actualRow, col: actualCol }
      });

      playMoveSound();

      // 폰 프로모션 체크
      const promotionRow = selectedPiece.color === 'white' ? 0 : 7;
      const isPawnPromotion = selectedPiece.type === 'pawn' && actualRow === promotionRow;

      if (isPawnPromotion) {
        setBoard(moveResult.newBoard);
        setPromotion({ row: actualRow, col: actualCol, color: selectedPiece.color });
        setSelectedPos(null);
        setLegalMoves([]);
        setHasMoved(moveResult.newHasMoved);
        setEnPassantTarget(moveResult.newEnPassantTarget);
        return;
      }

      // 게임 상태 업데이트
      const nextTurn = currentTurn === 'white' ? 'black' : 'white';
      
      if (currentTurn === 'white') setWhiteMoveCount(c => c + 1);
      else setBlackMoveCount(c => c + 1);

      // 체크 상태 판단
      const whiteInCheck = isKingInCheck(moveResult.newBoard, 'white');
      const blackInCheck = isKingInCheck(moveResult.newBoard, 'black');
      const whiteCheckmate = isCheckmate(moveResult.newBoard, 'white');
      const blackCheckmate = isCheckmate(moveResult.newBoard, 'black');
      const whiteStalemate = isStalemate(moveResult.newBoard, 'white');
      const blackStalemate = isStalemate(moveResult.newBoard, 'black');
      
      if ((whiteInCheck && !whiteCheckmate && !whiteStalemate) || (blackInCheck && !blackCheckmate && !blackStalemate)) {
        playCheckSound();
      }

      let statusMsg = '';
      let gameFinished = false;

      if (whiteCheckmate) {
        statusMsg = '체크메이트: 흑 승';
        gameFinished = true;
      } else if (blackCheckmate) {
        statusMsg = '체크메이트: 백 승';
        gameFinished = true;
      } else if (whiteStalemate || blackStalemate) {
        statusMsg = '스테일메이트';
        gameFinished = true;
      } else if (whiteInCheck || blackInCheck) {
        statusMsg = whiteInCheck ? '백 체크 중' : '흑 체크 중';
      } else {
        statusMsg = `${nextTurn === 'white' ? '백' : '흑'} 턴`;
      }

      // 모든 상태 업데이트
      setBoard(moveResult.newBoard);
      setSelectedPos(null);
      setLegalMoves([]);
      setCurrentTurn(nextTurn);
      setMessage(statusMsg);
      setGameOver(gameFinished);
      setHasMoved(moveResult.newHasMoved);
      setEnPassantTarget(moveResult.newEnPassantTarget);

    } else {
      // 유효하지 않은 이동 시: 다른 아군 말 선택 가능
      if (clickedPiece && clickedPiece.color === currentTurn && canPlayerControlPiece(clickedPiece, boardType)) {
        setSelectedPos({ row: actualRow, col: actualCol });
        
        const basicLegalMoves = getLegalMoves(clickedPiece, actualRow, actualCol, board, enPassantTarget, hasMoved);
        const filteredLegalMoves = basicLegalMoves.filter(move => {
          return wouldMoveResolveCheck(clickedPiece, actualRow, actualCol, move.row, move.col, board, currentTurn);
        });
        
        setLegalMoves(filteredLegalMoves);
      } else {
        // 공격할 수 없는 대상이면 선택 해제
        setSelectedPos(null);
        setLegalMoves([]);
      }
    }
  };

  // 프로모션 말 선택 처리
  const handlePromotionChoice = (newType) => {
    if (!promotion) return;
    const { row, col, color } = promotion;
    const newBoard = board.map(r => r.slice());
    newBoard[row][col] = { type: newType, color };

    setBoard(newBoard);
    setPromotion(null);
    const nextTurn = currentTurn === 'white' ? 'black' : 'white';
    setCurrentTurn(nextTurn);
    setMessage(`${nextTurn === 'white' ? '백' : '흑'} 턴`);
  };

  // 렌더링용 보드 생성 함수
  const getRenderBoard = (isRotated = false) => {
    if (!isRotated) return board;
    return board.slice().reverse().map(row => row.slice().reverse());
  };

  // 하이라이트 위치 변환
  const transformHighlights = (moves, isRotated) => {
    if (!isRotated) return moves;
    return moves.map(move => ({
      row: 7 - move.row,
      col: 7 - move.col
    }));
  };

  // 마지막 이동 위치 변환
  const getTransformedLastMove = (isRotated) => {
    if (!lastMove) return null;
    if (!isRotated) return lastMove;
    
    return {
      from: { row: 7 - lastMove.from.row, col: 7 - lastMove.from.col },
      to: { row: 7 - lastMove.to.row, col: 7 - lastMove.to.col }
    };
  };

  // 개별 보드 렌더링 함수
  const renderSingleBoard = (isRotated, boardType, title, timerColor) => {
    const renderBoard = getRenderBoard(isRotated);
    const transformedLegalMoves = transformHighlights(legalMoves, isRotated);
    const transformedSelectedPos = selectedPos ?
      (isRotated ? { row: 7 - selectedPos.row, col: 7 - selectedPos.col } : selectedPos) : null;
    
    const transformedLastMove = getTransformedLastMove(isRotated);

    return (
      <div className="board-wrapper">
        {/* 타이머 */}
        <div className={`timer ${timerColor === 'white' ? 'white-timer' : 'black-timer'}`}>
          <ChessTimer 
            currentTurn={currentTurn} 
            onTimeOut={handleTimeOut} 
            gameOver={gameOver}
            color={timerColor}
            gameStarted={gameStarted}
          />
        </div>
        
        {/* 체스보드 */}
        <div className="board">
          {renderBoard.map((rowArray, rowIdx) =>
            rowArray.map((piece, colIdx) => {
              const color = (rowIdx + colIdx) % 2 === 0 ? 'light' : 'dark';
              const isHighlighted = transformedLegalMoves.some(m => m.row === rowIdx && m.col === colIdx);
              const isSelected = transformedSelectedPos && transformedSelectedPos.row === rowIdx && transformedSelectedPos.col === colIdx;
              
              const isLastMovePos = transformedLastMove && (
                (transformedLastMove.from.row === rowIdx && transformedLastMove.from.col === colIdx) ||
                (transformedLastMove.to.row === rowIdx && transformedLastMove.to.col === colIdx)
              );

              return (
                <Tile
                  key={`${boardType}-${rowIdx}-${colIdx}`}
                  color={color}
                  piece={piece}
                  onClick={() => handleClick(rowIdx, colIdx, boardType)}
                  highlight={isSelected}
                  isMoveOption={isHighlighted}
                  isRotated={isRotated}
                  isLastMove={isLastMovePos && !isSelected}
                />
              );
            })
          )}
        </div>

        {/* 관점 라벨 */}
        <div className={`perspective-label ${isRotated ? 'black-perspective' : 'white-perspective'}`}>
          {title}
        </div>
      </div>
    );
  };

  // Board.js에서 return 부분의 스타일을 다음과 같이 수정하세요

return (
  <div className="main-container">
    <PalaceBackground />

    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* 상단 정보 영역 */}
      <div className="top-info-area">
        <h1
          style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            margin: 0,
            color: 'white',
            textShadow: '1px 1px 2px black',
          }}
        >
          듀얼 체스게임
        </h1>

          <div
              style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '8px 16px',
              borderRadius: '12px',
              border: '2px solid #ccc',
              maxWidth: '300px', // 최대 폭 제한
              position: 'absolute', // 부모를 기준으로 위치 지정
              top: '50px',           // y축은 그대로
              left: '55%',           // x축 기준 중앙으로 이동
              transform: 'translateX(-50%)', // 자기 너비의 절반만큼 왼쪽으로 당김
            }}
          >

          <div
            style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: gameOver ? 'red' : message.includes('체크') ? 'goldenrod' : '#333',
              whiteSpace: 'nowrap',
            }}
          >
            {message || `${currentTurn === 'white' ? '백' : '흑'} 턴`}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              lineHeight: '1.2em',
            }}
          >
            <div>♙ 백: {whiteMoveCount}</div>
            <div>♟ 흑: {blackMoveCount}</div>
          </div>

          <button
            onClick={() => handleSurrender(currentTurn)}
            disabled={gameOver}
            style={{
              padding: '6px 12px',
              fontWeight: 'bold',
              borderRadius: '6px',
              border: '1px solid #aaa',
              backgroundColor: '#fff',
              cursor: gameOver ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
            }}
          >
            항복
          </button>
        </div>
      </div>

      {/* 듀얼 체스보드 영역 */}
      <div className="boards-container">
        {/* 왼쪽: 흰색 관점 체스보드 */}
        {renderSingleBoard(false, 'white', '🤍 흰색 플레이어', 'white')}
        
        {/* 오른쪽: 검은색 관점 체스보드 */}
        {renderSingleBoard(true, 'black', '🖤 검은색 플레이어', 'black')}
      </div>

      {/* 프로모션 UI */}
      {promotion && (
        <PromotionModal
          promotion={promotion}
          onPromotionChoice={handlePromotionChoice}
        />
      )}
    </div>
  </div>
);
};

export default Board;
