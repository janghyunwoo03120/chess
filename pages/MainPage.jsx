import React from 'react';
import Navbar from '../components/Navbar';
import GameCard from '../components/GameCard';
import './MainPage.css';

export default function MainPage() {
  const gameCategories = [
    {
      title: '일반 룰 모드',
      games: [
        {
          name: '오프라인 친구모드',
          image: '/pieces/black-bishop.png',
          description: '같은 기기에서 친구와 체스 대전!',
          link: '/chess' // 체스 게임으로 이동
        },
        {
          name: '온라인 친구모드',
          image: '/pieces/white-knight.png',
          description: '온라인으로 친구와 체스 게임!',
          link: '/chess/online-friend'
        },
        {
          name: '온라인 랜덤매칭모드',
          image: '/pieces/black-rook.png',
          description: '전 세계 플레이어와 랜덤 매칭!',
          link: '/chess/random-match'
        },
      ]
    },
    {
      title: '랜덤 모드',
      games: [
        {
          name: '랜덤 오프라인',
          image: '/pieces/white-queen.png',
          description: '랜덤 룰로 오프라인 대전!',
          link: '/chess/random-offline'
        },
        {
          name: '랜덤 온라인',
          image: '/pieces/black-king.png',
          description: '랜덤 룰로 온라인 매칭!',
          link: '/chess/random-online'
        },
        {
          name: '특수 랜덤모드',
          image: '/pieces/white-pawn.png',
          description: '예측 불가능한 특수 룰 게임!',
          link: '/chess/special-random'
        },
      ]
    },
    {
      title: '밸런스 모드',
      games: [
        {
          name: '밸런스 오프라인',
          image: '/pieces/white-bishop.png',
          description: '균형잡힌 룰로 오프라인 대전!',
          link: '/chess/balance-offline'
        },
        {
          name: '밸런스 온라인',
          image: '/pieces/black-knight.png',
          description: '공정한 규칙으로 온라인 매칭!',
          link: '/chess/balance-online'
        },
        {
          name: '프로 밸런스모드',
          image: '/pieces/white-rook.png',
          description: '전문가를 위한 균형 게임!',
          link: '/chess/pro-balance'
        },
      ]
    },
    {
      title: 'Time +',
      games: [
        {
          name: '블리츠 모드',
          image: '/pieces/black-queen.png',
          description: '빠른 시간제한으로 스피드 체스!',
          link: '/chess/blitz'
        },
        {
          name: '불릿 모드',
          image: '/pieces/white-king.png',
          description: '초고속 1분 체스 대결!',
          link: '/chess/bullet'
        },
        {
          name: '클래식 타임',
          image: '/pieces/black-pawn.png',
          description: '충분한 시간으로 깊이 있는 게임!',
          link: '/chess/classic'
        },
      ]
    }
  ];

  return (
    <div className="main-page">
      <div className="background-overlay">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {gameCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-16">
              <h2 className="text-4xl font-bold text-white text-center mb-8 text-shadow-lg">
                {category.title}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.games.map((game, gameIndex) => (
                  <GameCard
                    key={gameIndex}
                    name={game.name}
                    image={game.image}
                    description={game.description}
                    link={game.link}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

