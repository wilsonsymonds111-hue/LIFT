import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
// Remove the inline splash once React has mounted
const splash = document.getElementById('splash');
if (splash) splash.remove();