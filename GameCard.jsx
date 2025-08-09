import React from 'react';
import { Link } from 'react-router-dom';

export default function GameCard({ name, image, description, link }) {
  const cardContent = (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
      <img src={image} alt={name} className="w-full h-40 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-gray-600 mt-2">{description}</p>
      </div>
    </div>
  );

  // link가 있으면 Link로 감싸고, 없으면 준비중 알림
  if (link) {
    return (
      <Link to={link} className="block">
        {cardContent}
      </Link>
    );
  } else {
    return (
      <div onClick={() => alert('준비중입니다!')} className="cursor-pointer">
        {cardContent}
      </div>
    );
  }
}
