import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import * as todoStorage from './todoStorage.js';
import * as auth from './auth.js';
import App from './App';

todoStorage.loadLocalTodos()
auth.useAccount.subscribe(it => {
    if(!it.ok) return
    const u = it.user
    u.getIdToken(true).then(idToken => {
        console.log('syncing...')
        todoStorage.syncTodos(idToken)
    })
})

const root = ReactDOM.createRoot(document.getElementById('root'));
/*root.render(
    <App />
);*/
root.render(
    <App />
);
