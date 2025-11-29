/**
 * main.jsx - React App Entry Point
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('🎯 main.jsx: Starting React app...');
console.log('🎯 Root element:', document.getElementById('root'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
