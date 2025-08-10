import React from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* 브랜드/로고 영역 */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <h1 className="brand-title">RandomChess</h1>
          </Link>
          {/* 나중에 로고 추가할 때를 위한 공간 */}
        </div>

        {/* 네비게이션 메뉴 */}
        <div className="navbar-menu">
          <Link to="/game-intro" className="menu-item">게임소개</Link>
          <Link to="/inquiry" className="menu-item">문의</Link>
          <Link to="/auth" className="menu-item">로그인/회원가입</Link>
          <span className="menu-item developing">개발중</span>
          <span className="menu-item developing">개발중</span>
          <span className="menu-item developing">개발중</span>
        </div>
      </div>
    </nav>
  );
}
