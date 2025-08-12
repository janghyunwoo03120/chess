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
    }
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



