import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import Board from './components/Board/Board';
import GameOver from './pages/GameOver';
// import OnlineFriendPage from './pages/OnlineFriendPage';  // 파일이 없으므로 주석 처리
// import RandomMatchPage from './pages/RandomMatchPage';    // 파일이 없으므로 주석 처리
import ComingSoonPage from './pages/ComingSoonPage';
import GameIntro from './pages/GameIntro';
import Inquiry from './pages/Inquiry';
import Loginpage from './pages/LoginPage';

// OnlineFriendMode 컴포넌트 import 추가
import OnlineFriendMode from './pages/OnlineFriendMode';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        
        {/* 오프라인 체스 게임 */}
        <Route path="/chess" element={<Board />} />
        
        {/* 온라인 게임 실제 플레이 페이지 */}
        <Route path="/chess/game" element={<Board />} />
        
        <Route path="/gameover" element={<GameOver />} />
        
        {/* 기존 온라인 페이지들 - 파일이 없으므로 ComingSoon으로 대체 */}
        <Route path="/chess/online-friend" element={<ComingSoonPage mode="온라인 친구모드" />} />
        <Route path="/chess/random-match" element={<ComingSoonPage mode="랜덤 매치" />} />
        
        {/* 새로운 OnlineFriendMode를 사용하는 모든 온라인 모드들 */}
        <Route path="/chess/online-friend-new" element={<OnlineFriendMode />} />
        <Route path="/chess/random-online" element={<OnlineFriendMode />} />
        <Route path="/chess/special-random" element={<OnlineFriendMode />} />
        <Route path="/chess/balance-online" element={<OnlineFriendMode />} />
        <Route path="/chess/pro-balance" element={<OnlineFriendMode />} />
        <Route path="/chess/blitz" element={<OnlineFriendMode />} />
        <Route path="/chess/bullet" element={<OnlineFriendMode />} />
        <Route path="/chess/classic" element={<OnlineFriendMode />} />
        
        {/* 기타 페이지들 */}
        <Route path="/game-intro" element={<GameIntro />} />
        <Route path="/inquiry" element={<Inquiry />} />
        <Route path="/loginpage" element={<Loginpage />} />
        
        {/* 아직 준비중인 오프라인 모드들 */}
        <Route path="/chess/random-offline" element={<ComingSoonPage mode="랜덤 오프라인" />} />
        <Route path="/chess/balance-offline" element={<ComingSoonPage mode="밸런스 오프라인" />} />
      </Routes>
    </Router>
  );
}