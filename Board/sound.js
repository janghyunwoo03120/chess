// 사운드 관련 유틸리티 함수들

let moveSoundRef = null;
let checkSoundRef = null;
let gameoverSoundRef = null;
let stalemateSoundRef = null;  // 선언 추가

// 사운드 초기화
export const initializeSounds = () => {
  if (typeof Audio === 'undefined') return;

  if (!moveSoundRef) moveSoundRef = new Audio('/sounds/move.mp3');
  if (!checkSoundRef) checkSoundRef = new Audio('/sounds/check.mp3');
  if (!gameoverSoundRef) gameoverSoundRef = new Audio('/sounds/gameover.mp3');
  if (!stalemateSoundRef) stalemateSoundRef = new Audio('/sounds/stalemate.mp3'); // 필요 시 사용
};

// 안전한 사운드 재생 함수
const playSound = (soundRef) => {
  if (!soundRef) return;

  try {
    if (!soundRef.paused && soundRef.currentTime > 0) {
      soundRef.pause();
      soundRef.currentTime = 0;
    } else {
      soundRef.currentTime = 0;
    }

    soundRef.play().catch(e => {
      console.log('Sound play error:', e.message || e);
    });
  } catch (error) {
    console.log('Sound error:', error.message || error);
  }
};

// gameoverSoundRef 재사용으로 변경
export const playGameOverSound = () => {
  if (!gameoverSoundRef) initializeSounds();
  playSound(gameoverSoundRef);
};

export const playMoveSound = () => {
  if (!moveSoundRef) initializeSounds();
  playSound(moveSoundRef);
};

export const playCheckSound = () => {
  if (!checkSoundRef) initializeSounds();
  playSound(checkSoundRef);
};

export const playCheckmateSound = () => {
  if (!gameoverSoundRef) initializeSounds();
  playSound(gameoverSoundRef);
};

export const playKingCapturedSound = () => {
  if (!gameoverSoundRef) initializeSounds();
  playSound(gameoverSoundRef);
};

export const playStalemateSound = () => {
  if (!gameoverSoundRef) initializeSounds();
  playSound(gameoverSoundRef);
};


// 컴포넌트 언마운트 등에서 사운드 정리
export const cleanupSounds = () => {
  if (moveSoundRef) {
    moveSoundRef.pause();
    moveSoundRef = null;
  }
  if (checkSoundRef) {
    checkSoundRef.pause();
    checkSoundRef = null;
  }
  if (gameoverSoundRef) {
    gameoverSoundRef.pause();
    gameoverSoundRef = null;
  }
  if (stalemateSoundRef) {
    stalemateSoundRef.pause();
    stalemateSoundRef = null;
  }
};
