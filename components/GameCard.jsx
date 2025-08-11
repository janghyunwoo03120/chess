import React from 'react';
import { Link } from 'react-router-dom';

export default function GameCard({ name, image, description, link }) {
  // props 검증 및 기본값 설정
  const cardName = name || '게임 모드';
  const cardImage = image || '/pieces/white-king.png';
  const cardDescription = description || '게임 설명';
  const cardLink = link || '';

  console.log('GameCard props:', { name: cardName, image: cardImage, description: cardDescription, link: cardLink });

  const cardContent = (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
      <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <img 
          src={cardImage} 
          alt={cardName} 
          className="w-16 h-16 object-contain"
          onError={(e) => {
            console.error('Image load error:', cardImage);
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div 
          className="absolute inset-0 flex items-center justify-center text-6xl text-gray-400"
          style={{ display: 'none' }}
        >
          ♔
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{cardName}</h3>
        <p className="text-sm text-gray-600">{cardDescription}</p>
        {/* 디버깅을 위한 임시 정보 - 나중에 제거 */}
        <div className="mt-2 text-xs text-gray-400 font-mono">
          {cardLink ? `Link: ${cardLink}` : 'No link'}
        </div>
      </div>
    </div>
  );

  // link가 있으면 Link로 감싸고, 없으면 준비중 알림
  if (cardLink) {
    return (
      <Link to={cardLink} className="block">
        {cardContent}
      </Link>
    );
  } else {
    return (
      <div 
        onClick={() => alert(`${cardName}은(는) 준비중입니다!`)} 
        className="cursor-pointer"
      >
        {cardContent}
      </div>
    );
  }
}
