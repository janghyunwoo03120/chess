import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import Tile from '../Tile/Tile';
import './Board.css';
import { isKingInCheck, isCheckmate, isStalemate, isKingAlive } from '../game.logic';
import ChessTimer from '../ChessTimer';
import PalaceBackground from '../PalaceBackground';
import { initialBoard } from './boardUtils';
import { handleMove, isValidMove, getLegalMoves } from './moveLogic';
import PromotionModal from './PromotionModal';
import { playMoveSound, playCheckSound, playCheckmateSound, playStalemateSound, playGameOverSound } from './sound';

const ClassicBoard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null);
  
  // location.state에서 온라인 게임 정보 가져오기
  const onlineGameData = location.state || {};
  const isOnlineGame = onlineGameData.mode === 'online';
  const playerColor = onlineGameData.playerColor; // 'white' 또는 'black'
  const roomCode = onlineGameData.roomCode;
  const opponent = onlineGameData.opponent;

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
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // 온라인 게임 소켓 설정
  useEffect(() => {
    if (isOnlineGame && onlineGameData.socketId) {
      const socket = io('http://localhost:3001', {
        transports: ['websocket', 'polling']
      });
      
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('게임 화면에서 소켓 연결됨');
        setConnectionStatus('connected');
        
        // 방에 재입장
        socket.emit('rejoin-game', { roomCode });
      });

      // 상대방 이동 수신
      socket.on('opponent-move', (moveData) => {
        console.log('상대방 이동 수신:', moveData);
        applyOpponentMove(moveData);
      });

      // 게임 상태 동기화
      socket.on('game-sync', (gameData) => {
        console.log('게임 상태 동기화:', gameData);
        syncGameState(gameData);
      });

      // 상대방 연결 해제
      socket.on('opponent-disconnected', () => {
        alert('상대방이 연결을 해제했습니다.');
        navigate('/');
      });

      socket.on('connect_error', () => {
        setConnectionStatus('error');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isOnlineGame, onlineGameData, roomCode, navigate]);

  // 상대방 이동 적용
  const applyOpponentMove = (moveData) => {
    const { board: newBoard, currentTurn: newTurn, message: newMessage, 
            whiteMoveCount: newWhiteCount, blackMoveCount: newBlackCount,
            hasMoved: newHasMoved, enPassantTarget: newEnPassant, lastMove: newLastMove } = moveData;
    
    setBoard(newBoard);
    setCurrentTurn(newTurn);
    setMessage(newMessage);
    setWhiteMoveCount(newWhiteCount);
    setBlackMoveCount(newBlackCount);
    setHasMoved(newHasMoved);
    setEnPassantTarget(newEnPassant);
    setLastMove(newLastMove);
    
    playMoveSound();
    
    // 체크/체크메이트 사운드
    if (newMessage.includes('체크메이트')) {
      playCheckmateSound();
    } else if (newMessage.includes('체크')) {
      playCheckSound();
    }
  };

  // 게임 상태 동기화
  const syncGameState = (gameData) => {
    setBoard(gameData.board);
    setCurrentTurn(gameData.currentTurn);
    setMessage(gameData.message);
    setWhiteMoveCount(gameData.whiteMoveCount);
    setBlackMoveCount(gameData.blackMoveCount);
    setHasMoved(gameData.hasMoved);
    setEnPassantTarget(gameData.enPassantTarget);
    setLastMove(gameData.lastMove);
    setGameOver(gameData.gameOver);
  };

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
  const handleSurrender = () => {
    if (gameOver) return;
    
    if (isOnlineGame && socketRef.current) {
      socketRef.current.emit('surrender', { roomCode, playerColor });
    }
    
    const winner = currentTurn === 'white' ? '흑' : '백';
    setGameOver(true);
    setMessage(`${winner} 승리 (항복)`);
    navigate('/gameover', { state: { winner, gameType: 'classic' } });
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
        navigate('/gameover', { state: { winner, gameType: 'classic' } });
      }, 1000);
    } else if (message.includes('스테일메이트')) {
      playStalemateSound();
      setTimeout(() => {
        navigate('/gameover', { state: { winner: '무승부', gameType: 'classic' } });
      }, 1000);
    } else if (message.includes('항복') || message.includes('시간 초과')) {
      setTimeout(() => {
        const winner = getWinnerName(message);
        navigate('/gameover', { state: { winner, gameType: 'classic' } });
      }, 1000);
    }
  }, [message, navigate]);

  // 시간 초과 처리
  const handleTimeOut = (color) => {
    if (gameOver) return;
    
    if (isOnlineGame && socketRef.current) {
      socketRef.current.emit('timeout', { roomCode, color });
    }
    
    playGameOverSound();
    setGameOver(true);
    const winner = color === 'white' ? '흑' : '백';
    setMessage(`시간 초과! ${winner} 승리`);
    navigate('/gameover', { state: { winner, gameType: 'classic' } });
  };

  // 클릭 처리 함수
  const handleClick = (row, col) => {
    if (gameOver || promotion) return;
    
    // 온라인 게임에서는 자신의 턴과 색깔만 조작 가능
    if (isOnlineGame && currentTurn !== playerColor) {
      console.log('상대방 턴입니다!');
      return;
    }

    const clickedPiece = board[row][col];

    // 선택된 칸 다시 클릭하면 선택 해제
    if (selectedPos && selectedPos.row === row && selectedPos.col === col) {
      setSelectedPos(null);
      setLegalMoves([]);
      return;
    }

    // 아무것도 선택하지 않은 상태에서 말을 선택하는 경우
    if (!selectedPos) {
      if (clickedPiece) {
        // 현재 턴의 말인지 확인
        if (clickedPiece.color !== currentTurn) {
          console.log(`❌ ${clickedPiece.color} 말은 ${currentTurn} 턴에 움직일 수 없습니다!`);
          return;
        }

        // 온라인 게임에서는 자신의 색깔만 조작 가능
        if (isOnlineGame && clickedPiece.color !== playerColor) {
          console.log('❌ 자신의 말만 조작할 수 있습니다!');
          return;
        }

        // 유효한 말 선택
        setSelectedPos({ row, col });
        
        const basicLegalMoves = getLegalMoves(clickedPiece, row, col, board, enPassantTarget, hasMoved);
        const filteredLegalMoves = basicLegalMoves.filter(move => {
          return wouldMoveResolveCheck(clickedPiece, row, col, move.row, move.col, board, currentTurn);
        });
        
        setLegalMoves(filteredLegalMoves);
      }
      return;
    }

    // 이미 말을 선택한 상태에서 이동/공격 처리
    const selectedPiece = board[selectedPos.row][selectedPos.col];

    // 이동 유효성 검사
    const basicMoveValid = isValidMove(selectedPiece, selectedPos.row, selectedPos.col, row, col, board, enPassantTarget, hasMoved);
    
    if (basicMoveValid) {
      // 체크 해소 검증
      const isCurrentlyInCheck = isKingInCheck(board, currentTurn);
      
      if (isCurrentlyInCheck) {
        const wouldResolveCheck = wouldMoveResolveCheck(selectedPiece, selectedPos.row, selectedPos.col, row, col, board, currentTurn);
        
        if (!wouldResolveCheck) {
          console.log('❌ 체크 상태를 해소하지 못하는 이동입니다!');
          setSelectedPos(null);
          setLegalMoves([]);
          return;
        }
      } else {
        const wouldCauseCheck = !wouldMoveResolveCheck(selectedPiece, selectedPos.row, selectedPos.col, row, col, board, currentTurn);
        
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
        toRow: row,
        toCol: col,
        enPassantTarget,
        hasMoved,
        currentTurn
      });

      // 게임 시작 표시
      if (!gameStarted) {
        setGameStarted(true);
      }

      // 마지막 이동 정보 업데이트
      const newLastMove = {
        from: { row: selectedPos.row, col: selectedPos.col },
        to: { row, col }
      };
      setLastMove(newLastMove);

      playMoveSound();

      // 폰 프로모션 체크
      const promotionRow = selectedPiece.color === 'white' ? 0 : 7;
      const isPawnPromotion = selectedPiece.type === 'pawn' && row === promotionRow;

      if (isPawnPromotion) {
        setBoard(moveResult.newBoard);
        setPromotion({ row, col, color: selectedPiece.color });
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

      // 온라인 게임에서 상대방에게 이동 전송
      if (isOnlineGame && socketRef.current) {
        const moveData = {
          roomCode,
          board: moveResult.newBoard,
          currentTurn: nextTurn,
          message: statusMsg,
          whiteMoveCount: currentTurn === 'white' ? whiteMoveCount + 1 : whiteMoveCount,
          blackMoveCount: currentTurn === 'black' ? blackMoveCount + 1 : blackMoveCount,
          hasMoved: moveResult.newHasMoved,
          enPassantTarget: moveResult.newEnPassantTarget,
          lastMove: newLastMove,
          gameOver: gameFinished
        };
        
        socketRef.current.emit('player-move', moveData);
      }

    } else {
      // 유효하지 않은 이동 시: 다른 아군 말 선택 가능
      if (clickedPiece && clickedPiece.color === currentTurn) {
        // 온라인 게임에서는 자신의 색깔만
        if (isOnlineGame && clickedPiece.color !== playerColor) {
          setSelectedPos(null);
          setLegalMoves([]);
          return;
        }
        
        setSelectedPos({ row, col });
        
        const basicLegalMoves = getLegalMoves(clickedPiece, row, col, board, enPassantTarget, hasMoved);
        const filteredLegalMoves = basicLegalMoves.filter(move => {
          return wouldMoveResolveCheck(clickedPiece, row, col, move.row, move.col, board, currentTurn);
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

    // 온라인 게임에서 프로모션 정보도 전송
    if (isOnlineGame && socketRef.current) {
      socketRef.current.emit('promotion', { 
        roomCode, 
        row, 
        col, 
        newType, 
        board: newBoard, 
        currentTurn: nextTurn 
      });
    }
  };

  // 렌더링용 보드 생성 (플레이어 색깔에 따라 회전)
  const getRenderBoard = () => {
    if (!isOnlineGame || playerColor === 'white') {
      return board; // 흰색 기준 (기본)
    } else {
      return board.slice().reverse().map(row => row.slice().reverse()); // 검은색 기준 (회전)
    }
  };

  // 좌표 변환 (회전된 보드용)
  const transformCoordinates = (row, col) => {
    if (!isOnlineGame || playerColor === 'white') {
      return { row, col };
    } else {
      return { row: 7 - row, col: 7 - col };
    }
  };

  // 하이라이트 위치 변환
  const transformHighlights = (moves) => {
    if (!isOnlineGame || playerColor === 'white') {
      return moves;
    } else {
      return moves.map(move => ({
        row: 7 - move.row,
        col: 7 - move.col
      }));
    }
  };

  // 마지막 이동 위치 변환
  const getTransformedLastMove = () => {
    if (!lastMove) return null;
    if (!isOnlineGame || playerColor === 'white') {
      return lastMove;
    } else {
      return {
        from: { row: 7 - lastMove.from.row, col: 7 - lastMove.from.col },
        to: { row: 7 - lastMove.to.row, col: 7 - lastMove.to.col }
      };
    }
  };

  const renderBoard = getRenderBoard();
  const transformedLegalMoves = transformHighlights(legalMoves);
  const transformedSelectedPos = selectedPos && (!isOnlineGame || playerColor === 'white') ? 
    selectedPos : 
    selectedPos ? { row: 7 - selectedPos.row, col: 7 - selectedPos.col } : null;
  const transformedLastMove = getTransformedLastMove();

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
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 상단 정보 영역 */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              margin: 0,
              color: 'white',
              textShadow: '1px 1px 2px black',
              marginBottom: '10px'
            }}
          >
            클래식 체스 {isOnlineGame && `- ${playerColor === 'white' ? '흰색' : '검은색'} 플레이어`}
          </h1>

          {isOnlineGame && (
            <div style={{ color: 'white', marginBottom: '10px' }}>
              <p>상대방: {opponent}</p>
              <p>방 코드: {roomCode}</p>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '8px 16px',
              borderRadius: '12px',
              border: '2px solid #ccc',
              justifyContent: 'center'
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
              onClick={handleSurrender}
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

        {/* 단일 체스보드 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* 타이머 */}
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
            <ChessTimer 
              currentTurn={currentTurn} 
              onTimeOut={handleTimeOut} 
              gameOver={gameOver}
              color={playerColor || 'white'}
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
                    key={`${rowIdx}-${colIdx}`}
                    color={color}
                    piece={piece}
                    onClick={() => {
                      const transformed = transformCoordinates(rowIdx, colIdx);
                      handleClick(transformed.row, transformed.col);
                    }}
                    highlight={isSelected}
                    isMoveOption={isHighlighted}
                    isRotated={isOnlineGame && playerColor === 'black'}
                    isLastMove={isLastMovePos && !isSelected}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* 플레이어 관점 표시 */}
        {isOnlineGame && (
          <div style={{ 
            marginTop: '15px', 
            color: 'white', 
            fontSize: '1.1rem', 
            fontWeight: 'bold',
            textShadow: '1px 1px 2px black'
          }}>
            {playerColor === 'white' ? '🤍 흰색 플레이어 관점' : '🖤 검은색 플레이어 관점'}
          </div>
        )}

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

export default ClassicBoard;