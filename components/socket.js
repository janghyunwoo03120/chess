// socket.js - 클라이언트 소켓 연결 (수정된 버전)
import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

class ChessSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.roomCode = null;
    this.playerName = null;
    this.playerColor = null;
    this.callbacks = {};
    this.eventListenersSetup = false;
  }

  // 서버 연결
  connect() {
    if (this.isConnecting || this.isConnected) {
      console.log('이미 연결 중이거나 연결되어 있습니다');
      return Promise.resolve(this.socket);
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true;
      
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      }

      this.socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        forceNew: true
      });

      // 연결 성공 시
      this.socket.once('connect', () => {
        console.log('서버에 연결되었습니다:', this.socket.id);
        this.isConnected = true;
        this.isConnecting = false;
        this.setupEventListeners();
        this.emit('connected', { socketId: this.socket.id });
        resolve(this.socket);
      });

      // 연결 실패 시
      this.socket.once('connect_error', (error) => {
        console.error('서버 연결 실패:', error);
        this.isConnected = false;
        this.isConnecting = false;
        this.emit('connection-error', { error: error.message });
        reject(error);
      });

      // 타임아웃 처리
      setTimeout(() => {
        if (this.isConnecting) {
          this.isConnecting = false;
          reject(new Error('연결 시간 초과'));
        }
      }, 10000);
    });
  }

  // 연결 해제
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.roomCode = null;
    this.playerName = null;
    this.playerColor = null;
    this.eventListenersSetup = false;
  }

  // 이벤트 리스너 설정 (한 번만 실행)
  setupEventListeners() {
    if (this.eventListenersSetup || !this.socket) {
      return;
    }

    this.eventListenersSetup = true;

    // 연결 해제
    this.socket.on('disconnect', (reason) => {
      console.log('서버 연결이 해제되었습니다:', reason);
      this.isConnected = false;
      this.isConnecting = false;
      this.eventListenersSetup = false;
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
    this.socket.on('join-error', (data) => {
      console.error('방 참가 실패:', data);
      this.emit('join-error', data);
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

    // 재연결 시도
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('재연결 성공:', attemptNumber);
      this.isConnected = true;
      this.emit('reconnected', { attemptNumber });
    });

    // 재연결 실패
    this.socket.on('reconnect_failed', () => {
      console.log('재연결 실패');
      this.isConnected = false;
      this.emit('reconnect-failed');
    });
  }

  // 연결 상태 확인 및 자동 재연결
  async ensureConnected() {
    if (this.isConnected && this.socket && this.socket.connected) {
      return true;
    }

    if (this.isConnecting) {
      // 연결 중이면 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.isConnected;
    }

    try {
      await this.connect();
      return true;
    } catch (error) {
      console.error('연결 실패:', error);
      return false;
    }
  }

  // 방 생성
  async createRoom(playerName) {
    if (!(await this.ensureConnected())) {
      this.emit('connection-error', { error: '서버에 연결할 수 없습니다' });
      return false;
    }
    
    this.socket.emit('create-room', playerName);
    return true;
  }

  // 방 참가
  async joinRoom(roomCode, playerName) {
    if (!(await this.ensureConnected())) {
      this.emit('connection-error', { error: '서버에 연결할 수 없습니다' });
      return false;
    }
    
    console.log('방 참가 요청:', { roomCode, playerName });
    this.socket.emit('join-room', { roomCode, playerName });
    return true;
  }

  // 말 이동
  async makeMove(move, newBoard, currentTurn, gameStatus) {
    if (!(await this.ensureConnected()) || !this.roomCode) {
      console.error('방에 참가하지 않았거나 연결되지 않았습니다');
      return false;
    }
    
    this.socket.emit('make-move', {
      roomCode: this.roomCode,
      move,
      newBoard,
      currentTurn,
      gameStatus
    });
    return true;
  }

  // 게임 상태 동기화
  async syncGameState(gameState) {
    if (!(await this.ensureConnected()) || !this.roomCode) {
      return false;
    }
    
    this.socket.emit('sync-game-state', {
      roomCode: this.roomCode,
      gameState
    });
    return true;
  }

  // 채팅 메시지 전송
  async sendChatMessage(message) {
    if (!(await this.ensureConnected()) || !this.roomCode) {
      console.error('방에 참가하지 않았거나 연결되지 않았습니다');
      return false;
    }
    
    this.socket.emit('chat-message', {
      roomCode: this.roomCode,
      message,
      playerName: this.playerName
    });
    return true;
  }

  // 게임 포기
  async surrender() {
    if (!(await this.ensureConnected()) || !this.roomCode) {
      console.error('방에 참가하지 않았거나 연결되지 않았습니다');
      return false;
    }
    
    this.socket.emit('surrender', {
      roomCode: this.roomCode,
      playerName: this.playerName
    });
    return true;
  }

  // 방 나가기
  leaveRoom() {
    if (this.roomCode && this.socket && this.isConnected) {
      this.socket.emit('leave-room', { roomCode: this.roomCode });
    }
    this.roomCode = null;
    this.playerName = null;
    this.playerColor = null;
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

  // 모든 콜백 제거
  removeAllListeners() {
    this.callbacks = {};
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
      isConnecting: this.isConnecting,
      roomCode: this.roomCode,
      playerName: this.playerName,
      playerColor: this.playerColor,
      socketId: this.socket?.id || null,
      socketConnected: this.socket?.connected || false
    };
  }
}

// 싱글톤 인스턴스 생성
const socketClient = new ChessSocketClient();

export default socketClient;