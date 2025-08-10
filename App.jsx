import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MainPage from './pages/MainPage';
import Board from './components/Board/Board'; // 기존 체스 게임
import GameOver from './pages/GameOver';
import OnlineFriendPage from './pages/OnlineFriendPage';
import RandomMatchPage from './pages/RandomMatchPage';
import ComingSoonPage from './pages/ComingSoonPage';
import GameIntro from './pages/GameIntro';
import Inquiry from './pages/Inquiry';
import Loginpage from './pages/LoginPage'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/chess" element={<Board />} />
        <Route path="/gameover" element={<GameOver />} />
        <Route path="/chess/online-friend" element={<OnlineFriendPage />} />
        <Route path="/chess/random-match" element={<RandomMatchPage />} />
        <Route path="/game-intro" element={<GameIntro />} />
        <Route path="/inquiry" element={<Inquiry />} />
        <Route path="/loginpage" element={<Loginpage />} />
        {/* 나머지 모든 게임 모드들을 준비중 페이지로 연결 */}
        <Route path="/chess/random-offline" element={<ComingSoonPage mode="랜덤 오프라인" />} />
        <Route path="/chess/random-online" element={<ComingSoonPage mode="랜덤 온라인" />} />
        <Route path="/chess/special-random" element={<ComingSoonPage mode="특수 랜덤모드" />} />
        <Route path="/chess/balance-offline" element={<ComingSoonPage mode="밸런스 오프라인" />} />
        <Route path="/chess/balance-online" element={<ComingSoonPage mode="밸런스 온라인" />} />
        <Route path="/chess/pro-balance" element={<ComingSoonPage mode="프로 밸런스모드" />} />
        <Route path="/chess/blitz" element={<ComingSoonPage mode="블리츠 모드" />} />
        <Route path="/chess/bullet" element={<ComingSoonPage mode="불릿 모드" />} />
        <Route path="/chess/classic" element={<ComingSoonPage mode="클래식 타임" />} />
      </Routes>
    </Router>
  );
}







