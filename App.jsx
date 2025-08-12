import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MainPage from './pages/MainPage';
import Board from './components/Board/Board'; // 오프라인 친구 모드
import ClassicBoard from './components/Board/ClassicBoard'; // 온라인 친구 모드
import OnlineFriendMode from './pages/OnlineFriendMode';

// 기타 페이지들
const GameOver = () => (
  <div className="p-8 text-center">게임 종료 페이지 (준비중)</div>
);

const GameIntro = () => <div className="p-8 text-center">게임 소개 페이지 (준비중)</div>;
const Inquiry = () => <div className="p-8 text-center">문의 페이지 (준비중)</div>;
const Loginpage = () => <div className="p-8 text-center">로그인 페이지 (준비중)</div>;

// 랜덤 매칭 모드 (준비중)
const RandomMatchingMode = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">🎲 랜덤 매칭</h1>
      <p className="text-gray-600 mb-4">준비중입니다.</p>
      <button
        onClick={() => window.history.back()}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        뒤로가기
      </button>
    </div>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 메인 페이지 */}
        <Route path="/" element={<MainPage />} />

        {/* 클래식 모드 3가지 */}
        {/* 1. 오프라인 친구 모드 (같은 기기에서 둘이 플레이) */}
        <Route path="/chess/offline-friend" element={<Board />} />
        
        {/* 2. 온라인 친구 모드 (방 코드로 친구와 플레이) */}
        <Route path="/chess/online-friend" element={<OnlineFriendMode />} />
        <Route path="/chess/game/online" element={<ClassicBoard />} /> {/* 실제 게임 화면 */}
        
        {/* 3. 랜덤 매칭 모드 (랜덤한 상대와 매칭) */}
        <Route path="/chess/random-matching" element={<RandomMatchingMode />} />

        {/* 기타 페이지 */}
        <Route path="/gameover" element={<GameOver />} />
        <Route path="/game-intro" element={<GameIntro />} />
        <Route path="/inquiry" element={<Inquiry />} />
        <Route path="/loginpage" element={<Loginpage />} />

        {/* 호환성을 위한 기존 경로들 (필요시 제거 가능) */}
        <Route path="/chess" element={<Board />} />
        <Route path="/chess/game/classic" element={<ClassicBoard />} />
      </Routes>
    </Router>
  );
}











