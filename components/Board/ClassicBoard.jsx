// components/Board/ClassicBoard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Tile from '../Tile/Tile';
import './Board.css';
import { isKingInCheck, isCheckmate, isStalemate, isKingAlive } from '../game.logic';
import ChessTimer from '../ChessTimer';
import PalaceBackground from '../PalaceBackground';
import { initialBoard } from './boardUtils';
import { handleMove, isValidMove, getLegalMoves } from './moveLogic';
import PromotionModal from './PromotionModal';
import { playMoveSound, playCheckSound, playCheckmateSound, playStalemateSound, playGameOverSound } from './sound';
import socketManager from '../SocketManager';
import {
  validateOnlineMove,
  updateGameState,
  createMoveData,
  applyOpponentMove,
  createSyncData,
  transformCoordinatesForPlayer,
  transformHighlightsForPlayer,
  transformLastMoveForPlayer,
  getInitialOnlineGameState,
  getConnectionStatusMessage
} from '../OnlineGameLogic';

const ClassicBoard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL 파라미터에서 온라인 게임 정보 가져오기
  const searchParams = new URLSearchParams(location.search);
  const isOnlineGame = searchParams.get('mode') === 'online';
  const roomCode = searchParams.get('roomCode');
  const playerName = searchParams.get('playerName');
  const playerColor = searchParams.get('playerColor');
  const opponent = searchParams.get('opponent');

  // 기본 게임 상태
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

  // 온라인 게임 상태
  const [onlineState, setOnlineState] = useState(getInitialOnlineGameState());

  // 체크 해소 여부를 검증하는 함수
  const wouldMoveResolveCheck = (selectedPiece, fromRow, fromCol, toRow, toCol, currentBoard, turn) => {
    const tempBoard = currentBoard.map(row => [...row]);
    
    const capturedPiece = tempBoard[toRow][toCol];
    tempBoard[toRow][toCol] = selectedPiece;
    tempBoard[fromRow][fromCol] = null;
    
    if (selectedPiece.type === 'pawn' && Math.abs(fromCol - toCol) === 1 && !capturedPiece) {
      const capturedPawnRow = turn === 'white' ? toRow + 1 : toRow - 1;
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
    
    return !isKingInCheck(tempBoard, turn);
  };

  // 온라인 게임 초기화
  useEffect(() => {
    if (isOnlineGame && roomCode && playerName) {
      initializeOnlineGame();
    } else if (!isOnlineGame) {
      // 오프라인 게임 초기화
      setGameStarted(true);
      setMessage('백 턴');
    }

    return () => {
      if (isOnlineGame) {
        socketManager.leaveRoom();
      }
    };
  }, [isOnlineGame, roomCode, playerName]);

  const initializeOnlineGame = async () => {
    try {
      setOnlineState(prev => ({ 
        ...prev, 
        connectionStatus: 'connecting',
        roomCode,
        playerName,
        playerColor
      }));

      await socketManager.connect();
      
      setOnlineState(prev => ({ 
        ...prev, 
        isConnected: true,
        connectionStatus: 'connected'
      }));

      // 소켓 이벤트 리스너 설정
      setupSocketListeners();

      // 방에 재입장 (이미 방이 생성된 상태)
      if (playerColor === 'white') {
        // 방장인 경우 - 이미 방이 생성되어 있음
        setOnlineState(prev => ({ 
          ...prev, 
          isInRoom: true,
          waitingForOpponent: true
        }));
      } else {
        // 참가자인 경우 - 방에 입장 시도
        await socketManager.joinRoom(roomCode, playerName);
        setOnlineState(prev => ({ 
          ...prev, 
          isInRoom: true,
          opponent,
          waitingForOpponent: false
        }));
      }

    } catch (error) {
      console.error('온라인 게임 초기화 실패:', error);
      alert('온라인 게임 연결에 실패했습니다: ' + error.message);
      navigate('/');
    }
  };

  const setupSocketListeners = () => {
    socketManager.setupGameListeners({
      onGameStart: (data) => {
        console.log('게임 시작:', data);
        setGameStarted(true);
        setOnlineState(prev => ({
          ...prev,
          gameStarted: true,
          waitingForOpponent: false,
          opponent: data.players ? 
            (playerColor === 'white' ? data.players.black : data.players.white) : 
            prev.opponent
        }));
        setMessage('백 턴');
      },

      onOpponentMove: (moveData) => {
        console.log('상대방 이동 수신:', moveData);
        const newGameState = applyOpponentMove({
          board,
          currentTurn,
          message,
          gameOver,
          hasMoved,
          enPassantTarget,
          lastMove,
          whiteMoveCount,
          blackMoveCount
        }, moveData);

        // 상태 업데이트
        setBoard(newGameState.board);
        setCurrentTurn(newGameState.currentTurn);
        setMessage(newGameState.message);
        setGameOver(newGameState.gameOver);
        setHasMoved(newGameState.hasMoved);
        setEnPassantTarget(newGameState.enPassantTarget);
        setLastMove(newGameState.lastMove);
        setWhiteMoveCount(newGameState.whiteMoveCount);
        setBlackMoveCount(newGameState.blackMoveCount);
        setSelectedPos(null);
        setLegalMoves([]);

        // 게임 종료 처리
        if (newGameState.gameOver) {
          setTimeout(() => {
            navigate('/gameover', { 
              state: { 
                winner: newGameState.winner,
                gameType: 'online'
              } 
            });
          }, 1500);
        }
      },

      onGameSync: (gameData) => {
        console.log('게임 상태 동기화:', gameData);
        setBoard(gameData.board || board);
        setCurrentTurn(gameData.currentTurn || currentTurn);
        setMessage(gameData.message || message);
        setGameOver(gameData.gameOver || false);
        setHasMoved(gameData.hasMoved || hasMoved);
        setEnPassantTarget(gameData.enPassantTarget || null);
        setLastMove(gameData.lastMove || null);
        setWhiteMoveCount(gameData.whiteMoveCount || 0);
        setBlackMoveCount(gameData.blackMoveCount || 0);
        setGameStarted(gameData.gameStarted || false);
      },

      onOpponentJoined: (data) => {
        console.log('상대방 입장:', data);
        setOnlineState(prev => ({
          ...prev,
          opponent: data.opponentName,
          waitingForOpponent: false
        }));
        setMessage('게임이 곧 시작됩니다...');
      },

      onOpponentDisconnected: () => {
        alert('상대방이 연결을 해제했습니다.');
        navigate('/');
      },

      onOpponentSurrendered: (data) => {
        setGameOver(true);
        setMessage(`${data.playerName} 항복`);
        playGameOverSound();
        setTimeout(() => {
          const winner = playerColor === 'white' ? '백' : '흑';
          navigate('/gameover', { 
            state: { 
              winner,
              gameType: 'online'
            } 
          });
        }, 1000);
      },

      onGameEnd: (data) => {
        setGameOver(true);
        if (data.reason === 'timeout') {
          const winner = data.winner === 'white' ? '백' : '흑';
          setMessage(`시간 초과! ${winner} 승리`);
          playGameOverSound();
          setTimeout(() => {
            navigate('/gameover', { 
              state: { 
                winner,
                gameType: 'online'
              } 
            });
          }, 1000);
        }
      }
    });
  };

  // 항복 처리
  const handleSurrender = () => {
    if (gameOver || !gameStarted) return;
    
    if (isOnlineGame) {
      socketManager.surrender();
    } else {
      const winner = currentTurn === 'white' ? '흑' : '백';
      setGameOver(true);
      setMessage(`${winner} 승리 (항복)`);
      navigate('/gameover', { state: { winner, gameType: 'classic' } });
    }
  };

  // 시간 초과 처리
  const handleTimeOut = (color) => {
    if (gameOver) return;
    
    if (isOnlineGame) {
      socketManager.timeOut(color);
    } else {
      playGameOverSound();
      setGameOver(true);
      const winner = color === 'white' ? '흑' : '백';
      setMessage(`시간 초과! ${winner} 승리`);
      navigate('/gameover', { state: { winner, gameType: 'classic' } });
    }
  };

  // 클릭 처리 함수
  const handleClick = (row, col) => {
    if (gameOver || promotion || !gameStarted) return;
    
    // 온라인 게임에서 대기 중이면 클릭 무시
    if (isOnlineGame && onlineState.waitingForOpponent) {
      return;
    }

    // 좌표 변환 (온라인 게임에서 플레이어 색깔에 따라)
    let actualRow = row;
    let actualCol = col;
    
    if (isOnlineGame && playerColor === 'black') {
      actualRow = 7 - row;
      actualCol = 7 - col;
    }

    const clickedPiece = board[actualRow][actualCol];

    // 온라인 게임에서 턴과 색깔 검증
    if (isOnlineGame) {
      const validation = validateOnlineMove(board, actualRow, actualCol, actualRow, actualCol, currentTurn, playerColor);
      if (!validation.valid && selectedPos === null) {
        console.log('온라인 게임 검증 실패:', validation.error);
        return;
      }
    }

    // 선택된 칸 다시 클릭하면 선택 해제
    if (selectedPos && selectedPos.row === actualRow && selectedPos.col === actualCol) {
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

    // 이동 유효성 검사
    const basicMoveValid = isValidMove(selectedPiece, selectedPos.row, selectedPos.col, actualRow, actualCol, board, enPassantTarget, hasMoved);
    
    if (basicMoveValid) {
      // 체크 해소 검증
      const isCurrentlyInCheck = isKingInCheck(board, currentTurn);
      
      if (isCurrentlyInCheck) {
        const wouldResolveCheck = wouldMoveResolveCheck(selectedPiece, selectedPos.row, selectedPos.col, actualRow, actualCol, board, currentTurn);
        
        if (!wouldResolveCheck) {
          console.log('❌ 체크 상태를 해소하지 못하는 이동입니다!');
          setSelectedPos(null);
          setLegalMoves([]);
          return;
        }
      } else {
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

      // 마지막 이동 정보 업데이트
      const newLastMove = {
        from: { row: selectedPos.row, col: selectedPos.col },
        to: { row: actualRow, col: actualCol }
      };

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
      const newWhiteCount = currentTurn === 'white' ? whiteMoveCount + 1 : whiteMoveCount;
      const newBlackCount = currentTurn === 'black' ? blackMoveCount + 1 : blackMoveCount;

      // 게임 상태 확인
      const gameStateUpdate = updateGameState(moveResult, currentTurn, gameOver);

      // 로컬 상태 업데이트
      setBoard(moveResult.newBoard);
      setSelectedPos(null);
      setLegalMoves([]);
      setCurrentTurn(gameStateUpdate.nextTurn);
      setMessage(gameStateUpdate.message);
      setGameOver(gameStateUpdate.gameOver);
      setHasMoved(moveResult.newHasMoved);
      setEnPassantTarget(moveResult.newEnPassantTarget);
      setLastMove(newLastMove);
      setWhiteMoveCount(newWhiteCount);
      setBlackMoveCount(newBlackCount);

      // 사운드 재생
      switch (gameStateUpdate.sound) {
        case 'checkmate':
          playCheckmateSound();
          break;
        case 'stalemate':
          playStalemateSound();
          break;
        case 'check':
          playCheckSound();
          break;
        case 'gameOver':
          playGameOverSound();
          break;
        default:
          // move 사운드는 이미 재생됨
          break;
      }

      // 온라인 게임에서 상대방에게 이동 전송
      if (isOnlineGame) {
        const moveData = createMoveData({
          board: moveResult.newBoard,
          currentTurn: gameStateUpdate.nextTurn,
          message: gameStateUpdate.message,
          gameOver: gameStateUpdate.gameOver,
          winner: gameStateUpdate.winner,
          hasMoved: moveResult.newHasMoved,
          enPassantTarget: moveResult.newEnPassantTarget,
          lastMove: newLastMove
        }, {
          fromRow: selectedPos.row,
          fromCol: selectedPos.col,
          toRow: actualRow,
          toCol: actualCol,
          piece: selectedPiece
        }, {
          white: newWhiteCount,
          black: newBlackCount
        });
        
        socketManager.sendMove(moveData);
      }

      // 게임 종료 처리
      if (gameStateUpdate.gameOver) {
        setTimeout(() => {
          navigate('/gameover', { 
            state: { 
              winner: gameStateUpdate.winner,
              gameType: isOnlineGame ? 'online' : 'classic'
            } 
          });
        }, 1500);
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

    // 온라인 게임에서 프로모션 정보도 전송 (필요시 구현)
  };

  // 렌더링용 보드 생성 (플레이어 색깔에 따라 회전)
  const getRenderBoard = () => {
    if (!isOnlineGame || playerColor === 'white') {
      return board; // 흰색 기준 (기본)
    } else {
      return board.slice().reverse().map(row => row.slice().reverse()); // 검은색 기준 (회전)
    }
  };

  // 하이라이트 위치 변환
  const getTransformedLegalMoves = () => {
    return transformHighlightsForPlayer(legalMoves, isOnlineGame ? playerColor : 'white');
  };

  // 선택된 위치 변환
  const getTransformedSelectedPos = () => {
    if (!selectedPos) return null;
    if (!isOnlineGame || playerColor === 'white') {
      return selectedPos;
    } else {
      return { row: 7 - selectedPos.row, col: 7 - selectedPos.col };
    }
  };

  // 마지막 이동 위치 변환
  const getTransformedLastMove = () => {
    return transformLastMoveForPlayer(lastMove, isOnlineGame ? playerColor : 'white');
  };

  const renderBoard = getRenderBoard();
  const transformedLegalMoves = getTransformedLegalMoves();
  const transformedSelectedPos = getTransformedSelectedPos();
  const transformedLastMove = getTransformedLastMove();

  // 연결 상태 메시지
  const connectionStatusText = isOnlineGame ? getConnectionStatusMessage(onlineState) : '';

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
            {isOnlineGame ? '온라인 클래식 체스' : '클래식 체스'}
          </h1>

          {isOnlineGame && (
            <div style={{ color: 'white', marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
                <div>
                  <strong>{playerColor === 'white' ? '🤍' : '🖤'} 나: {playerName}</strong>
                </div>
                <div>
                  <strong>{playerColor === 'white' ? '🖤' : '🤍'} 상대: {onlineState.opponent || '대기중'}</strong>
                </div>
              </div>
              <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>
                방 코드: <strong>{roomCode}</strong>
              </div>
            </div>
          )}

          {/* 연결/게임 상태 표시 */}
          {connectionStatusText && (
            <div style={{ 
              color: '#ffd700', 
              fontSize: '1.1rem', 
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              {connectionStatusText}
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
              disabled={gameOver || !gameStarted || (isOnlineGame && onlineState.waitingForOpponent)}
              style={{
                padding: '6px 12px',
                fontWeight: 'bold',
                borderRadius: '6px',
                border: '1px solid #aaa',
                backgroundColor: '#fff',
                cursor: (gameOver || !gameStarted || (isOnlineGame && onlineState.waitingForOpponent)) ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                opacity: (gameOver || !gameStarted || (isOnlineGame && onlineState.waitingForOpponent)) ? 0.5 : 1
              }}
            >
              항복
            </button>
          </div>
        </div>

        {/* 체스보드와 타이머 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* 타이머 */}
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
            <ChessTimer 
              currentTurn={currentTurn} 
              onTimeOut={handleTimeOut} 
              gameOver={gameOver}
              color={isOnlineGame ? playerColor : 'white'}
              gameStarted={gameStarted && (!isOnlineGame || !onlineState.waitingForOpponent)}
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
                    onClick={() => handleClick(rowIdx, colIdx)}
                    highlight={isSelected}
                    isMoveOption={isHighlighted}
                    isLastMove={isLastMovePos && !isSelected}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* 프로모션 모달 */}
        {promotion && (
          <PromotionModal
            promotion={promotion}
            onPromotionChoice={handlePromotionChoice}
          />
        )}

        {/* 하단 버튼들 */}
        {isOnlineGame && (
          <div style={{ marginTop: '18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => {
                const syncData = createSyncData({
                  board,
                  currentTurn,
                  message,
                  gameOver,
                  hasMoved,
                  enPassantTarget,
                  lastMove,
                  whiteMoveCount,
                  blackMoveCount,
                  gameStarted
                });
                socketManager.requestSync(syncData);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              동기화 요청
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassicBoard;