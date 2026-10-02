import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Global styles first so section styles can override them.
import './styles/base.css';
import App from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
