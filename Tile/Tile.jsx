import React, { useEffect, useState, useRef } from 'react';
import './Tile.css';

const Tile = ({
  color,
  piece,
  onClick,
  highlight,
  isMoveOption,
  isRotated,
  isLastMove = false // 💡 마지막 이동 하이라이트 prop
}) => {
  const pieceName = piece ? `${piece.color}-${piece.type}` : '';
  const classNames = ['tile', color];
  
  // 💡 우선순위: highlight(선택) > isLastMove(마지막 이동) > 일반
  if (highlight) {
    classNames.push('highlighted');
  } else if (isLastMove) {
    classNames.push('last-move');
  }
  
  // 💡 이동 옵션 표시는 선택된 칸이 아닐 때만
  if (isMoveOption && !highlight) {
    classNames.push('move-highlight');
  }

  const [animate, setAnimate] = useState(false);
  const hasMounted = useRef(false);
  const prevPieceRef = useRef(null);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
    } else {
      const prev = prevPieceRef.current;
      if (
        piece &&
        (!prev || prev.color !== piece.color || prev.type !== piece.type)
      ) {
        setAnimate(true);
        const timeout = setTimeout(() => {
          setAnimate(false);
        }, 400);
        return () => clearTimeout(timeout);
      }
    }
    prevPieceRef.current = piece;
  }, [piece]);

  return (
    <div className={classNames.join(' ')} onClick={onClick}>
      {piece && (
        <img
          src={`/pieces/${pieceName}.png`}
          alt={pieceName}
          className={`piece ${animate ? 'jump' : ''}`}
          style={{
            // 말은 회전하지 않고 항상 정상 방향 유지
            transform: 'rotate(0deg)',
            transition: 'none'
          }}
        />
      )}
    </div>
  );
};

export default Tile;