// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const RoomManager = require('./roomManager');

const app = express();
const server = http.createServer(app);

// CORS 설정
app.use(cors({
  origin: "http://localhost:5173", // Vite 개발 서버 포트
  credentials: true
}));

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  console.log(`🔌 플레이어 연결됨: ${socket.id}`);

  /** 방 생성 */
  socket.on('create-room', (data) => {
    let playerName, gameMode;
    if (typeof data === 'string') {
      playerName = data;
      gameMode = 'classic';
    } else {
      playerName = data.playerName || data;
      gameMode = data.gameMode || 'classic';
    }

    const roomCode = roomManager.createRoom(socket.id, playerName, gameMode);
    const room = roomManager.getRoom(roomCode);
    socket.join(roomCode);

    socket.emit('room-created', {
      roomCode,
      playerName,
      color: 'white',
      gameMode: room.gameMode,
      gameConfig: room.gameConfig
    });

    console.log(`📦 방 생성됨: ${roomCode}, 플레이어: ${playerName}, 모드: ${gameMode}`);
  });

  /** 방 참가 */
  socket.on('join-room', (data) => {
    const { roomCode, playerName } = data;
    const room = roomManager.joinRoom(roomCode, socket.id, playerName);

    if (room) {
      socket.join(roomCode);

      socket.emit('room-joined', {
        roomCode,
        playerName,
        color: 'black',
        opponent: room.players.white.name,
        gameMode: room.gameMode,
        gameConfig: room.gameConfig
      });

      socket.to(roomCode).emit('opponent-joined', { 
        opponentName: playerName 
      });

      // 게임 시작 신호를 양쪽 플레이어에게 전송
      io.to(roomCode).emit('game-start', {
        currentTurn: 'white',
        gameMode: room.gameMode,
        gameConfig: room.gameConfig,
        players: {
          white: room.players.white.name,
          black: room.players.black.name
        }
      });

      console.log(`✅ ${playerName} 방 ${roomCode} 참가`);
    } else {
      socket.emit('join-error', '방을 찾을 수 없거나 이미 가득 참');
    }
  });

  /** 말 이동 처리 */
  socket.on('make-move', (data) => {
    const { roomCode, move, newBoard, currentTurn, gameStatus, timeRemaining, gameData } = data;
    const room = roomManager.getRoom(roomCode);
    
    if (room && room.isPlayerInRoom(socket.id)) {
      // 상대방에게 이동 데이터 전송
      socket.to(roomCode).emit('opponent-move', {
        move,
        newBoard,
        currentTurn,
        gameStatus: gameStatus || {
          message: data.message || `${currentTurn === 'white' ? '백' : '흑'} 턴`,
          gameOver: data.gameOver || false,
          winner: data.winner || null
        },
        gameData: gameData || {
          hasMoved: data.hasMoved,
          enPassantTarget: data.enPassantTarget,
          lastMove: data.lastMove,
          whiteMoveCount: data.whiteMoveCount || 0,
          blackMoveCount: data.blackMoveCount || 0
        },
        timeRemaining: timeRemaining || {
          white: 600,
          black: 600
        }
      });
      
      console.log(`♟ 방 ${roomCode} 말 이동:`, move);
    }
  });

  /** 게임 상태 동기화 */
  socket.on('sync-game-state', (data) => {
    const { roomCode, gameState } = data;
    const room = roomManager.getRoom(roomCode);
    
    if (room && room.isPlayerInRoom(socket.id)) {
      socket.to(roomCode).emit('game-state-synced', gameState);
      console.log(`🔄 방 ${roomCode} 게임 상태 동기화`);
    }
  });

  /** 채팅 메시지 */
  socket.on('chat-message', (data) => {
    const { roomCode, message, playerName } = data;
    const room = roomManager.getRoom(roomCode);
    
    if (room && room.isPlayerInRoom(socket.id)) {
      socket.to(roomCode).emit('chat-message', {
        message,
        playerName,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  });

  /** 항복 처리 */
  socket.on('surrender', (data) => {
    const { roomCode, playerName } = data;
    const room = roomManager.getRoom(roomCode);
    
    if (room && room.isPlayerInRoom(socket.id)) {
      socket.to(roomCode).emit('opponent-surrendered', { 
        playerName: playerName || 'Unknown'
      });
      console.log(`🏳 방 ${roomCode} ${playerName} 항복`);
    }
  });

  /** 타이머 업데이트 */
  socket.on('timer-update', (data) => {
    const { roomCode, timeRemaining, currentPlayer } = data;
    const room = roomManager.getRoom(roomCode);
    
    if (room && room.isPlayerInRoom(socket.id)) {
      socket.to(roomCode).emit('timer-synced', { 
        timeRemaining, 
        currentPlayer 
      });
    }
  });

  /** 시간 초과 처리 */
  socket.on('time-out', (data) => {
    const { roomCode, loser } = data;
    const room = roomManager.getRoom(roomCode);
    
    if (room && room.isPlayerInRoom(socket.id)) {
      const winner = loser === 'white' ? 'black' : 'white';
      socket.to(roomCode).emit('game-ended', {
        reason: 'timeout',
        winner,
        loser
      });
      console.log(`⏰ 방 ${roomCode} ${loser} 시간 초과`);
    }
  });

  /** 방 나가기 (직접 요청) */
  socket.on('leave-room', ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (room && room.isPlayerInRoom(socket.id)) {
      socket.leave(roomCode);
      socket.to(roomCode).emit('opponent-disconnected');
      roomManager.removePlayerFromRoom(socket.id);
      console.log(`🚪 플레이어 ${socket.id} 방 ${roomCode}에서 나감`);
    }
  });

  /** 방 정보 요청 */
  socket.on('get-room-info', (roomCode) => {
    const room = roomManager.getRoom(roomCode);
    if (room) {
      socket.emit('room-info', {
        roomCode: room.roomCode,
        gameMode: room.gameMode,
        gameConfig: room.gameConfig,
        gameState: room.gameState,
        players: {
          white: room.players.white?.name || null,
          black: room.players.black?.name || null
        }
      });
    } else {
      socket.emit('room-info', null);
    }
  });

  /** 게임 재입장 (페이지 새로고침 등) */
  socket.on('rejoin-game', (data) => {
    const { roomCode, playerName } = data;
    const room = roomManager.getRoom(roomCode);
    
    if (room) {
      socket.join(roomCode);
      
      // 플레이어 정보 업데이트
      if (room.players.white && room.players.white.name === playerName) {
        room.players.white.id = socket.id;
        roomManager.playerToRoom.set(socket.id, roomCode);
      } else if (room.players.black && room.players.black.name === playerName) {
        room.players.black.id = socket.id;
        roomManager.playerToRoom.set(socket.id, roomCode);
      }
      
      // 현재 게임 상태 전송
      socket.emit('game-sync', {
        gameState: room.gameState,
        players: {
          white: room.players.white?.name || null,
          black: room.players.black?.name || null
        }
      });
      
      console.log(`🔄 ${playerName} 방 ${roomCode}에 재입장`);
    } else {
      socket.emit('rejoin-error', '방을 찾을 수 없습니다');
    }
  });

  /** 서버 통계 요청 */
  socket.on('get-stats', () => {
    socket.emit('server-stats', roomManager.getStats());
  });

  /** 연결 종료 처리 */
  socket.on('disconnect', () => {
    console.log(`❌ 연결 해제됨: ${socket.id}`);
    const roomCode = roomManager.getPlayerRoom(socket.id);
    if (roomCode) {
      socket.to(roomCode).emit('opponent-disconnected');
      
      // 플레이어 제거 전 방 정보 저장 (재연결을 위해)
      const room = roomManager.getRoom(roomCode);
      if (room && !room.isEmpty()) {
        console.log(`플레이어 ${socket.id} 일시적으로 방 ${roomCode}에서 연결 해제됨`);
        // 즉시 제거하지 않고 일정 시간 대기 후 제거하도록 할 수 있음
      }
      
      roomManager.removePlayerFromRoom(socket.id);
      console.log(`플레이어 ${socket.id} 방 ${roomCode} 제거됨`);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📊 서버 통계를 5분마다 출력합니다.`);
  
  // 5분마다 서버 통계 출력
  setInterval(() => {
    const stats = roomManager.getStats();
    console.log('📊 서버 통계:', {
      총_방_수: stats.totalRooms,
      활성_플레이어: stats.activePlayers,
      대기_방: stats.waitingRooms,
      게임_중: stats.playingRooms,
      모드별_통계: stats.modeStats
    });
  }, 300000);
});

