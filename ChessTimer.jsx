import React, { useState, useEffect } from 'react';

const ChessTimer = ({ 
  currentTurn, 
  onTimeOut, 
  gameOver, 
  color,
  gameStarted = false // 💡 게임 시작 여부를 받는 새로운 prop
}) => {
  // 각 플레이어의 남은 시간 (초 단위, 기본 10분 = 600초)
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);

  useEffect(() => {
    // 💡 게임이 시작되지 않았거나 게임이 종료되었으면 타이머 중지
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      if (currentTurn === 'white') {
        setWhiteTime(prevTime => {
          if (prevTime <= 1) {
            onTimeOut('white');
            return 0;
          }
          return prevTime - 1;
        });
      } else {
        setBlackTime(prevTime => {
          if (prevTime <= 1) {
            onTimeOut('black');
            return 0;
          }
          return prevTime - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTurn, gameOver, gameStarted, onTimeOut]); // 💡 gameStarted 의존성 추가

  // 시간을 분:초 형식으로 변환
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 현재 색깔에 해당하는 시간을 표시
  const displayTime = color === 'white' ? whiteTime : blackTime;
  
  // 시간이 부족할 때 (30초 이하) 경고 스타일
  const isTimeWarning = displayTime <= 30;
  const isTimeCritical = displayTime <= 10;

  return (
    <div 
      style={{
        padding: '8px 16px',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1.2em',
        minWidth: '80px',
        textAlign: 'center',
        border: currentTurn === color ? '2px solid #FFD700' : '2px solid transparent',
        backgroundColor: isTimeCritical ? 'rgba(255, 0, 0, 0.8)' : 
                         isTimeWarning ? 'rgba(255, 165, 0, 0.8)' : 
                         color === 'white' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        color: color === 'white' ? 'black' : 'white',
        transition: 'all 0.3s ease',
        boxShadow: currentTurn === color ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
      }}
    >
      <div style={{ fontSize: '0.8em', marginBottom: '2px' }}>
        {color === 'white' ? '⚪ 백' : '⚫ 흑'}
      </div>
      <div style={{ 
        fontSize: isTimeCritical ? '1.1em' : '1em',
        animation: isTimeCritical ? 'pulse 1s infinite' : 'none'
      }}>
        {gameStarted ? formatTime(displayTime) : formatTime(600)}
      </div>
      {!gameStarted && (
        <div style={{ fontSize: '0.7em', marginTop: '2px', opacity: 0.7 }}>
          대기중
        </div>
      )}
    </div>
  );
};

export default ChessTimer;







