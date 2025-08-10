// roomManager.js
class Room {
  constructor(roomCode, hostId, hostName) {
    this.roomCode = roomCode;
    this.players = {
      white: { id: hostId, name: hostName }, // 방장은 백색
      black: null // 참가자는 흑색
    };
    this.gameState = 'waiting'; // waiting, playing, finished
    this.createdAt = new Date();
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

  // 방 생성
  createRoom(hostId, hostName) {
    // 기존에 방에 있다면 제거
    this.removePlayerFromRoom(hostId);

    let roomCode;
    do {
      roomCode = this.generateRoomCode();
    } while (this.rooms.has(roomCode)); // 중복 방지

    const room = new Room(roomCode, hostId, hostName);
    this.rooms.set(roomCode, room);
    this.playerToRoom.set(hostId, roomCode);

    console.log(`방 생성: ${roomCode} (총 ${this.rooms.size}개 방)`);
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
      console.log(`${playerName}이 방 ${roomCode}에 참가`);
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
        gameState: room.gameState,
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
    return {
      totalRooms: this.rooms.size,
      activePlayers: this.playerToRoom.size,
      waitingRooms: Array.from(this.rooms.values()).filter(room => room.gameState === 'waiting').length,
      playingRooms: Array.from(this.rooms.values()).filter(room => room.gameState === 'playing').length
    };
  }
}

module.exports = RoomManager;