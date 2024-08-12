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
        res.push([it.id, contents.rev, contents.content, it.createdAt.getTime(), it.deleted ? 1 : 0, it.contents.syncedState])
    }
    localStorage.setItem('todos', JSON.stringify(res))
    savedTick = tick
})

function clearLocalTodos() {
    localStorage.removeItem('todos')
}

export function loadLocalTodos() {
    try {
        const newTodosJ = JSON.parse(localStorage.getItem('todos'))
        const newTodos = {}
        for(var i = 0; i < newTodosJ.length; i++) {
            const it = newTodosJ[i]
            const todo = new todos.Todo(it[0], it[1], it[2], new Date(it[3]), it[5])
            if(it[4]) todo.delete()
            newTodos[todo.id] = todo
        }

        const newChangedTick = todos.getTodosChangedTick() + 1
        const prevSavedTick = savedTick
        savedTick = newChangedTick
        try {
            todos.setTodos(newTodos)
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

    const newTodos = {}
    for(const id in result) {
        const r = result[id]
        const it = orig[id] ?? {}

        const itContents = it.contents ?? {}
        newTodos[id] = new todos.Todo(
            id,
            r.rev ?? it.rev,
            r.content ?? itContents.content,
            r.createdAt ?? it.createdAt,
            todos.syncStatus.synced
        )
    }

    todos.setTodos(newTodos)
}

const serverUrl = 'http://localhost:2999'
async function syncTodosForToken(idToken) {
    const tds = todos.allTodos
    const todosR = []
    for(const id in tds) {
        const it = tds[id]
        if(it.deleted) {
            todosR.push({ id: it.id })
        }
        else if(it.contents.syncedState === todos.syncStatus.synced) {
            todosR.push({ id: it.id, rev: it.rev })
        }
        else {
            const contents = it.contents
            todosR.push({ id: it.id, rev: it.rev, content: contents.content, createdAt: it.createdAt.getTime() })
        }
    }

    try {
        const response = await fetch(new URL('sync-notes', serverUrl), {
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
}

export async function syncTodos() {
    const it = auth.useAccount.getState()
    if(!it.ok) return
    const u = it.user
    const idToken = await u.getIdToken(true)
    await syncTodosForToken(idToken)
}

auth.onBeforeLogout(async() => await syncTodos())

auth.useAccount.subscribe(it => {
    syncTodos()
    if(!it.ok) {
        clearLocalTodos()
        todos.setTodos({})
    }
})
