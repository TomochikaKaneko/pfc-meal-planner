import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { ErrorBoundary } from './ErrorBoundary';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

const LEGACY_CACHE_NAMES = ['pfc-meal-planner-v1'];

async function clearLegacyCaches() {
  if (!('caches' in window)) return;
  const names = await caches.keys();
  await Promise.all(names.filter((name) => LEGACY_CACHE_NAMES.includes(name)).map((name) => caches.delete(name)));
}

clearLegacyCaches().catch(() => undefined);

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('pwa-update-ready'));
  },
  onRegisteredSW(_swUrl, registration) {
    registration?.update().catch(() => undefined);

    window.setInterval(
      () => {
        registration?.update().catch(() => undefined);
      },
      60 * 60 * 1000,
    );
  },
});

window.addEventListener('pwa-apply-update', () => {
  updateSW(true);
});
