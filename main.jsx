import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

const root = createRoot(document.getElementById('root'));
root.render(
  // 개발 중에는 StrictMode를 비활성화하여 이중 마운트 방지
  // <StrictMode>
    <App />
  // </StrictMode>
);