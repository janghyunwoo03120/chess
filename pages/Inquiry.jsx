// src/pages/Inquiry.jsx
import React, { useState } from 'react';
import '../styles/pages.css';
const Inquiry = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 여기에 문의 제출 로직 추가
    console.log('문의 내용:', formData);
    alert('문의가 접수되었습니다!');
  };

  return (
    <div className="page-container">
      <h1>문의하기</h1>
      <div className="content">
        <div className="inquiry-info">
          <h3>문의 정보</h3>
          <p><strong>이메일:</strong> contact@randomchess.com</p>
          <p><strong>운영시간:</strong> 월-금 09:00-18:00</p>
          <p><strong>응답시간:</strong> 1-2 영업일 내 답변</p>
        </div>

        <form className="inquiry-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">제목</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">문의 내용</label>
            <textarea
              id="message"
              name="message"
              rows="5"
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-btn">문의 보내기</button>
        </form>
      </div>
    </div>
  );
};

export default Inquiry;
