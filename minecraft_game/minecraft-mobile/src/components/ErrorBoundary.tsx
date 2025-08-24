import React from 'react';

const serializeError = (error: any) => {
  if (error instanceof Error) {
    return error.message + '\n' + error.stack;
  }
  return JSON.stringify(error, null, 2);
};

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-2xl">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Произошла ошибка
            </h1>
            <p className="text-gray-600 mb-6">
              Игра столкнулась с проблемой. Попробуйте перезагрузить страницу.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-medium"
            >
              Перезагрузить
            </button>
            <details className="mt-4 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer">Детали ошибки</summary>
              <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {serializeError(this.state.error)}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}