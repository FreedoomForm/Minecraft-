import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Регистрация Service Worker для PWA (только в продакшене)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
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
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Необработанное отклонение промиса:', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);