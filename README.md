# FERN TO-DO APP

A to-do/note-taking web app developed using the FERN (Firebase, Express.js, React, Node.js) stack.

![image](https://github.com/user-attachments/assets/25413349-a097-4296-aac7-473d662432cb)

## Features

1. Login with google
2. Notes are stored in the cloud and synchronized between different sessions for logged in accounts
4. When offline or not logged in, the notes are stored locally

## Running locally

```shell
cd front
npm install
npm run build
cd ../back
<add service account key to ./secrets/serviceAccountKey.json>
npm install
node index.js
```

Then open `http://localhost:2999` in your browser.

## Acknowledgements

1. [Express.js](https://expressjs.com)
2. [Firebase](https://firebase.google.com)
3. [Node.js](https://nodejs.org)
4. [Pure-UUID](https://github.com/rse/pure-uuid)
5. [React](https://react.dev)
6. [Zustand](https://github.com/pmndrs/zustand)