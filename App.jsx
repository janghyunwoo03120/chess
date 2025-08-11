import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MainPage from './pages/MainPage';
import Board from './components/Board/Board';

import ClassicBoard from './components/Board/ClassicBoard';
import RandomBoard from './components/Board/RandomBoard';
import Random2Board from './components/Board/Random2Board';
import BalanceBoard from './components/Board/BalanceBoard';
import TimeAttackBoard from './components/Board/TimeAttackboard';


import OnlineFriendMode from './pages/OnlineFriendMode';

const GameOver = () => (
  <div className="p-8 text-center">게임 종료 페이지 (준비중)</div>
);

const ComingSoonPage = ({ mode }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">{mode}</h1>
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

const GameIntro = () => <div className="p-8 text-center">게임 소개 페이지 (준비중)</div>;
const Inquiry = () => <div className="p-8 text-center">문의 페이지 (준비중)</div>;
const Loginpage = () => <div className="p-8 text-center">로그인 페이지 (준비중)</div>;

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />

        {/* 기본 Board (gameType 없이) */}
        <Route path="/chess" element={<Board />} />

        {/* 기존 방식: Board 컴포넌트에 gameType prop 주는 컴포넌트들 */}
        <Route path="/chess/game/classic-old" element={<Board gameType="classic" />} />
        <Route path="/chess/game/random-old" element={<Board gameType="random" />} />
        <Route path="/chess/game/random2-old" element={<Board gameType="random2" />} />
        <Route path="/chess/game/balance-old" element={<Board gameType="balance" />} />
        <Route path="/chess/game/timeattack-old" element={<Board gameType="timeattack" />} />

        {/* 새로 분리된 컴포넌트로 경로 */}
        <Route path="/chess/game/classic" element={<ClassicBoard />} />
        <Route path="/chess/game/random" element={<RandomBoard />} />
        <Route path="/chess/game/special-random" element={<RandomBoard />} />
        <Route path="/chess/game/random2" element={<Random2Board />} />
        <Route path="/chess/game/special-random2" element={<Random2Board />} />
        <Route path="/chess/game/balance" element={<BalanceBoard />} />
        <Route path="/chess/game/pro-balance" element={<BalanceBoard />} /> {/* 필요시 분리 가능 */}
        <Route path="/chess/game/timeattack" element={<TimeAttackBoard />} />

        {/* 온라인 모드 */}
        <Route path="/chess/online-friend" element={<OnlineFriendMode />} />
        <Route path="/chess/online-random" element={<OnlineFriendMode />} />
        <Route path="/chess/online-random2" element={<OnlineFriendMode />} />
        <Route path="/chess/online-balance" element={<OnlineFriendMode />} />
        <Route path="/chess/online-pro-balance" element={<OnlineFriendMode />} />
        <Route path="/chess/online-timeattack" element={<OnlineFriendMode />} />
        <Route path="/chess/online-classic" element={<OnlineFriendMode />} />

        {/* 기타 페이지 */}
        <Route path="/gameover" element={<GameOver />} />
        <Route path="/game-intro" element={<GameIntro />} />
        <Route path="/inquiry" element={<Inquiry />} />
        <Route path="/loginpage" element={<Loginpage />} />

        {/* 준비중 페이지 */}
        <Route path="/chess/random2-offline" element={<ComingSoonPage mode="랜덤 2 오프라인" />} />
        <Route path="/chess/balance-offline" element={<ComingSoonPage mode="밸런스 오프라인" />} />
        <Route path="/chess/timeattack-offline" element={<ComingSoonPage mode="타임어택 오프라인" />} />
      </Routes>
    </Router>
  );
}











