import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import RoutesComponent from './app.tsx';
import { Toaster } from '@client/src/components/ui/sonner';
import './index.css';

// 独立部署（Vercel 自定义域名）下应用挂载在根路径，固定为 '/'，
// 不读取平台注入的 window.__BASENAME__（静态导出时它是未替换的占位符）。
const CLIENT_BASE_PATH = '/';

const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => (
  <div style={{ padding: 24, textAlign: 'center' }}>
    <p>页面出错了：{error.message}</p>
    <button onClick={resetErrorBoundary} style={{ marginTop: 12 }}>
      重试
    </button>
  </div>
);

const MainApp = () => {
  return (
    <BrowserRouter basename={CLIENT_BASE_PATH}>
      <ErrorBoundary fallbackRender={ErrorFallback}>
        <RoutesComponent />
        <Toaster />
      </ErrorBoundary>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
