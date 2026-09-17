import { StrictMode } from 'react';
import { createRoot }  from 'react-dom/client';
import App             from './App.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { THEME }         from './constants/theme.js';

// Global reset — light healthcare aesthetic
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #ffffff;
    color: #36454f;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  }
  input[type=range] {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 2px;
    background: #d3d3d3;
    outline: none;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: currentColor;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  input[type=range]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: currentColor;
    cursor: pointer;
    border: none;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  /* Hide number input spinner arrows in all browsers */
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] { -moz-appearance: textfield; }
  button:focus-visible,
  select:focus-visible { outline: 2px solid #36454f; outline-offset: 2px; }
  /* Enter animations for panels and dialogs — skipped under reduced motion */
  @keyframes fade-in    { from { opacity: 0; } }
  @keyframes fade-in-up { from { opacity: 0; transform: translateY(6px); } }
  @media (prefers-reduced-motion: no-preference) {
    .fade-in    { animation: fade-in ${THEME.transition}; }
    .fade-in-up { animation: fade-in-up ${THEME.transition}; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: 0s !important; }
  }
  @media print {
    body { background: #fff; color: #000; }
  }
`;
document.head.appendChild(style);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
