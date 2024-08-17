import { create } from "zustand"
import * as todos from "./todos.js"
import * as auth from "./auth.js"

var savedTick
todos.onTodosChanged((tick) => {
    if(tick === savedTick) return
    const res = []
    for(var key in todos.allTodos) {
        const it = todos.allTodos[key]
        const contents = it.contents
        res.push([it.id, contents.content, contents.rev, it.createdAt.getTime(), it.deleted ? 1 : 0, it.contents.SyncStatus])
    }
    localStorage.setItem('todos', JSON.stringify({ ver: 2, res }))
    savedTick = tick
})

function clearLocalTodos() {
    localStorage.removeItem('todos')
}

export function loadLocalTodos() {
    try {
        const newTodosJ = JSON.parse(localStorage.getItem('todos'))
        if(newTodosJ == null) return
        if(newTodosJ.ver !== 2) {
            localStorage.removeItem('todos')
            return
        }
        const stored = newTodosJ.res
        const newData = {}
        for(var i = 0; i < stored.length; i++) {
            const it = stored[i]
            newData[it[0]] = { content: it[1], rev: it[2], createdAt: new Date(it[3]), deleted: it[4], syncState: it[5] }
        }

        const newChangedTick = todos.getTodosChangedTick() + 1
        const prevSavedTick = savedTick
        savedTick = newChangedTick
        try {
            todos.setTodosData(newData)
        }
        catch(e) {
            savedTick = prevSavedTick
            throw e
        }
    }
    catch(e) {
        console.error(e)
    }
}

async function handleSyncResponse(todosRequest, response) {
    const orig = todos.allTodos

    const result = await response.json().catch(e => { console.error(e) })
    if(!response.ok || !result) {
        return console.error("Could not sync: " + (typeof(result) == 'object' ? JSON.stringify(result) : result))
    }

    const newData = {}
    for(const id in result) {
        const r = result[id]
        const it = orig[id]
        if(r.content == null) {
            newData[id] = { syncState: todos.SyncStatus.synced }
        }
        else if(it) {
            newData[id] = { content: r.content, rev: r.rev, syncState: todos.SyncStatus.synced }
        }
        else {
            newData[id] = { content: r.content, rev: r.rev, createdAt: new Date(r.createdAt), syncState: todos.SyncStatus.synced }
        }
    }

    todos.setTodosData(newData)
}

const local = true
const serverUrl = local ? 'http://localhost:2999' : window.location.origin

async function syncTodosForToken(force, idToken) {
    const tds = todos.allTodos
    const todosR = []
    let notSynced = false
    for(const id in tds) {
        const it = tds[id]
        if(it.deleted) {
            notSynced = true
            todosR.push({ id: it.id })
        }
        else if(todos.SyncStatus.shouldSync(it.contents.syncState)) {
            notSynced = true
            const contents = it.contents
            todosR.push({ id: it.id, rev: contents.rev, content: contents.content, createdAt: it.createdAt.getTime() })
        }
        else {
            todosR.push({ id: it.id, rev: it.contents.rev })
        }
    }

    if(!force && !notSynced) return

    preventAutosave = true
    try {
        const response = await fetch(new URL('api/sync-notes', serverUrl), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': idToken,
            },
            body: JSON.stringify(todosR)
        })
        await handleSyncResponse(todosR, response)
    }
    catch(e) {
        console.error(e)
    }
    finally {
        preventAutosave = false
    }
}

export async function syncTodos(force) {
    const it = auth.useAccount.getState()
    if(!it.ok) return
    const u = it.user
    const idToken = await u.getIdToken(true)
    await syncTodosForToken(force, idToken)
}

auth.onBeforeLogout(async() => {
    await syncTodos()
    clearLocalTodos()
    todos.setTodosData({})
})

auth.useAccount.subscribe(it => syncTodos(true))

var prevSaveTimer, prevSaveInterval, preventAutosave
function transitionAutosave() {
    if(!preventAutosave) syncTodos()
    prevSaveInterval = setInterval(() => {
        if(!preventAutosave) syncTodos(true)
    }, 5000)
}
function resetAutosave() {
    clearTimeout(prevSaveTimer)
    clearInterval(prevSaveInterval)
    prevSaveTimer = setTimeout(transitionAutosave, 1000)
}
todos.onTodosChanged(resetAutosave)
