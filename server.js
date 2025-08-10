// server.js
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

// 소켓 연결 처리
io.on('connection', (socket) => {
  console.log(`플레이어 연결됨: ${socket.id}`);

  // 게임방 생성
  socket.on('create-room', (playerName) => {
    const roomCode = roomManager.createRoom(socket.id, playerName);
    socket.join(roomCode);
    
    socket.emit('room-created', {
      roomCode,
      playerName,
      color: 'white' // 방장은 항상 백색
    });
    
    console.log(`방 생성됨: ${roomCode}, 플레이어: ${playerName}`);
  });

  // 게임방 참가
  socket.on('join-room', (data) => {
    const { roomCode, playerName } = data;
    const room = roomManager.joinRoom(roomCode, socket.id, playerName);
    
    if (room) {
      socket.join(roomCode);
      
      // 참가자에게 정보 전송
      socket.emit('room-joined', {
        roomCode,
        playerName,
        color: 'black', // 참가자는 항상 흑색
        opponent: room.players.white.name
      });
      
      // 방장에게 상대방 참가 알림
      socket.to(roomCode).emit('opponent-joined', {
        opponentName: playerName
      });
      
      // 게임 시작
      io.to(roomCode).emit('game-start', {
        currentTurn: 'white',
        players: {
          white: room.players.white.name,
          black: room.players.black.name
        }
      });
      
      console.log(`${playerName}이 방 ${roomCode}에 참가함`);
    } else {
      socket.emit('join-error', '방을 찾을 수 없거나 이미 가득 참');
    }
  });

  // 체스 말 이동
  socket.on('make-move', (data) => {
    const { roomCode, move, newBoard, currentTurn, gameStatus } = data;
    const room = roomManager.getRoom(roomCode);
    
    if (room && room.isPlayerInRoom(socket.id)) {
      // 상대방에게 이동 정보 전송
      socket.to(roomCode).emit('opponent-move', {
        move,
        newBoard,
        currentTurn,
        gameStatus
      });
      
      console.log(`방 ${roomCode}에서 말 이동:`, move);
    }
  });

  // 게임 상태 동기화
  socket.on('sync-game-state', (data) => {
    const { roomCode, gameState } = data;
    socket.to(roomCode).emit('game-state-synced', gameState);
  });

  // 채팅 메시지
  socket.on('chat-message', (data) => {
    const { roomCode, message, playerName } = data;
    socket.to(roomCode).emit('chat-message', {
      message,
      playerName,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  // 게임 포기
  socket.on('surrender', (data) => {
    const { roomCode, playerName } = data;
    socket.to(roomCode).emit('opponent-surrendered', { playerName });
  });

  // 연결 해제 처리
  socket.on('disconnect', () => {
    console.log(`플레이어 연결 해제됨: ${socket.id}`);
    
    const roomCode = roomManager.getPlayerRoom(socket.id);
    if (roomCode) {
      // 상대방에게 연결 해제 알림
      socket.to(roomCode).emit('opponent-disconnected');
      
      // 방에서 플레이어 제거
      roomManager.removePlayerFromRoom(socket.id);
      
      console.log(`플레이어가 방 ${roomCode}에서 나감`);
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 체스 서버가 포트 ${PORT}에서 실행 중입니다!`);
  console.log(`클라이언트 연결 URL: http://localhost:${PORT}`);
});