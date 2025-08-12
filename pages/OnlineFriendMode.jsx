import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import './OnlineFriendMode.css';

const OnlineFriendMode = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // useRef로 소켓 관리하여 재렌더링 방지
  const socketRef = useRef(null);
  
  // URL 경로에서 모드 추출
  const pathSegments = location.pathname.split('/');
  const pathMode = pathSegments[pathSegments.length - 1];
  const mode = pathMode === 'chess' ? 'normal' : pathMode;
  
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [gameState, setGameState] = useState('menu'); // menu, waiting, playing
  const [playerColor, setPlayerColor] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  // 모드별 설정
  const modeConfig = {
    normal: {
      title: '일반 온라인 친구모드',
      description: '일반 체스 규칙으로 친구와 대전',
      color: 'bg-blue-600'
    },
    'online-friend': {
      title: '온라인 친구모드',
      description: '친구와 온라인으로 체스 대전',
      color: 'bg-blue-600'
    },
    'random-online': {
      title: '랜덤 온라인 모드', 
      description: '랜덤 룰로 온라인 대전',
      color: 'bg-purple-600'
    },
    'special-random': {
      title: '특수 랜덤 온라인모드',
      description: '예측 불가능한 특수 룰로 대전',
      color: 'bg-red-600'
    },
    'balance-online': {
      title: '밸런스 온라인 모드',
      description: '균형잡힌 룰로 온라인 대전',
      color: 'bg-green-600'
    },
    'pro-balance': {
      title: '프로 밸런스 온라인모드',
      description: '전문가를 위한 균형 게임',
      color: 'bg-indigo-600'
    },
    blitz: {
      title: '블리츠 온라인모드',
      description: '빠른 시간제한 체스',
      color: 'bg-orange-600'
    },
    bullet: {
      title: '불릿 온라인모드',
      description: '초고속 1분 체스 대결',
      color: 'bg-yellow-600'
    },
    classic: {
      title: '클래식 온라인모드',
      description: '충분한 시간으로 깊이 있는 게임',
      color: 'bg-gray-600'
    },
    'random-match': {
      title: '랜덤 매치',
      description: '무작위 상대와 매칭',
      color: 'bg-pink-600'
    }
  };

  const currentMode = modeConfig[mode] || modeConfig.normal;

  // 소켓 초기화 함수
  const initializeSocket = () => {
    if (socketRef.current?.connected) {
      console.log('이미 연결된 소켓이 있습니다.');
      return;
    }

    try {
      console.log('서버 연결 시도...');
      setConnectionStatus('connecting');
      
      const newSocket = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      socketRef.current = newSocket;

      // 연결 상태 이벤트
      newSocket.on('connect', () => {
        console.log('서버에 연결됨:', newSocket.id);
        setConnectionStatus('connected');
        setError('');
      });

      newSocket.on('connect_error', (error) => {
        console.error('서버 연결 실패:', error);
        setConnectionStatus('error');
        setError('서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('서버 연결 해제:', reason);
        setConnectionStatus('disconnected');
        if (reason === 'io server disconnect') {
          // 서버에서 강제로 끊은 경우 재연결 시도
          newSocket.connect();
        }
      });

      // 방 생성 완료
      newSocket.on('room-created', (data) => {
        console.log('방 생성됨:', data);
        setCurrentRoom(data.roomCode);
        setPlayerColor(data.color);
        setGameState('waiting');
        setIsJoining(false);
        setError('');
      });

      // 방 참가 완료
      newSocket.on('room-joined', (data) => {
        console.log('방 참가됨:', data);
        setCurrentRoom(data.roomCode);
        setPlayerColor(data.color);
        setOpponent(data.opponent);
        setGameState('waiting');
        setIsJoining(false);
        setError('');
      });

      // 상대방 참가
      newSocket.on('opponent-joined', (data) => {
        console.log('상대방 참가:', data);
        setOpponent(data.opponentName);
      });

      // 게임 시작
      newSocket.on('game-start', (data) => {
        console.log('게임 시작:', data);
        setGameState('playing');
        // 체스 게임으로 이동
        navigate('/chess/game', { 
          state: { 
            mode: 'online',
            gameMode: mode,
            roomCode: currentRoom,
            playerColor: playerColor,
            opponent: opponent,
            socketId: newSocket?.id
          }
        });
      });

      // 에러 처리
      newSocket.on('room-error', (message) => {
        console.error('방 오류:', message);
        setError(message);
        setIsJoining(false);
      });

      newSocket.on('join-error', (message) => {
        console.error('참가 오류:', message);
        setError(`방 참가 실패: ${message}`);
        setIsJoining(false);
      });

      // 상대방 연결 해제
      newSocket.on('opponent-disconnected', () => {
        alert('상대방이 연결을 해제했습니다.');
        resetGameState();
      });

    } catch (error) {
      console.error('소켓 초기화 오류:', error);
      setConnectionStatus('error');
      setError('소켓 초기화에 실패했습니다.');
    }
  };

  // 게임 상태 초기화
  const resetGameState = () => {
    setGameState('menu');
    setCurrentRoom(null);
    setOpponent(null);
    setPlayerColor(null);
    setIsJoining(false);
    setError('');
  };

  // 소켓 정리
  const cleanupSocket = () => {
    if (socketRef.current) {
      console.log('소켓 정리');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  useEffect(() => {
    initializeSocket();

    return () => {
      cleanupSocket();
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanupSocket();
    };
  }, []);

  const createRoom = () => {
    if (!validateInput()) return;
    
    if (!socketRef.current?.connected) {
      setError('서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsJoining(true);
    setError('');
    
    console.log('방 생성 요청:', { playerName, gameMode: mode });
    socketRef.current.emit('create-room', {
      playerName: playerName.trim(),
      gameMode: mode
    });

    // 타임아웃 처리
    setTimeout(() => {
      if (gameState === 'menu' && isJoining) {
        setIsJoining(false);
        setError('방 생성 요청이 시간 초과되었습니다. 다시 시도해주세요.');
      }
    }, 10000);
  };

  const joinRoom = () => {
    if (!validateInput(true)) return;
    
    if (!socketRef.current?.connected) {
      setError('서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsJoining(true);
    setError('');
    
    const cleanRoomCode = roomCode.trim().toUpperCase();
    console.log('방 참가 요청:', { roomCode: cleanRoomCode, playerName });
    
    socketRef.current.emit('join-room', { 
      roomCode: cleanRoomCode, 
      playerName: playerName.trim() 
    });

    // 타임아웃 처리
    setTimeout(() => {
      if (gameState === 'menu' && isJoining) {
        setIsJoining(false);
        setError('방 참가 요청이 시간 초과되었습니다. 다시 시도해주세요.');
      }
    }, 10000);
  };

  const validateInput = (includeRoomCode = false) => {
    if (!playerName.trim()) {
      setError('플레이어 이름을 입력해주세요!');
      return false;
    }
    
    if (playerName.trim().length < 2) {
      setError('플레이어 이름은 2글자 이상이어야 합니다!');
      return false;
    }

    if (includeRoomCode) {
      if (!roomCode.trim()) {
        setError('방 코드를 입력해주세요!');
        return false;
      }
      
      if (roomCode.trim().length !== 6) {
        setError('방 코드는 6자리여야 합니다!');
        return false;
      }
    }

    return true;
  };

  const backToMain = () => {
    cleanupSocket();
    navigate('/');
  };

  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomCode: currentRoom });
    }
    resetGameState();
  };

  const retryConnection = () => {
    cleanupSocket();
    setTimeout(() => {
      initializeSocket();
    }, 1000);
  };

  const copyRoomCode = async () => {
    if (currentRoom) {
      try {
        await navigator.clipboard.writeText(currentRoom);
        alert('방 코드가 클립보드에 복사되었습니다!');
      } catch (error) {
        console.error('클립보드 복사 실패:', error);
        // 대체 방법
        const textArea = document.createElement('textarea');
        textArea.value = currentRoom;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('방 코드가 복사되었습니다!');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 online-friend-mode">
      
      {gameState === 'menu' && (
        <>
          {/* 상단 타이틀 */}
          <div className="text-center mb-12">
            <h1 className={`inline-block px-8 py-4 ${currentMode.color} text-white rounded-xl mb-4`}>
              {currentMode.title}
            </h1>
            
            {/* 연결 상태 */}
            <div className="flex items-center justify-center gap-4 text-white mb-4">
              <span>상태:</span>
              {connectionStatus === 'connected' && <span className="text-green-400">🟢 연결됨</span>}
              {connectionStatus === 'connecting' && <span className="text-yellow-400">🟡 연결 중...</span>}
              {connectionStatus === 'error' && (
                <div className="flex items-center gap-2">
                  <span className="text-red-400">🔴 연결 실패</span>
                  <button
                    onClick={retryConnection}
                    className="px-4 py-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30"
                  >
                    재시도
                  </button>
                </div>
              )}
              {connectionStatus === 'disconnected' && <span className="text-gray-400">⚫ 연결 안됨</span>}
            </div>
          </div>

          {/* 중앙 입력 영역 */}
          <div className="max-w-2xl mx-auto mb-16">
            {/* 에러 메시지 */}
            {error && (
              <div className="mb-8 p-6 bg-red-100 border-2 border-red-400 text-red-700 rounded-xl text-center">
                {error}
              </div>
            )}

            {/* 플레이어 이름 입력 */}
            <div className="mb-12">
              <label className="block text-center text-white mb-6">
                플레이어 이름
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-8 py-6 text-center border-4 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 placeholder-gray-400"
                placeholder="이름을 입력하세요"
                maxLength={12}
                disabled={isJoining}
              />
            </div>

            <div className="text-center text-white mb-12">또는</div>

            {/* 방 코드 입력 */}
            <div className="mb-12">
              <label className="block text-center text-white mb-6">
                방 코드 입력
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                  if (error) setError('');
                }}
                className="w-full px-8 py-6 text-center border-4 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 font-mono tracking-wider placeholder-gray-400"
                placeholder="방 코드 입력 (6자리)"
                maxLength={6}
                disabled={isJoining}
              />
            </div>
          </div>

          {/* 하단 버튼 영역 */}
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <button
                onClick={createRoom}
                disabled={connectionStatus !== 'connected' || isJoining}
                className={`${currentMode.color} text-white py-6 px-8 rounded-xl hover:opacity-90 transition-opacity font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
              >
                {isJoining ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent"></div>
                    방 생성 중...
                  </>
                ) : (
                  '방 만들기'
                )}
              </button>

              <button
                onClick={joinRoom}
                disabled={connectionStatus !== 'connected' || isJoining}
                className="bg-gray-600 text-white py-6 px-8 rounded-xl hover:bg-gray-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isJoining ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent"></div>
                    참가 중...
                  </>
                ) : (
                  '방 참가하기'
                )}
              </button>
            </div>

            <button
              onClick={backToMain}
              className="w-full bg-gray-400 text-gray-800 py-4 px-8 rounded-xl hover:bg-gray-500 transition-colors font-bold"
            >
              메인으로 돌아가기
            </button>
          </div>
        </>
      )}

      {gameState === 'waiting' && (
        <div className="max-w-3xl mx-auto text-center">
          {/* 방 생성됨 헤더 */}
          <div className={`${currentMode.color} text-white p-8 rounded-xl mb-12`}>
            <h2 className="mb-6">방 생성됨!</h2>
            <div className="flex items-center justify-center gap-4 mb-6">
              <p className="font-mono tracking-wider border-4 border-white border-opacity-30 px-8 py-4 rounded-xl">
                {currentRoom}
              </p>
              <button
                onClick={copyRoomCode}
                className="px-6 py-4 bg-white bg-opacity-20 rounded-xl hover:bg-opacity-30 transition-all"
                title="방 코드 복사"
              >
                📋
              </button>
            </div>
            <p className="opacity-90">이 코드를 친구에게 공유하세요</p>
          </div>

          {/* 게임 정보 */}
          <div className="bg-white rounded-xl p-8 mb-12">
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <span className="block text-gray-600 mb-2">플레이어</span>
                <span className="font-bold">{playerName}</span>
              </div>
              <div>
                <span className="block text-gray-600 mb-2">당신의 색깔</span>
                <span className="font-bold">
                  {playerColor === 'white' ? '⚪ 백색' : '⚫ 흑색'}
                </span>
              </div>
            </div>
            
            <div className="mb-8">
              <span className="block text-gray-600 mb-2">게임 모드</span>
              <span className="font-bold">{currentMode.description}</span>
            </div>
            
            {opponent && (
              <div className="border-t-2 border-gray-200 pt-8">
                <span className="block text-gray-600 mb-2">상대방</span>
                <span className="font-bold text-green-600">{opponent}</span>
              </div>
            )}
          </div>

          {/* 대기 상태 */}
          {!opponent ? (
            <div className="flex items-center justify-center space-x-4 text-white mb-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
              <span>상대방을 기다리는 중...</span>
            </div>
          ) : (
            <div className="text-green-400 font-bold mb-12">
              상대방이 참가했습니다! 곧 게임이 시작됩니다...
            </div>
          )}

          {/* 방 나가기 버튼 */}
          <button
            onClick={leaveRoom}
            className="bg-red-500 text-white py-4 px-12 rounded-xl hover:bg-red-600 transition-colors font-bold"
          >
            방 나가기
          </button>
        </div>
      )}
      
    </div>
  );
};

export default OnlineFriendMode;