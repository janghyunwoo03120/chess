import React from 'react';

const PromotionModal = ({ promotion, onPromotionChoice }) => {
  if (!promotion) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        borderRadius: 10,
        boxShadow: '0 0 15px rgba(0,0,0,0.5)',
        padding: 20,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ marginBottom: 10, fontWeight: 'bold' }}>
        프로모션: 승격할 말을 선택하세요
      </div>
      <div style={{ display: 'flex', gap: 15 }}>
        {['queen', 'rook', 'bishop', 'knight'].map(type => (
          <div
            key={type}
            onClick={() => onPromotionChoice(type)}
            style={{
              cursor: 'pointer',
              padding: 10,
              border: '1px solid black',
              borderRadius: 5,
              textTransform: 'capitalize',
              userSelect: 'none',
              fontWeight: 'bold',
              backgroundColor: '#f9f9f9',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f9f9f9';
            }}
          >
            {type}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromotionModal;