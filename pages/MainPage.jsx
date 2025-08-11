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
          name: '오프라인 친구 모드',
          image: '/pieces/black-bishop.png',
          description: '같은 기기에서 친구와 체스 대전!',
          link: '/chess' // 기본 오프라인 모드
        },
        {
          name: '온라인 친구 모드',
          image: '/pieces/white-knight.png',
          description: '온라인으로 친구와 체스 게임!',
          link: '/chess/online-friend?mode=classic'
        },
        {
          name: '온라인 랜덤 매칭 모드',
          image: '/pieces/black-rook.png',
          description: '전 세계 플레이어와 랜덤 매칭!',
          link: '/chess/online-random'
        },
      ]
    },
    {
      title: '체스 960 모드',
      games: [
        {
          name: '오프라인 친구 모드',
          image: '/pieces/white-queen.png',
          description: '체스 960 스타일 랜덤 오프라인 대전!',
          link: '/chess/random2-offline'
        },
        {
          name: '온라인 친구 모드',
          image: '/pieces/black-king.png',
          description: '체스 960 룰로 온라인 매칭!',
          link: '/chess/online-friend?mode=random2'
        },
        {
          name: '온라인 랜덤 매칭 모드',
          image: '/pieces/white-pawn.png',
          description: '예측 불가능한 특수 체스 960 룰 게임!',
          link: '/chess/online-friend?mode=special-random2'
        },
      ]
    },
    {
      title: '밸런스 모드',
      games: [
        {
          name: '오프라인 친구 모드',
          image: '/pieces/white-bishop.png',
          description: '균형 잡힌 룰로 오프라인 대전!',
          link: '/chess/balance-offline'
        },
        {
          name: '온라인 친구 모드',
          image: '/pieces/black-knight.png',
          description: '공정한 규칙으로 온라인 매칭!',
          link: '/chess/online-friend?mode=balance'
        },
        {
          name: '온라인 랜덤 매칭 모드',
          image: '/pieces/white-rook.png',
          description: '전문가를 위한 균형 게임!',
          link: '/chess/online-friend?mode=pro-balance'
        },
      ]
    },
    {
      title: 'Time + 모드',
      games: [
        {
          name: '오프라인 친구 모드',
          image: '/pieces/black-queen.png',
          description: '빠른 시간 제한으로 스피드 체스!',
          link: '/chess/online-friend?mode=blitz'
        },
        {
          name: '온라인 친구 모드',
          image: '/pieces/white-king.png',
          description: '초고속 1분 체스 대결!',
          link: '/chess/online-friend?mode=bullet'
        },
        {
          name: '온라인 랜덤 매칭 모드',
          image: '/pieces/black-pawn.png',
          description: '충분한 시간으로 깊이 있는 게임!',
          link: '/chess/online-friend?mode=classic-time'
        },
      ]
    },
    {
      title: '랜덤 2 모드',
      games: [
        {
          name: '오프라인 친구 모드',
          image: '/pieces/black-rook.png',
          description: '새로운 랜덤 2 룰로 오프라인 대전!',
          link: '/chess/random2-offline'
        },
        {
          name: '온라인 친구 모드',
          image: '/pieces/white-knight.png',
          description: '랜덤 2 룰로 온라인 매칭!',
          link: '/chess/online-friend?mode=random2'
        },
        {
          name: '온라인 랜덤 매칭 모드',
          image: '/pieces/black-bishop.png',
          description: '예측 불가능한 특수 랜덤 2 룰 게임!',
          link: '/chess/online-friend?mode=special-random2'
        },
      ]
    },
  ];

  return (
    <div className="main-page">
      <div className="background-overlay">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {gameCategories.map(({ title, games }) => (
            <section key={title} className="mb-16">
              <h2 className="text-4xl font-bold text-white text-center mb-8 text-shadow-lg">
                {title}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map(({ name, image, description, link }) => (
                  <GameCard
                    key={name}
                    name={name}
                    image={image}
                    description={description}
                    link={link}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}



