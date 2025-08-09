// PalaceBackground.jsx
import React from 'react';
import royalPalace from '../assets/royal-palace.jpg';

const PalaceBackground = () => {
  return (
    <img
  src={royalPalace}
  alt="Palace Background"
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    objectFit: 'cover',
    objectPosition: 'center 1%', // ← 여기! 위에서 30%만큼 아래로 내림
    zIndex: -1,
    userSelect: 'none',
    pointerEvents: 'none',
  }}
/>

  );
};

export default PalaceBackground;






