import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service worker registration: plugin will generate /sw.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // check if /sw.js exists and is JS to avoid registering a HTML fallback (MIME error)
    fetch('/sw.js', { method: 'HEAD' }).then(res => {
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('javascript')) {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('ServiceWorker registrado:', reg.scope))
          .catch(err => console.warn('ServiceWorker registro falhou:', err));
      } else {
        console.info('No valid /sw.js found (status:', res.status, 'content-type:', ct, '). Skipping SW registration.');
      }
    }).catch(err => {
      console.info('Could not fetch /sw.js — skipping SW registration.', err);
    });
  });
}
