const express = require('express')
const cors = require('cors')
const app = express()

const firebaseAdmin = require('firebase-admin')
const accKey = require('./secrets/serviceAccountKey.json')

const firebaseApp = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(accKey),
    databaseURL: 'https://fern-test-d7b52-default-rtdb.firebaseio.com'
})

const db = firebaseApp.database()

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

function err(s, details) {
    if(typeof(details) == 'string') details = { msg: details }
    return s.status(403).json(details)
}

app.post('/*', function(q, s) {
    if(!q.is('json')) return err(s, 'request is not json')
    const json = q.body

    const name = json.name
    if(typeof(name) != 'string' || name == '') {
        return err(s, 'name is incorrect')
    }

    const data = json.data
    if(typeof(data) != 'object') {
        return err(s, 'data is incorrect')
    }

    db.ref('test/' + json.name).set(json.data)
    return s.json({ msg: 'data written' })
})

app.listen(2999, () => {
    console.log('Started')
})
