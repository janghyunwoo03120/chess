// socket.js - 클라이언트 소켓 연결
import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

class ChessSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.roomCode = null;
    this.playerName = null;
    this.playerColor = null;
    this.callbacks = {};
  }

  // 서버 연결
  connect() {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.setupEventListeners();
    return this.socket;
  }

  // 연결 해제
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.roomCode = null;
    this.playerName = null;
    this.playerColor = null;
  }

  // 이벤트 리스너 설정
  setupEventListeners() {
    // 연결 성공
    this.socket.on('connect', () => {
      console.log('서버에 연결되었습니다:', this.socket.id);
      this.isConnected = true;
      this.emit('connected', { socketId: this.socket.id });
    });

    // 연결 실패
    this.socket.on('connect_error', (error) => {
      console.error('서버 연결 실패:', error);
      this.isConnected = false;
      this.emit('connection-error', { error: error.message });
    });

    // 연결 해제
    this.socket.on('disconnect', (reason) => {
      console.log('서버 연결이 해제되었습니다:', reason);
      this.isConnected = false;
      this.emit('disconnected', { reason });
    });

    // 방 생성 성공
    this.socket.on('room-created', (data) => {
      console.log('방이 생성되었습니다:', data);
      this.roomCode = data.roomCode;
      this.playerName = data.playerName;
      this.playerColor = data.color;
      this.emit('room-created', data);
    });

    // 방 참가 성공
    this.socket.on('room-joined', (data) => {
      console.log('방에 참가했습니다:', data);
      this.roomCode = data.roomCode;
      this.playerName = data.playerName;
      this.playerColor = data.color;
      this.emit('room-joined', data);
    });

    // 방 참가 실패
    this.socket.on('join-error', (message) => {
      console.error('방 참가 실패:', message);
      this.emit('join-error', { message });
    });

    // 상대방 참가
    this.socket.on('opponent-joined', (data) => {
      console.log('상대방이 참가했습니다:', data);
      this.emit('opponent-joined', data);
    });

    // 게임 시작
    this.socket.on('game-start', (data) => {
      console.log('게임이 시작되었습니다:', data);
      this.emit('game-start', data);
    });

    // 상대방 이동
    this.socket.on('opponent-move', (data) => {
      console.log('상대방이 말을 움직였습니다:', data);
      this.emit('opponent-move', data);
    });

    // 게임 상태 동기화
    this.socket.on('game-state-synced', (data) => {
      this.emit('game-state-synced', data);
    });

    // 채팅 메시지
    this.socket.on('chat-message', (data) => {
      this.emit('chat-message', data);
    });

    // 상대방 포기
    this.socket.on('opponent-surrendered', (data) => {
      console.log('상대방이 포기했습니다:', data);
      this.emit('opponent-surrendered', data);
    });

    // 상대방 연결 해제
    this.socket.on('opponent-disconnected', () => {
      console.log('상대방이 연결을 해제했습니다');
      this.emit('opponent-disconnected');
    });
  }

  // 방 생성
  createRoom(playerName) {
    if (!this.isConnected) {
      console.error('서버에 연결되지 않았습니다');
      return;
    }
    this.socket.emit('create-room', playerName);
  }

  // 방 참가
  joinRoom(roomCode, playerName) {
    if (!this.isConnected) {
      console.error('서버에 연결되지 않았습니다');
      return;
    }
    this.socket.emit('join-room', { roomCode, playerName });
  }

  // 말 이동
  makeMove(move, newBoard, currentTurn, gameStatus) {
    if (!this.isConnected || !this.roomCode) {
      console.error('방에 참가하지 않았습니다');
      return;
    }
    
    this.socket.emit('make-move', {
      roomCode: this.roomCode,
      move,
      newBoard,
      currentTurn,
      gameStatus
    });
  }

  // 게임 상태 동기화
  syncGameState(gameState) {
    if (!this.isConnected || !this.roomCode) return;
    
    this.socket.emit('sync-game-state', {
      roomCode: this.roomCode,
      gameState
    });
  }

  // 채팅 메시지 전송
  sendChatMessage(message) {
    if (!this.isConnected || !this.roomCode) {
      console.error('방에 참가하지 않았습니다');
      return;
    }
    
    this.socket.emit('chat-message', {
      roomCode: this.roomCode,
      message,
      playerName: this.playerName
    });
  }

  // 게임 포기
  surrender() {
    if (!this.isConnected || !this.roomCode) {
      console.error('방에 참가하지 않았습니다');
      return;
    }
    
    this.socket.emit('surrender', {
      roomCode: this.roomCode,
      playerName: this.playerName
    });
  }

  // 이벤트 콜백 등록
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  // 이벤트 콜백 제거
  off(event, callback) {
    if (!this.callbacks[event]) return;
    
    if (callback) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    } else {
      this.callbacks[event] = [];
    }
  }

  // 이벤트 발생
  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`이벤트 콜백 오류 (${event}):`, error);
        }
      });
    }
  }

  // 현재 상태 정보
  getStatus() {
    return {
      isConnected: this.isConnected,
      roomCode: this.roomCode,
      playerName: this.playerName,
      playerColor: this.playerColor,
      socketId: this.socket?.id || null
    };
  }
}

// 싱글톤 인스턴스 생성
const socketClient = new ChessSocketClient();

export default socketClient;