// roomManager.js
class Room {
  constructor(roomCode, hostId, hostName, gameMode = 'normal') {
    this.roomCode = roomCode;
    this.gameMode = gameMode; // 게임 모드 추가
    this.players = {
      white: { id: hostId, name: hostName }, // 방장은 백색
      black: null // 참가자는 흑색
    };
    this.gameState = 'waiting'; // waiting, playing, finished
    this.createdAt = new Date();
    this.gameConfig = this.getGameConfig(gameMode); // 모드별 설정
  }

  // 모드별 게임 설정 반환
  getGameConfig(mode) {
    const configs = {
      normal: {
        timeLimit: null,
        specialRules: [],
        description: '일반 체스 규칙'
      },
      random: {
        timeLimit: null,
        specialRules: ['randomStart'],
        description: '랜덤 시작 위치'
      },
      'special-random': {
        timeLimit: null,
        specialRules: ['randomStart', 'specialPieces'],
        description: '특수 말과 랜덤 시작'
      },
      balance: {
        timeLimit: null,
        specialRules: ['balanced'],
        description: '균형잡힌 게임'
      },
      'pro-balance': {
        timeLimit: null,
        specialRules: ['balanced', 'advanced'],
        description: '고급 균형 모드'
      },
      blitz: {
        timeLimit: 300, // 5분
        specialRules: [],
        description: '5분 블리츠'
      },
      bullet: {
        timeLimit: 60, // 1분
        specialRules: [],
        description: '1분 불릿'
      },
      classic: {
        timeLimit: 1800, // 30분
        specialRules: [],
        description: '30분 클래식'
      }
    };
    return configs[mode] || configs.normal;
  }

  // 참가자 추가
  addPlayer(playerId, playerName) {
    if (this.players.black === null) {
      this.players.black = { id: playerId, name: playerName };
      this.gameState = 'playing';
      return true;
    }
    return false; // 방이 가득 참
  }

  // 플레이어가 이 방에 있는지 확인
  isPlayerInRoom(playerId) {
    return (
      (this.players.white && this.players.white.id === playerId) ||
      (this.players.black && this.players.black.id === playerId)
    );
  }

  // 플레이어 제거
  removePlayer(playerId) {
    if (this.players.white && this.players.white.id === playerId) {
      this.players.white = null;
    }
    if (this.players.black && this.players.black.id === playerId) {
      this.players.black = null;
    }

    // 플레이어가 하나라도 남아있으면 대기 상태로
    if (this.players.white || this.players.black) {
      this.gameState = 'waiting';
    }
  }

  // 방이 비어있는지 확인
  isEmpty() {
    return !this.players.white && !this.players.black;
  }

  // 방이 가득 찼는지 확인
  isFull() {
    return this.players.white && this.players.black;
  }

  // 플레이어 색깔 가져오기
  getPlayerColor(playerId) {
    if (this.players.white && this.players.white.id === playerId) {
      return 'white';
    }
    if (this.players.black && this.players.black.id === playerId) {
      return 'black';
    }
    return null;
  }
}

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> Room
    this.playerToRoom = new Map(); // playerId -> roomCode
  }

  // 고유한 방 코드 생성 (6자리)
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 방 생성 (모드 지원 추가)
  createRoom(hostId, hostName, gameMode = 'normal') {
    // 기존에 방에 있다면 제거
    this.removePlayerFromRoom(hostId);

    let roomCode;
    do {
      roomCode = this.generateRoomCode();
    } while (this.rooms.has(roomCode)); // 중복 방지

    const room = new Room(roomCode, hostId, hostName, gameMode);
    this.rooms.set(roomCode, room);
    this.playerToRoom.set(hostId, roomCode);

    console.log(`방 생성: ${roomCode} (모드: ${gameMode}, 총 ${this.rooms.size}개 방)`);
    return roomCode;
  }

  // 방 참가
  joinRoom(roomCode, playerId, playerName) {
    // 기존에 방에 있다면 제거
    this.removePlayerFromRoom(playerId);

    const room = this.rooms.get(roomCode);
    if (!room) {
      console.log(`방을 찾을 수 없음: ${roomCode}`);
      return null;
    }

    if (room.isFull()) {
      console.log(`방이 가득 찼음: ${roomCode}`);
      return null;
    }

    if (room.addPlayer(playerId, playerName)) {
      this.playerToRoom.set(playerId, roomCode);
      console.log(`${playerName}이 방 ${roomCode}에 참가 (모드: ${room.gameMode})`);
      return room;
    }

    return null;
  }

  // 방 가져오기
  getRoom(roomCode) {
    return this.rooms.get(roomCode);
  }

  // 플레이어가 속한 방 코드 가져오기
  getPlayerRoom(playerId) {
    return this.playerToRoom.get(playerId);
  }

  // 플레이어를 방에서 제거
  removePlayerFromRoom(playerId) {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (room) {
      room.removePlayer(playerId);
      
      // 방이 비어있으면 삭제
      if (room.isEmpty()) {
        this.rooms.delete(roomCode);
        console.log(`빈 방 삭제: ${roomCode} (총 ${this.rooms.size}개 방)`);
      }
    }

    this.playerToRoom.delete(playerId);
  }

  // 모든 방 목록 가져오기 (디버깅용)
  getAllRooms() {
    const roomList = [];
    for (const [roomCode, room] of this.rooms) {
      roomList.push({
        roomCode,
        gameMode: room.gameMode,
        gameState: room.gameState,
        gameConfig: room.gameConfig,
        players: {
          white: room.players.white?.name || null,
          black: room.players.black?.name || null
        },
        createdAt: room.createdAt
      });
    }
    return roomList;
  }

  // 통계 정보
  getStats() {
    const rooms = Array.from(this.rooms.values());
    const modeStats = {};
    
    rooms.forEach(room => {
      if (!modeStats[room.gameMode]) {
        modeStats[room.gameMode] = 0;
      }
      modeStats[room.gameMode]++;
    });

    return {
      totalRooms: this.rooms.size,
      activePlayers: this.playerToRoom.size,
      waitingRooms: rooms.filter(room => room.gameState === 'waiting').length,
      playingRooms: rooms.filter(room => room.gameState === 'playing').length,
      modeStats
    };
  }
}

module.exports = RoomManager;