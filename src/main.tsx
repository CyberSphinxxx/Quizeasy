import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from '@/app/App';
import { useAppStore } from '@/app/store/appStore';
import '@/styles/index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Quizeasy could not find the #root element to mount into.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Announce available updates instead of force-reloading, so an active study
// session is never interrupted unexpectedly.
try {
  const updateSW = registerSW({
    onNeedRefresh() {
      useAppStore.getState().setUpdateAvailable(true);
    },
  });
  useAppStore.getState().setApplyUpdate(() => {
    void updateSW(true);
  });
} catch (error) {
  console.warn('Quizeasy could not register the service worker.', error);
}
