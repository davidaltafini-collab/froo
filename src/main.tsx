import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Most product photos are remote (Unsplash). On a flaky or offline connection the browser would
// otherwise paint the broken-image icon plus the alt text inside every card; hiding the failed
// <img> lets the tile's own background show through as a clean placeholder instead.
document.addEventListener(
  'error',
  (event) => {
    if (event.target instanceof HTMLImageElement) event.target.style.visibility = 'hidden';
  },
  true,
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
);
