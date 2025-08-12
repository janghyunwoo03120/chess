// components/SocketManager.js
import io from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.roomCode = null;
    this.playerInfo = null;
  }

  // 서버에 연결
  connect() {
    if (this.socket && this.isConnected) {
      return Promise.resolve(this.socket);
    }

    return new Promise((resolve, reject) => {
      this.socket = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('✅ 서버 연결 성공:', this.socket.id);
        this.isConnected = true;
        resolve(this.socket);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ 서버 연결 실패:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 서버 연결 해제:', reason);
        this.isConnected = false;
      });

      // 연결 타임아웃 (10초)
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('연결 시간 초과'));
        }
      }, 10000);
    });
  }

  // 방 생성
  createRoom(playerName, gameMode = 'classic') {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('서버에 연결되지 않았습니다'));
        return;
      }

      this.socket.emit('create-room', {
        playerName,
        gameMode
      });

      this.socket.once('room-created', (data) => {
        this.roomCode = data.roomCode;
        this.playerInfo = {
          name: playerName,
          color: 'white', // 방장은 항상 백색
          isHost: true
        };
        resolve(data);
      });

      // 타임아웃 설정
      setTimeout(() => {
        reject(new Error('방 생성 시간 초과'));
      }, 5000);
    });
  }

  // 방 참가
  joinRoom(roomCode, playerName) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('서버에 연결되지 않았습니다'));
        return;
      }

      this.socket.emit('join-room', {
        roomCode,
        playerName
      });

      this.socket.once('room-joined', (data) => {
        this.roomCode = roomCode;
        this.playerInfo = {
          name: playerName,
          color: 'black', // 참가자는 항상 흑색
          isHost: false
        };
        resolve(data);
      });

      this.socket.once('join-error', (error) => {
        reject(new Error(error));
      });

      // 타임아웃 설정
      setTimeout(() => {
        reject(new Error('방 참가 시간 초과'));
      }, 5000);
    });
  }

  // 게임 이벤트 리스너 등록
  setupGameListeners(callbacks) {
    if (!this.socket) return;

    const {
      onGameStart,
      onOpponentMove,
      onGameSync,
      onOpponentJoined,
      onOpponentDisconnected,
      onOpponentSurrendered,
      onTimeOut,
      onGameEnd
    } = callbacks;

    // 게임 시작
    this.socket.on('game-start', onGameStart);

    // 상대방 이동
    this.socket.on('opponent-move', onOpponentMove);

    // 게임 상태 동기화
    this.socket.on('game-state-synced', onGameSync);

    // 상대방 입장/퇴장
    this.socket.on('opponent-joined', onOpponentJoined);
    this.socket.on('opponent-disconnected', onOpponentDisconnected);

    // 항복
    this.socket.on('opponent-surrendered', onOpponentSurrendered);

    // 시간 초과
    this.socket.on('game-ended', onGameEnd);

    // 타이머 동기화
    this.socket.on('timer-synced', (data) => {
      console.log('타이머 동기화:', data);
    });
  }

  // 말 이동 전송
  sendMove(moveData) {
    if (!this.socket || !this.roomCode) {
      console.error('소켓이나 방 코드가 없습니다');
      return;
    }

    this.socket.emit('make-move', {
      roomCode: this.roomCode,
      ...moveData
    });
  }

  // 게임 상태 동기화 요청
  requestSync(gameState) {
    if (!this.socket || !this.roomCode) return;

    this.socket.emit('sync-game-state', {
      roomCode: this.roomCode,
      gameState
    });
  }

  // 항복
  surrender() {
    if (!this.socket || !this.roomCode) return;

    this.socket.emit('surrender', {
      roomCode: this.roomCode,
      playerName: this.playerInfo?.name
    });
  }

  // 타이머 업데이트
  updateTimer(timeData) {
    if (!this.socket || !this.roomCode) return;

    this.socket.emit('timer-update', {
      roomCode: this.roomCode,
      ...timeData
    });
  }

  // 시간 초과 알림
  timeOut(loser) {
    if (!this.socket || !this.roomCode) return;

    this.socket.emit('time-out', {
      roomCode: this.roomCode,
      loser
    });
  }

  // 방 나가기
  leaveRoom() {
    if (!this.socket || !this.roomCode) return;

    this.socket.emit('leave-room', {
      roomCode: this.roomCode
    });

    this.roomCode = null;
    this.playerInfo = null;
  }

  // 채팅 메시지 전송
  sendChatMessage(message) {
    if (!this.socket || !this.roomCode) return;

    this.socket.emit('chat-message', {
      roomCode: this.roomCode,
      message,
      playerName: this.playerInfo?.name
    });
  }

  // 연결 해제
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.roomCode = null;
      this.playerInfo = null;
    }
  }

  // 현재 상태 getter
  getStatus() {
    return {
      isConnected: this.isConnected,
      roomCode: this.roomCode,
      playerInfo: this.playerInfo,
      socketId: this.socket?.id
    };
  }
}

// 싱글톤 인스턴스 생성
const socketManager = new SocketManager();

export default socketManager;