import React, { useEffect, useState } from 'react';
import { MobileMinecraft } from '@/components/MobileMinecraft';
import './App.css';

function App() {
  const [isSupported, setIsSupported] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Режим снятия скриншотов (обходит проверку WebGL для headless)
    const params = new URLSearchParams(window.location.search);
    const screenshotMode = params.get('screenshot') === '1';
    if (!screenshotMode) {
      // Проверка поддержки WebGL
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setIsSupported(false);
        return;
      }
    }

    // Обработка PWA установки
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Предотвращение масштабирования
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // Удаляем сплэш после монтирования приложения
    const splash = document.getElementById('splash');
    if (splash && splash.parentElement) {
      splash.parentElement.removeChild(splash);
    }
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-2xl">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Неподдерживаемое устройство
          </h1>
          <p className="text-gray-600 mb-6">
            Ваш браузер не поддерживает WebGL, который необходим для работы игры.
          </p>
          <p className="text-sm text-gray-500">
            Попробуйте открыть сайт в Chrome, Safari или Firefox.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* PWA установка */}
      {installPrompt && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <span className="text-sm font-medium">Установить приложение?</span>
            <button 
              onClick={handleInstallApp}
              className="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
            >
              Да
            </button>
            <button 
              onClick={() => setInstallPrompt(null)}
              className="text-green-200 hover:text-white text-sm"
            >
              Нет
            </button>
          </div>
        </div>
      )}
      
      {/* Основная игра */}
      <MobileMinecraft />
    </div>
  );
}

export default App;