// src/pages/GameIntro.jsx
import React from 'react';
import '../styles/pages.css';
const GameIntro = () => {
  return (
    <div className="page-container">
      <h1>게임 소개</h1>
      <div className="content">
        <h2>RandomChess란?</h2>
        <p>
          RandomChess는 전통적인 체스에 새로운 재미를 더한 혁신적인 체스 게임입니다.
        </p>
        
        <h3>주요 특징:</h3>
        <ul>
          <li>랜덤 요소가 추가된 체스 게임</li>
          <li>다양한 게임 모드</li>
          <li>온라인 멀티플레이어 지원</li>
          <li>초보자부터 전문가까지 즐길 수 있는 난이도 조절</li>
        </ul>

        <h3>게임 방법:</h3>
        <p>
          기본적인 체스 규칙을 따르되, 특별한 랜덤 이벤트들이 게임에 예상치 못한 
          전략적 요소를 더해줍니다.
        </p>
      </div>
    </div>
  );
};

export default GameIntro;
