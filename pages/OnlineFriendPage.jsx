import React from 'react';
import Navbar from '../components/Navbar';
import '../styles/pages.css';
export default function OnlineFriendPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">온라인 친구모드</h1>
          <div className="bg-slate-800 rounded-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl text-white mb-4">준비중입니다!</h2>
            <p className="text-gray-300 mb-6">
              온라인 친구와의 체스 게임 기능을 개발 중입니다.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
              곧 출시 예정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}