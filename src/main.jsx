import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
// Splash is removed automatically by React when it renders into #root.
// Do NOT remove it manually — root.render() is async in React 18, so
// removing synchronously creates a gap where the body background shows through.