import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import * as todoStorage from './todoStorage.js';
import * as auth from './auth.js';
import App from './App';

todoStorage.loadLocalTodos()

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
