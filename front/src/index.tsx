import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import * as todoStorage from './todoStorage'
import App from './App'

todoStorage.loadLocalTodos()

const root = ReactDOM.createRoot(document.getElementById('root') as any)
root.render(<React.StrictMode><App /></React.StrictMode>)
