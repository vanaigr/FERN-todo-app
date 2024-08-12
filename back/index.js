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
const auth = firebaseApp.auth()

app.use(cors({ origin: 'http://localhost:3000' }))

function err(s, details) {
    if(typeof(details) == 'string') details = { msg: details }
    return s.status(403).json(details)
}

function handleAuth(q, s, n) {
    const token = q.get('Authorization')
    console.log(token)
    auth.verifyIdToken(token)
        .then(decodedToken => {
            console.log(decodedToken.uid)
            q.myUid = decodedToken.uid
            n()
        })
        .catch(e => {
            console.error(e)
            err(s, 'provided auth token is invalid')
        })
}

function encodeFirebase(str) {
    var r = Buffer.from(str, 'utf16le').toString('base64')
    r = r.replace(/\//g, '_')
    const str2 = decodeFirebase(r)
    if(str !== str2) throw 'buffer encoding is not correct'
    return r
}

function decodeFirebase(str) {
    str = str.replace(/_/g, '/')
    str = Buffer.from(str, 'base64').toString('utf16le')
    return str
}


// [{ id: string, rev: string, content: string?, createdAt: number? }]
// if revision is not present, then remove the note and put null
// if content is not present, then check if it is up-to-date using `rev`
//    if not present put null
//    if up-to-date put {}
//    if not up-to-date put { content, createdAt, rev from db }
// if content is present, then update the note and put {}
// if db has a note that is not in the request, then put new note
app.put('/sync-notes', express.json(), handleAuth, async function(q, s) {
    const uid = q.myUid
    const body = q.body
    console.log(JSON.stringify(body))

    const ids = {}
    for(let i = 0; i < body.length; i++) {
        const it = body[i]
        const id = it.id
        if(ids[id]) return err(s, { msg: 'duplicate id', id })
        ids[id] = i
        if(typeof(id) !== 'string' || id === '') return err(s, { msg: 'id must be a non-empty string', i })

        const rev = it.rev
        if(rev != null) {
            if(typeof(rev) !== 'string' || rev === '') return err(s, { msg: 'rev must be a non-empty string', i })
            const content = it.content
            if(content != null && typeof(content) !== 'string') return err(s, { msg: 'content (if present) must be a string', i })
            const createdAt = it.createdAt
            if(content != null && typeof(createdAt) !== 'number') return err(s, { msg: 'createdAt must be a number if content is present', i })
        }
    }

    const dbNotes = (await db.ref('notes/' + uid).get()).val() ?? {}

    // TODO: is not waiting on database updates appropriate? There's also no transactions...
    for(let i = 0; i < body.length; i++) {
        const it = body[i]
        const eid = encodeFirebase(it.id)
        const note = dbNotes[eid]
        if(note == null && it.rev != null) {
            const newNote = { rev: it.rev, content: it.content, createdAt: it.createdAt }
            dbNotes[eid] = newNote
            db.ref('notes/' + uid + '/' + eid).set(newNote)
        }
        else if(note != null && it.rev == null) {
            delete dbNotes[eid]
            db.ref('notes/' + uid + '/' + eid).remove()
        }
    }

    const result = {}
    for(const eid in dbNotes) {
        const id = decodeFirebase(eid)
        const note = dbNotes[eid]
        const bi = ids[id]
        if(!bi) {
            result[id] = { rev: note.rev, content: note.content, createdAt: note.createdAt }
        }
        else {
            const it = body[bi]
            if(it.rev === note.rev) {
                result[id] = {}
            }
            else {
                result[id] = { rev: note.rev, content: note.content, createdAt: note.createdAt }
            }
        }
    }
    console.log(JSON.stringify(result))

    return s.json(result)
})

app.listen(2999, () => {
    console.log('Started')
})
