import React from 'react';
import '../styles/pages.css';
import { useLocation, useNavigate } from 'react-router-dom';

const GameOver = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const winner = location.state?.winner || '무승부';

  return (
    <div style={{ textAlign: 'center', marginTop: '20vh' }}>
      <h1>게임 종료</h1>
      <h2>{winner === '무승부' ? '무승부입니다!' : `${winner} 승리!`}</h2>
      <button onClick={() => navigate('/')}>메인으로 돌아가기</button>
    </div>
  );
};

export default GameOver;


//GameOver.jsx