import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/pages.css';

export default function ComingSoonPage({ mode }) {
  const getModeColor = (mode) => {
    if (mode.includes('랜덤')) return 'from-purple-900 via-pink-900 to-purple-900';
    if (mode.includes('밸런스')) return 'from-blue-900 via-indigo-900 to-blue-900';
    if (mode.includes('블리츠') || mode.includes('불릿') || mode.includes('클래식')) {
      return 'from-orange-900 via-red-900 to-orange-900';
    }
    return 'from-slate-900 via-gray-900 to-slate-900';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getModeColor(mode)}`}>
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-4">{mode}</h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
          </div>
          
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-12 max-w-2xl mx-auto shadow-2xl">
            <div className="text-6xl mb-6">🚧</div>
            <h2 className="text-3xl text-white mb-6 font-semibold">준비중입니다!</h2>
            <p className="text-gray-300 mb-8 text-lg leading-relaxed">
              {mode} 기능을 열심히 개발하고 있습니다.<br />
              더 나은 게임 경험을 위해 최선을 다하고 있으니<br />
              조금만 기다려 주세요!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                메인으로 돌아가기
              </Link>
              <Link 
                to="/chess" 
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                일반 체스 하기
              </Link>
            </div>
          </div>
          
          <div className="mt-12 text-gray-400">
            <p className="text-sm">
              개발 진행 상황이나 출시 일정에 대한 문의는 개발팀으로 연락해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}