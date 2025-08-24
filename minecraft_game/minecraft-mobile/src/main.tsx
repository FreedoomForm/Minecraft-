import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Проверка поддержки WebGL
const checkWebGLSupport = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      throw new Error('WebGL не поддерживается');
    }
    
    // Проверка расширений (только для WebGL контекста)
    if ('getSupportedExtensions' in gl) {
      const extensions = (gl as WebGLRenderingContext).getSupportedExtensions();
      console.log('Поддерживаемые WebGL расширения:', extensions);
    }
    
    return true;
  } catch (error) {
    console.error('WebGL не поддерживается:', error);
    return false;
  }
};

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW зарегистрирован:', registration.scope);
      })
      .catch((error) => {
        console.log('SW ошибка:', error);
      });
  });
}

// Предотвращение контекстного меню на мобильных устройствах
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Обработка ошибок
window.addEventListener('error', (event) => {
  console.error('Глобальная ошибка:', event.error);
  
  // Специальная обработка ошибок Three.js
  if (event.error && event.error.message && event.error.message.includes('THREE')) {
    console.error('Ошибка Three.js:', event.error);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Необработанное отклонение промиса:', event.reason);
});

// Проверяем поддержку WebGL перед запуском
if (!checkWebGLSupport()) {
  // Показываем ошибку если WebGL не поддерживается
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        color: white;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
          <h1 style="font-size: 2rem; margin-bottom: 1rem;">WebGL не поддерживается</h1>
          <p style="font-size: 1.2rem; margin-bottom: 2rem;">
            Ваш браузер не поддерживает WebGL, который необходим для работы 3D игры Minecraft.
          </p>
          <p style="font-size: 1rem; opacity: 0.8;">
            Попробуйте открыть сайт в Chrome, Safari или Firefox.
          </p>
        </div>
      </div>
    `;
  }
} else {
  // Запускаем приложение если WebGL поддерживается
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}