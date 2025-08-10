import React from 'react';
import Navbar from '../components/Navbar';
import '../styles/pages.css';
export default function RandomMatchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">온라인 랜덤매칭모드</h1>
          <div className="bg-slate-800 rounded-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl text-white mb-4">매칭 시스템 구축중</h2>
            <p className="text-gray-300 mb-6">
              전 세계 플레이어와의 랜덤 매칭 시스템을 개발하고 있습니다.
            </p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg">
              매칭 대기 중...
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}